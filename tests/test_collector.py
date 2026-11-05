import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from collectors.youtube import YouTube, normalize, mentions, read_config, collect, refresh_live
from collectors.publish import publish

class CollectorTests(unittest.TestCase):
    def setUp(self):
        self.config = read_config()
        self.channel = next(c for c in self.config['channels'] if c['id']=='aespa-official')
        self.raw = {'id':'abc123', 'snippet':{'title':'aespa Supernova MV', 'description':'KARINA', 'publishedAt':'2026-11-05T01:00:00Z','channelTitle':'aespa','channelId':'resolved'}, 'contentDetails':{'duration':'PT3M'},'status':{'privacyStatus':'public'}}

    def test_secret_required(self):
        with self.assertRaises(ValueError): YouTube('')

    def test_alias_boundaries(self):
        self.assertFalse(mentions('Live stream', 'IVE'))
        self.assertTrue(mentions('[IVE] 아이브', 'IVE'))

    def test_normalize_official_music_and_member(self):
        self.raw['snippet']['title']='aespa KARINA Supernova MV'
        v=normalize(self.raw,self.channel,self.config)
        self.assertEqual(v['id'],'youtube__abc123')
        self.assertEqual(v['category'],'music')
        self.assertIn('aespa-karina',v['memberIds'])

    def test_external_multi_group(self):
        self.raw['snippet']['title']='aespa × IVE 토크'
        v=normalize(self.raw,self.config['channels'][-1],self.config)
        self.assertEqual(v['groupIds'],['aespa','ive'])
        self.assertEqual(v['category'],'external')

    def test_duration_does_not_imply_short(self):
        self.raw['contentDetails']['duration']='PT35S'
        self.assertEqual(normalize(self.raw,self.channel,self.config)['format'],'video')
        self.raw['snippet']['description']='#shorts'
        self.assertEqual(normalize(self.raw,self.channel,self.config)['category'],'shorts')

    def test_live_lifecycle(self):
        self.raw['liveStreamingDetails']={'scheduledStartTime':'2026-11-06T00:00:00Z'}
        v=normalize(self.raw,self.channel,self.config)
        self.assertEqual(v['liveStatus'],'upcoming')
        self.raw['liveStreamingDetails']['actualStartTime']='2026-11-06T00:00:00Z'
        self.assertEqual(normalize(self.raw,self.channel,self.config)['liveStatus'],'live')
        self.raw['liveStreamingDetails']['actualEndTime']='2026-11-06T01:00:00Z'
        v=normalize(self.raw,self.channel,self.config)
        self.assertEqual(v['liveStatus'],'ended')
        self.assertEqual(v['format'],'live')

    def test_override_cannot_spoof_identity_or_live(self):
        with self.assertRaises(ValueError):normalize(self.raw,self.channel,self.config,{'liveStatus':'live'})
        v=normalize(self.raw,self.channel,self.config,{'tags':['edited'],'subtypes':['퍼포먼스']})
        self.assertEqual(v['tags'],['edited'])

    def test_publish_dedup_links_and_no_fake_live(self):
        v=normalize(self.raw,self.channel,self.config,{'groupIds':['aespa','ive']})
        with tempfile.TemporaryDirectory() as tmp:
            publish([v,v],self.config,output=tmp)
            path=Path(tmp)
            self.assertEqual(len(list((path/'content').glob('*.json'))),1)
            for gid in ['aespa','ive']:
                self.assertEqual(json.loads((path/'groups'/f'{gid}.json').read_text(encoding='utf-8'))['items'][0]['id'],v['id'])
            self.assertEqual(json.loads((path/'live.json').read_text())['items'],[])

    def test_playlist_pagination(self):
        api=YouTube('test-not-a-secret')
        with patch.object(api,'get',side_effect=[{'items':[{'id':1}],'nextPageToken':'next'},{'items':[{'id':2}]}]) as get:
            self.assertEqual(list(api.pages('playlistItems',limit=2)),[{'id':1},{'id':2}])
            self.assertEqual(get.call_args.kwargs['pageToken'],'next')

    def test_video_batching(self):
        api=YouTube('test-not-a-secret')
        with patch.object(api,'get',return_value={'items':[]}) as get:
            api.videos([str(i) for i in range(101)])
            self.assertEqual(get.call_count,3)

    def test_deleted_records_pruned(self):
        with tempfile.TemporaryDirectory() as tmp:
            v=normalize(self.raw,self.channel,self.config)
            publish([v],self.config,output=tmp)
            publish([],self.config,output=tmp)
            self.assertFalse(list((Path(tmp)/'content').glob('*.json')))

    def test_full_collection_mocked(self):
        api=YouTube('test-not-a-secret')
        resolved={**self.channel,'platformId':'resolved','uploadsPlaylistId':'uploads','collectionEnabled':True}
        config={**self.config,'channels':[resolved],'collectionGroupIds':['aespa']}
        with tempfile.TemporaryDirectory() as tmp, patch('collectors.youtube.read_config',return_value=config), patch('collectors.youtube.resolve',return_value={'resolved':resolved}), patch('collectors.youtube.DATA',Path(tmp)), patch('collectors.youtube.publish') as pub, patch.object(api,'pages',return_value=iter([])), patch.object(api,'videos',return_value=[self.raw]):
            collect(api)
            self.assertEqual(len(pub.call_args.args[0]),1)

    def test_refresh_clears_ended_live_and_schedule(self):
        self.channel['platformId']='resolved'
        self.raw['liveStreamingDetails']={'scheduledStartTime':'2026-11-06T00:00:00Z'}
        v=normalize(self.raw,self.channel,self.config)
        with tempfile.TemporaryDirectory() as tmp:
            publish([v],self.config,output=tmp)
            api=YouTube('test-not-a-secret')
            self.raw['liveStreamingDetails']['actualStartTime']='2026-11-06T00:00:00Z'
            with patch('collectors.youtube.DATA',Path(tmp)), patch.object(api,'videos',return_value=[self.raw]):
                refresh_live(api)
                self.assertEqual(len(json.loads((Path(tmp)/'live.json').read_text(encoding='utf-8'))['items']),1)
                self.assertEqual(json.loads((Path(tmp)/'groups/aespa.json').read_text(encoding='utf-8'))['events'],[])
                self.raw['liveStreamingDetails']['actualEndTime']='2026-11-06T01:00:00Z'
                refresh_live(api)
                self.assertEqual(json.loads((Path(tmp)/'live.json').read_text(encoding='utf-8'))['items'],[])
                self.assertEqual(json.loads((Path(tmp)/'live-candidates.json').read_text())['ids'],[])

    def test_paused_source_keeps_archive_without_asserting_live(self):
        config={**self.config,'channels':[{**self.channel,'collectionEnabled':False}]}
        v=normalize(self.raw,self.channel,self.config)
        v.update(liveStatus='live',actualStartTime='2026-11-05T00:00:00Z')
        with tempfile.TemporaryDirectory() as tmp:
            publish([v],config,output=tmp)
            api=YouTube('test-not-a-secret')
            with patch('collectors.youtube.read_config',return_value=config), patch('collectors.youtube.resolve',return_value={}), patch('collectors.youtube.DATA',Path(tmp)), patch.object(api,'videos',return_value=[]) as videos, patch('collectors.youtube.publish') as pub:
                collect(api)
                self.assertEqual(videos.call_args.args[0],set())
                self.assertEqual(pub.call_args.args[0][0]['id'],v['id'])
                self.assertEqual(pub.call_args.args[0][0]['liveStatus'],'none')

if __name__=='__main__':unittest.main()
