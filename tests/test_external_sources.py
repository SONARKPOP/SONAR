import unittest
from collectors.youtube import normalize, read_config

class ExternalSourcesTests(unittest.TestCase):
    def test_external_performance_remains_in_external_dimension(self):
        config = read_config()
        channel = next(c for c in config['channels'] if c['id'] == 'dingo-music')
        raw = {'id':'abc123DEF45','snippet':{'title':'NMIXX performance','description':'IVE boilerplate','publishedAt':'2026-11-05T00:00:00Z','channelTitle':'?? ??'},'contentDetails':{'duration':'PT3M'}}
        video = normalize(raw,channel,config)
        self.assertEqual(video['category'],'music')
        self.assertEqual(video['contentTypes'],['external'])
        self.assertEqual(video['externalType'],'song')
        self.assertEqual(video['groupIds'],['nmixx'])
        self.assertEqual(video['memberIds'],[])

    def test_bare_member_name_cannot_identify_external_artist(self):
        config = read_config()
        channel = next(c for c in config['channels'] if c['id'] == 'its-live')
        raw = {'id':'abc123DEF45','snippet':{'title':'Crush & MINAMI performance','description':'','publishedAt':'2026-11-05T00:00:00Z','channelTitle':"it's Live"},'contentDetails':{'duration':'PT3M'}}
        video = normalize(raw,channel,config)
        self.assertEqual(video['groupIds'],[])
        self.assertEqual(video['memberIds'],[])

    def test_program_rules_are_scoped_to_publisher(self):
        config = read_config()
        raw = {'id':'abc123DEF45','snippet':{'title':'[Relay Dance] NMIXX performance','description':'','publishedAt':'2026-11-05T00:00:00Z','channelTitle':'M2'}}
        m2 = next(c for c in config['channels'] if c['id']=='m2')
        video = normalize(raw,m2,config)
        self.assertEqual(video['programId'],'m2--relay-dance')
        self.assertEqual(video['externalType'],'song')
        other = next(c for c in config['channels'] if c['id']=='kbs-coolfm')
        self.assertNotIn('programId',normalize(raw,other,config))

    def test_editorial_override_wins_over_program_guess(self):
        config = read_config()
        raw = {'id':'abc123DEF45','snippet':{'title':'[Relay Dance] NMIXX','description':'','publishedAt':'2026-11-05T00:00:00Z','channelTitle':'M2'}}
        m2 = next(c for c in config['channels'] if c['id']=='m2')
        video = normalize(raw,m2,config,{'externalType':'interview','programId':'manual','programName':'Reviewed'})
        self.assertEqual(video['programId'],'manual')
        self.assertEqual(video['externalType'],'interview')
