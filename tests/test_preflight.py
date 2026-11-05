import contextlib
import io
import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from collectors.preflight import run, main
from collectors.registry import load_config
from collectors.youtube import normalize
from collectors.publish import DATA

class FakeAPI:
    def __init__(self):
        self.calls=[]
        self.channels={}
        self.sources={c.get('platformId') or c.get('handle'):c for c in load_config()['channels']}
    def get(self, resource, **params):
        self.calls.append((resource,params))
        if resource=='channels':
            identity=params.get('forHandle') or params['id']
            channel_id=params.get('id') or 'UC'+str(len(self.channels)+1).zfill(22)
            self.channels[channel_id]=identity
            return {'items':[{'id':channel_id,'snippet':{'title':self.sources.get(identity,{}).get('name','Official')},'contentDetails':{'relatedPlaylists':{'uploads':'UU'+channel_id[2:]}}}]}
        if resource=='playlistItems':
            return {'items':[{'contentDetails':{'videoId':'video-'+params['playlistId'][2:]}}]}
        raise AssertionError('Unexpected endpoint: '+resource)
    def videos(self,ids):
        self.calls.append(('videos',{'count':len(ids)}))
        return [{'id':v,'snippet':{'title':'Official upload','description':'','publishedAt':'2026-11-05T00:00:00Z','channelId':'UC'+v.removeprefix('video-'),'channelTitle':'Official'},'status':{'privacyStatus':'public'},'contentDetails':{'duration':'PT3M'}} for v in ids]

class PreflightTests(unittest.TestCase):
    def test_small_staged_collection_does_not_replace_public_data(self):
        before=(DATA/'catalog.json').read_bytes()
        api=FakeAPI()
        with tempfile.TemporaryDirectory() as tmp:
            output,report=run(api,limit=5,output=Path(tmp)/'review')
            expected=sum(c['official'] and c['collectionEnabled'] for c in load_config()['channels'])
            self.assertEqual(len(report['channels']),expected)
            self.assertEqual(report['videoCount'],expected)
            self.assertEqual(report['publicDataChanged'],False)
            self.assertEqual({v['reviewStatus'] for v in report['review']},{'pending'})
            self.assertTrue((output/'REPORT.md').exists())
            self.assertTrue((output/'data/groups/uspeer.json').exists())
            self.assertFalse(any(resource=='search' for resource,_ in api.calls))
            self.assertTrue(all(params['maxResults']==5 for resource,params in api.calls if resource=='playlistItems'))
            self.assertNotIn('"key":',json.dumps(report))
        self.assertEqual(before,(DATA/'catalog.json').read_bytes())

    def test_failed_api_does_not_write_partial_review(self):
        api=FakeAPI()
        with tempfile.TemporaryDirectory() as tmp, patch.object(api,'videos',side_effect=RuntimeError('test API failure')):
            output=Path(tmp)/'review'
            with self.assertRaises(RuntimeError):run(api,output=output)
            self.assertFalse(output.exists())

    def test_existing_review_rejected_without_spending_api_calls(self):
        api=FakeAPI()
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaises(ValueError):run(api,output=tmp)
        self.assertEqual(api.calls,[])

    def test_missing_key_exits_before_network(self):
        with patch.dict(os.environ,{},clear=True), patch('collectors.preflight.YouTube') as api, contextlib.redirect_stderr(io.StringIO()):
            with self.assertRaises(SystemExit) as exc:main([])
            self.assertEqual(exc.exception.code,1)
            api.assert_not_called()

    def test_ambiguous_member_alias_does_not_match_ordinary_english(self):
        config=load_config()
        channel=next(c for c in config['channels'] if c['id']=='rescene-official')
        raw={'id':'example','snippet':{'title':'A new video','description':'You may enjoy this.','publishedAt':'2026-11-05T00:00:00Z','channelTitle':'RESCENE'}}
        self.assertNotIn('rescene-may',normalize(raw,channel,config)['memberIds'])
        raw['snippet']['title']='RESCENE MAY behind'
        self.assertIn('rescene-may',normalize(raw,channel,config)['memberIds'])
        raw['snippet']['title']='New video';raw['snippet']['description']='#MAY'
        self.assertNotIn('rescene-may',normalize(raw,channel,config)['memberIds'])
        raw['snippet']['title']='New video #MAY'
        self.assertIn('rescene-may',normalize(raw,channel,config)['memberIds'])

    def test_underscore_member_variant_and_multi_member_tagging(self):
        config=load_config()
        channel=next(c for c in config['channels'] if c['id']=='hearts2hearts-official')
        raw={'id':'example','snippet':{'title':'H2H #A_NA #YEON #IAN','description':'','publishedAt':'2026-11-05T00:00:00Z','channelTitle':'Hearts2Hearts'}}
        self.assertEqual(set(normalize(raw,channel,config)['memberIds']),{'hearts2hearts-ana','hearts2hearts-yeon','hearts2hearts-ian'})

if __name__=='__main__':unittest.main()
