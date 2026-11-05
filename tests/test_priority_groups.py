import unittest
from collectors.registry import load_config
from collectors.youtube import normalize

class PriorityGroupsTests(unittest.TestCase):
    def test_nine_priorities_and_no_sample_generation(self):
        config=load_config()
        expected=['rescene','kiiikiii','uspeer','hearts2hearts','tuide','hitgs','unchild','heart-of-woman','meovv']
        self.assertEqual(config['defaultGroupIds'],expected)
        self.assertEqual(config['collectionGroupIds'],expected)
        self.assertEqual(config['sampleGroupIds'],[])

    def test_shared_member_name_stays_with_explicit_group(self):
        config=load_config()
        raw={'id':'test','snippet':{'title':'서희 SEOHEE의 하루','description':'','publishedAt':'2026-11-05T00:00:00Z','channelTitle':'Test'}}
        for group in ('tuide','hitgs'):
            source=next(c for c in config['channels'] if c['id']==group+'-official')
            video=normalize(raw,source,config)
            self.assertEqual(video['memberIds'],[group+'-seohee'])
            self.assertEqual(video['groupIds'],[group])

    def test_external_shared_name_is_unclassified_without_group_context(self):
        config=load_config()
        source=next(c for c in config['channels'] if not c['official'])
        raw={'id':'test','snippet':{'title':'#SEOHEE 서희와 함께','description':'','publishedAt':'2026-11-05T00:00:00Z','channelTitle':'Test'}}
        self.assertEqual(normalize(raw,source,config)['memberIds'],[])
        raw['snippet']['title']='TUIDE #SEOHEE 서희와 함께'
        self.assertEqual(normalize(raw,source,config)['memberIds'],['tuide-seohee'])

    def test_ordinary_korean_reason_is_not_a_member_tag(self):
        config=load_config()
        source=next(c for c in config['channels'] if c['id']=='hitgs-official')
        raw={'id':'test','snippet':{'title':'우리가 모인 이유','description':'','publishedAt':'2026-11-05T00:00:00Z','channelTitle':'HITGS'}}
        self.assertNotIn('hitgs-iyoo',normalize(raw,source,config)['memberIds'])
        raw['snippet']['title']='HITGS #이유 브이로그'
        self.assertIn('hitgs-iyoo',normalize(raw,source,config)['memberIds'])

if __name__=='__main__':unittest.main()
