import unittest
from collectors.music_credits import build_catalog

class MusicCreditsTests(unittest.TestCase):
    def test_seed_deduplicates_repeated_release(self):
        import json
        from pathlib import Path
        seed=json.loads(Path('config/music-credits.json').read_text(encoding='utf-8'))
        data=build_catalog(seed, {a['artistId'] for a in seed['artists']})
        self.assertEqual(len(data['songs']), 350)
        self.assertEqual(len(data['tracks']), 35)
        self.assertEqual(len({x['recordingId'] for x in data['tracks'] if x['albumId'] in {a['id'] for a in data['albums'][:2]}}), 1)
        self.assertIsNone(data['recordings'][0]['roles']['producer'])
        self.assertEqual(len(data['works'][0]['roles']['lyricist']), 4)
        self.assertNotEqual(data['works'][0]['roles']['composer'],data['works'][0]['roles']['lyricist'])

    def test_unknown_registry_id_rejected(self):
        with self.assertRaises(ValueError):
            build_catalog({'artists':[{'artistId':'invented'}]}, {'twice'})

    def test_duplicate_entity_rejected(self):
        with self.assertRaises(ValueError):
            build_catalog({'artists':[], 'works':[{'id':'x'},{'id':'x'}]}, set())

    def test_network_client_requires_explicit_contact(self):
        from collectors.music_credits import MusicBrainzClient
        with self.assertRaises(ValueError):
            MusicBrainzClient('unused-cache', None)

    def test_disk_cache_prevents_network_request(self):
        import hashlib, json, tempfile
        from pathlib import Path
        from unittest.mock import patch
        from collectors.music_credits import MusicBrainzClient
        mbid='048de85d-5d29-45d8-a655-f4a4a48d39d5'
        url=f'https://musicbrainz.org/ws/2/recording/{mbid}?fmt=json&inc='
        with tempfile.TemporaryDirectory() as directory:
            path=Path(directory)/(hashlib.sha256(url.encode()).hexdigest()+'.json')
            path.write_text(json.dumps({'payload':{'id':mbid}}),encoding='utf-8')
            with patch('collectors.music_credits.urlopen') as network:
                client=MusicBrainzClient(directory,'SONAR/1.0 (operator@example.org)')
                self.assertEqual(client.get('recording',mbid)['id'],mbid)
                network.assert_not_called()

    def test_expansion_keeps_firstline_status_and_primary_conflict(self):
        import json
        from pathlib import Path
        seed=json.loads(Path('config/music-credits.json').read_text(encoding='utf-8'))
        sources={s['id']:s for s in seed['sources']}
        self.assertEqual(sources['namu-credits-suran']['verification'],'namuwiki_collected')
        wish=next(w for w in seed['works'] if w['title']=='Wish i could')
        people={p['id']:p['name'] for p in seed['persons']}
        self.assertEqual([people[p] for p in wish['roles']['composer']],['전용준','philtre'])
        self.assertIn('bugs-album-17460776',wish['sourceIds'])
        self.assertTrue(any('Dump adds SURAN' in r['reason'] for r in seed['review']))

    def test_unknown_source_and_wrong_role_layer_rejected(self):
        import json, copy
        from pathlib import Path
        seed=json.loads(Path('config/music-credits.json').read_text(encoding='utf-8'))
        artists={a['artistId'] for a in seed['artists']}
        bad=copy.deepcopy(seed);bad['works'][0]['sourceIds']=['invented-source']
        with self.assertRaisesRegex(ValueError,'evidence source'):
            build_catalog(bad,artists)
        bad=copy.deepcopy(seed);bad['recordings'][0]['roles']['composer']=[]
        with self.assertRaisesRegex(ValueError,'role layer'):
            build_catalog(bad,artists)
