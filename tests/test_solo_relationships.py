import tempfile
import unittest
from pathlib import Path
import json
from collectors.registry import load_config
from collectors.youtube import normalize, classify
from collectors.publish import publish
from collectors.individual_activity import classify_individual, solo_review_candidates


class SoloRelationshipsTests(unittest.TestCase):
    def test_explicit_song_clip_formats_are_music_and_behind_still_wins(self):
        for label in ('Official Video','Live Clip','Special Clip','Lyric Video','Official Audio'):
            self.assertEqual(classify('Artist - Song '+label,'',True)[0],'music')
        self.assertEqual(classify('Artist Official Video Behind','',True)[0],'own')

    def test_parent_channel_routes_only_explicit_solo_member(self):
        config=load_config()
        source=next(c for c in config['channels'] if c['id']=='gidle-official')
        raw={'id':'abc123DEF45','snippet':{'title':"MINNIE 'HER' Official Music Video",
             'description':'','publishedAt':'2026-01-01T00:00:00Z','channelTitle':'i-dle'}}
        video=normalize(raw,source,config)
        self.assertEqual(set(video['groupIds']),{'gidle','minnie'})
        self.assertIn('gidle-minnie',video['memberIds'])
        self.assertNotIn('yuqi',video['groupIds'])
        artists={artist['id']:artist for artist in config['groups']}
        members={member['id']:member for member in config['members']}
        self.assertEqual(classify_individual(video,source,artists,members)['kind'],'solo-music')
        raw['snippet']['title']='i-dle group behind the scenes with MINNIE'
        group_video=normalize(raw,source,config)
        self.assertNotIn('minnie',group_video['groupIds'])
        self.assertIsNone(classify_individual(group_video,source,artists,members))
        raw['snippet']['title']='i-dle group behind the scenes'
        self.assertEqual(normalize(raw,source,config)['groupIds'],['gidle'])

    def test_solo_and_parent_share_one_canonical_video(self):
        config=load_config()
        source=next(c for c in config['channels'] if c['id']=='hwasa-official')
        raw={'id':'abc123DEF45','snippet':{'title':'HWASA MV','description':'',
             'publishedAt':'2026-01-01T00:00:00Z','channelTitle':'HWASA'}}
        video=normalize(raw,source,config)
        self.assertEqual(set(video['groupIds']),{'hwasa','mamamoo'})
        with tempfile.TemporaryDirectory() as tmp:
            publish([video,video],config,output=tmp)
            self.assertEqual(len(list((Path(tmp)/'content').glob('*.json'))),1)
            for gid in ('hwasa','mamamoo'):
                index=json.loads((Path(tmp)/'groups'/f'{gid}.json').read_text(encoding='utf-8'))
                self.assertEqual(len(index['items']),1)

    def test_unrelated_cover_does_not_infer_an_ambiguous_soloist(self):
        config=load_config()
        source=next(c for c in config['channels'] if c['id']=='nmixx-official')
        raw={'id':'abc123DEF45','snippet':{'title':'MINNIE cover','description':'',
             'publishedAt':'2026-01-01T00:00:00Z','channelTitle':'NMIXX'}}
        self.assertNotIn('minnie',normalize(raw,source,config)['groupIds'])

    def test_review_uses_sustained_activity_or_a_release_instead_of_upload_gap_alone(self):
        def video(id,date,kind):
            return {'channelId':'a','platformId':id,'publishedAt':date+'T00:00:00Z',
                    'individualActivity':{'memberId':'a-person','groupIds':['a'],'kind':kind}}
        source={'a':{'official':True,'groupIds':['a']}}
        first=video('one','2024-01-01','individual')
        second=video('two','2024-09-01','individual')
        third=video('three','2025-01-01','individual')
        self.assertEqual(solo_review_candidates([first,second],source,{}),[])
        self.assertEqual(solo_review_candidates([first,second,third],source,{})[0]['reason'],'individual-activity-over-one-year')
        release=video('release','2024-01-01','solo-music')
        self.assertEqual(solo_review_candidates([release],source,{})[0]['reason'],'official-solo-release')
