import copy
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock,patch
from collectors.targeted import collect_pending,pending_sources
from collectors.publish import publish,write

class TargetedTests(unittest.TestCase):
    def config(self):
        review={'status':'approved','kind':'creator','evidenceUrl':'https://example.com/original'}
        return {'groups':[{'id':'a','name':'Artist A','aliases':['Artist A']}],'members':[],
            'taxonomy':{'categories':['own','external'],'formats':['video','short','live']},
            'channels':[{'id':'owner','official':True,'groupIds':['a'],'handle':'@owner','collectionEnabled':False},
                {'id':'new','name':'Publisher','platformId':'UCnew','uploadsPlaylistId':'UUnew','official':False,'groupIds':[],
                 'collectionEnabled':True,'publisherReview':review,'seedVideoIds':['seed1234567']} ]}

    def test_pending_does_not_recheck_unchanged_failed_identity(self):
        c=self.config();prior={'channels':[copy.deepcopy(s) for s in c['channels']]}
        prior['channels'][1]['unavailableReason']='channel-name-needs-review'
        self.assertEqual(pending_sources(c,prior),[])
        c['channels'][1]['platformId']='UCchanged'
        self.assertEqual([s['id'] for s in pending_sources(c,prior)],['new'])

    def test_targeted_preserves_archive_live_time_and_rejects_wrong_seed_publisher(self):
        c=self.config();old={'id':'youtube__old12345678','platform':'youtube','platformId':'old12345678','channelId':'owner',
            'groupIds':['a'],'memberIds':[],'title':'Old Artist A','publishedAt':'2024-01-01T00:00:00Z','category':'own','format':'video','tags':[]}
        def raw(vid,channel,title):return {'id':vid,'snippet':{'title':title,'channelId':channel,'channelTitle':'Publisher','publishedAt':'2026-11-06T00:00:00Z'},'status':{'privacyStatus':'public'}}
        api=Mock();api.budget=None
        api.get.return_value={'items':[]}
        api.videos.return_value=[raw('new12345678','UCnew','Artist A interview'),raw('seed1234567','UCwrong','Artist A')]
        with tempfile.TemporaryDirectory() as tmp:
            output=Path(tmp);publish([old],c,output=output)
            live={'updatedAt':'2020-01-01T00:00:00Z','items':[]};write(output/'live.json',live)
            with patch('collectors.youtube.resolve',return_value={'UCnew':c['channels'][1],'UCwrong':{**c['channels'][1],'platformId':'UCwrong'}}):
                self.assertTrue(collect_pending(api,c,{'videos':{}},output,{'channels':[c['channels'][0]]}))
            self.assertTrue((output/'content/youtube__old12345678.json').exists())
            self.assertTrue((output/'content/youtube__new12345678.json').exists())
            self.assertFalse((output/'content/youtube__seed1234567.json').exists())
            self.assertEqual(json.loads((output/'live.json').read_text()),live)
            self.assertEqual(json.loads((output/'collection-report.json').read_text())['recordCount'],2)

    def test_insufficient_budget_makes_no_api_calls(self):
        api=Mock();api.budget.remaining.return_value=1
        self.assertFalse(collect_pending(api,self.config(),{'videos':{}},'.',{}))
        api.get.assert_not_called();api.videos.assert_not_called()

