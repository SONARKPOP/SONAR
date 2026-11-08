import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock
from collectors.source_policy import approved_original, public_artist_scope
from collectors.youtube import resolve
from collectors.publish import publish


class SourcePolicyTests(unittest.TestCase):
    def test_creator_brand_and_public_sources_require_explicit_review(self):
        for kind in ('creator', 'brand', 'public-institution'):
            source = {'official':False, 'publisherReview':{
                'status':'approved', 'kind':kind, 'evidenceUrl':'https://example.com/original'}}
            self.assertTrue(approved_original(source))
            source['publisherReview']['status'] = 'pending'
            self.assertFalse(approved_original(source))

    def test_fan_reupload_and_gossip_sources_are_rejected_before_api(self):
        for kind in ('fan', 'reupload', 'gossip', 'aggregator'):
            source = {'id':'excluded', 'official':False, 'collectionEnabled':True,
                      'publisherReview':{'status':'approved','kind':kind,'evidenceUrl':'https://example.com'}}
            self.assertFalse(approved_original(source))
            api = Mock()
            self.assertEqual(resolve(api,{'channels':[source]}),{})
            api.get.assert_not_called()

    def test_existing_unapproved_record_is_not_republished(self):
        record = {'id':'youtube__abc123DEF45','platform':'youtube','platformId':'abc123DEF45',
                  'channelId':'fan','publishedAt':'2026-11-05T00:00:00Z','groupIds':['a']}
        config = {'groups':[{'id':'a'}],'members':[],'channels':[{'id':'fan','official':False}], 'taxonomy':{}}
        with tempfile.TemporaryDirectory() as tmp:
            publish([record],config,output=tmp)
            self.assertEqual(list((Path(tmp)/'content').glob('*.json')),[])

    def test_public_catalog_removes_boy_sources_and_keeps_mixed_guest_videos(self):
        config = {
            'groups':[{'id':'girl','gender':'girl','artistType':'duo'},
                      {'id':'boy','gender':'boy','artistType':'group'},
                      {'id':'mixed','gender':'mixed','artistType':'duo'},
                      {'id':'solo','gender':'girl','artistType':'solo'}],
            'members':[{'id':'g','groupId':'girl'},{'id':'b','groupId':'boy'}],
            'channels':[{'id':'boy-source','official':True,'groupIds':['boy']},
                        {'id':'host','official':False,'groupIds':[],
                         'publisherReview':{'status':'approved','kind':'creator','evidenceUrl':'https://example.com/original'}}],
            'taxonomy':{},
        }
        scope=public_artist_scope(config)
        self.assertEqual([g['id'] for g in scope['groups']],['girl','mixed','solo'])
        self.assertEqual([c['id'] for c in scope['channels']],['host'])
        def video(key,channel,groups,members):
            return {'id':'youtube__'+key,'platform':'youtube','platformId':key,'channelId':channel,
                    'groupIds':groups,'memberIds':members,'title':'Guest interview','publishedAt':'2026-11-05T00:00:00Z',
                    'category':'external','format':'video','tags':[],'subtypes':[]}
        with tempfile.TemporaryDirectory() as tmp:
            output=Path(tmp)
            publish([video('boy','boy-source',['boy'],['b']),video('boy-guest','host',['boy'],['b']),
                     video('shared','host',['girl','boy'],['g','b'])],config,output=output)
            self.assertEqual([p.stem for p in (output/'content').glob('*.json')],['youtube__shared'])
            shared=json.loads((output/'content/youtube__shared.json').read_text(encoding='utf-8'))
            self.assertEqual(shared['groupIds'],['girl'])
            self.assertEqual(shared['memberIds'],['g'])
            self.assertFalse((output/'groups/boy.json').exists())
