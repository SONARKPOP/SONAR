import json
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import patch
from collectors.youtube import YouTube, normalize, mentions, read_config, collect, refresh_live, prune_stale_attribution
from collectors.publish import publish

class CollectorTests(unittest.TestCase):
    def setUp(self):
        self.config = read_config()
        self.channel = next(c for c in self.config['channels'] if c['id']=='aespa-official')
        self.raw = {'id':'abc123DEF45', 'snippet':{'title':'aespa Supernova MV', 'description':'KARINA', 'publishedAt':'2026-11-05T01:00:00Z','channelTitle':'aespa','channelId':'resolved'}, 'contentDetails':{'duration':'PT3M'},'status':{'privacyStatus':'public'}}

    def test_secret_required(self):
        with self.assertRaises(ValueError): YouTube('')

    def test_alias_boundaries(self):
        self.assertFalse(mentions('Live stream', 'IVE'))
        self.assertTrue(mentions('[IVE] 아이브', 'IVE'))

    def test_normalize_official_music_and_member(self):
        self.raw['snippet']['title']='aespa KARINA Supernova MV'
        v=normalize(self.raw,self.channel,self.config)
        self.assertEqual(v['id'],'youtube__abc123DEF45')
        self.assertEqual(v['category'],'music')
        self.assertIn('aespa-karina',v['memberIds'])

    def test_external_multi_group(self):
        self.raw['snippet']['title']='aespa × IVE 토크'
        v=normalize(self.raw,self.config['channels'][-1],self.config)
        self.assertEqual(v['groupIds'],['aespa','ive'])
        self.assertEqual(v['category'],'external')

    def test_official_group_mention_does_not_imply_appearance(self):
        riize = next(c for c in self.config['channels'] if c['id']=='riize-official')
        self.raw['snippet']['title'] = "완전 인썸니아야 지금 | RIIZE 'Insomnia' 비하인드"
        video = normalize(self.raw, riize, self.config)
        self.assertEqual(video['groupIds'], ['riize'])
        old = {**video, 'groupIds':['riize','xum']}
        self.assertEqual(prune_stale_attribution(old, riize, self.config)['groupIds'], ['riize'])
        self.assertEqual(prune_stale_attribution(old, riize, self.config, {'groupIds':old['groupIds']}), old)
        self.raw['snippet']['title'] = 'Hearts2Hearts song reaction | RIIZE'
        self.assertEqual(normalize(self.raw, riize, self.config)['groupIds'], ['riize'])
        self.raw['snippet']['title'] = 'RIIZE × Hearts2Hearts dance challenge'
        self.assertEqual(normalize(self.raw, riize, self.config)['groupIds'], ['hearts2hearts','riize'])
        self.raw['snippet']['title'] = 'Episode 1'
        self.raw['snippet']['description'] = 'Guests: Hearts2Hearts'
        self.assertEqual(normalize(self.raw, riize, self.config)['groupIds'], ['hearts2hearts','riize'])

    def test_xum_search_alias_does_not_tag_unrelated_broadcasts(self):
        external = next(c for c in self.config['channels'] if not c['official'])
        self.raw['snippet']['title'] = '라잇썸 LIGHTSUM 직캠'
        video = normalize(self.raw, external, self.config)
        self.assertEqual(video['groupIds'], ['lightsum'])
        old = {**video, 'groupIds':['lightsum','xum']}
        self.assertEqual(prune_stale_attribution(old, external, self.config)['groupIds'], ['lightsum'])
        self.raw['snippet']['title'] = 'XUM (썸) interview'
        self.assertEqual(normalize(self.raw, external, self.config)['groupIds'], ['xum'])

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

    def test_browse_previews_are_bounded_and_keep_month_archive(self):
        video = normalize(self.raw,self.channel,self.config)
        current = datetime.now(timezone.utc)
        recent = [
            {**video,'id':f'youtube__new{i:02}','platformId':f'new{i:02}',
             'publishedAt':(current-timedelta(minutes=i+1)).isoformat()}
            for i in range(30)
        ]
        old = {**video,'id':'youtube__old','platformId':'old','publishedAt':'2022-01-01T00:00:00Z'}
        with tempfile.TemporaryDirectory() as tmp:
            output = Path(tmp)
            publish([old,*recent],self.config,output=output)
            preview = json.loads((output/'browse/groups/home/aespa.json').read_text(encoding='utf-8'))
            shared = json.loads((output/'browse/home.json').read_text(encoding='utf-8'))
            archive = json.loads((output/'groups/aespa.json').read_text(encoding='utf-8'))
            catalog = json.loads((output/'catalog.json').read_text(encoding='utf-8'))
            group = next(group for group in catalog['groups'] if group['id']=='aespa')
            self.assertEqual(len(preview['items']),6)
            self.assertEqual(len(shared['items']),4)
            self.assertEqual(preview['items'],archive['items'][:6])
            self.assertEqual(archive['items'][-1]['id'],old['id'])
            self.assertIn('2022',group['archiveYears'])
            self.assertIn('2022-01',catalog['browse']['months'])

    def test_ambiguous_yves_alias_is_searchable_but_not_an_appearance(self):
        external = next(c for c in self.config['channels'] if not c['official'])
        self.raw['snippet']['title']='크리스마스 이브 특집'
        record=normalize(self.raw,external,self.config)
        self.assertNotIn('yves',record['groupIds'])
        old={**record,'groupIds':['yves','loona']}
        self.assertEqual(prune_stale_attribution(old,external,self.config)['groupIds'],[])
        self.raw['snippet']['title']='이브 (Yves) 공식 인터뷰'
        self.assertIn('yves',normalize(self.raw,external,self.config)['groupIds'])

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

    def test_station_refresh_is_separate_and_clears_ended_station(self):
        self.channel['platformId']='resolved'
        normal={**self.raw,'snippet':{**self.raw['snippet'],'title':'aespa birthday live'},'liveStreamingDetails':{'actualStartTime':'2026-11-06T00:00:00Z'}}
        station={**normal,'id':'station1234','snippet':{**normal['snippet'],'title':'aespa Playlist Station'}}
        with tempfile.TemporaryDirectory() as tmp:
            publish([normalize(v,self.channel,self.config) for v in [normal,station]],self.config,output=tmp)
            api=YouTube('test-not-a-secret')
            with patch('collectors.youtube.DATA',Path(tmp)),patch.object(api,'videos',return_value=[normal,station]):
                refresh_live(api)
                feed=json.loads((Path(tmp)/'live.json').read_text(encoding='utf-8'))
                self.assertEqual(len(feed['items']),1);self.assertEqual(len(feed['stations']),1)
                station['liveStreamingDetails']={**station['liveStreamingDetails'],'actualEndTime':'2026-11-06T01:00:00Z'}
                refresh_live(api)
                feed=json.loads((Path(tmp)/'live.json').read_text(encoding='utf-8'))
                self.assertEqual(len(feed['items']),1);self.assertEqual(feed['stations'],[])

if __name__=='__main__':unittest.main()
