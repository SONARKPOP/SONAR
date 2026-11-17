import unittest,json,tempfile
from pathlib import Path
from unittest.mock import patch
from collectors.appearance_review import AppearanceResolver,apply_resolution

class AppearanceReviewTests(unittest.TestCase):
 def setUp(self):
  self.config={'groups':[{'id':'alpha','aliases':['ALPHA']},{'id':'beta','aliases':['BETA']}],
   'members':[{'id':'alpha-min','groupId':'alpha','aliases':['민','MIN'],'ambiguousAliases':['민']},
              {'id':'beta-min','groupId':'beta','aliases':['민','MIN']},
              {'id':'alpha-summer','groupId':'alpha','aliases':['여름'],'ambiguousAliases':['여름']},
              {'id':'alpha-hana','groupId':'alpha','aliases':['하나','HANA']} ]}
  self.resolver=AppearanceResolver(self.config)
 def record(self,title,**kw):return {'id':'youtube__v','platformId':'v','title':title,'description':'','groupIds':[],'memberIds':[],**kw}
 def resolve(self,title,**kw):return apply_resolution(self.record(title,**kw),{'official':False,'groupIds':[]},self.config,resolver=self.resolver)
 def test_shared_name_pending_but_group_context_infers(self):
  v=self.resolve('MIN interview');self.assertFalse(v['memberIds']);self.assertEqual({e['state'] for e in v['appearanceLinks']},{'needs_review'})
  v=self.resolve('ALPHA MIN interview');self.assertIn('alpha-min',v['memberIds']);self.assertNotIn('beta-min',v['memberIds'])
 def test_everyday_name_context_and_subword(self):
  self.assertEqual(self.resolve('여름 휴가')['appearanceLinks'][0]['state'],'needs_review')
  self.assertIn('alpha-summer',self.resolve('ALPHA 여름 인터뷰')['memberIds'])
  self.assertEqual(self.resolve('한여름 휴가').get('appearanceLinks'),[])
 def test_unique_name_only_is_inferred_and_keeps_span(self):
  v=self.resolve('HANA interview');self.assertIn('alpha-hana',v['memberIds'])
  e=next(e for e in v['appearanceLinks'] if e['artistId']=='alpha-hana');self.assertEqual(e['state'],'inferred');self.assertEqual(e['matches'][0]['text'],'HANA')
 def test_cover_target_is_mention_and_decisions_override_uncertainty(self):
  v=self.resolve('인터뷰 [원곡: ALPHA]');self.assertNotIn('alpha',v['groupIds']);self.assertEqual(v['appearanceLinks'][0]['state'],'mention')
  decision={'v:person:alpha-min':{'state':'confirmed','reason':'publisher guest credit','evidenceUrl':'https://publisher.example/guest'}}
  v=apply_resolution(self.record('MIN interview'),{'official':False,'groupIds':[]},self.config,decisions=decision,resolver=self.resolver)
  self.assertIn('alpha-min',v['memberIds']);self.assertNotIn('beta-min',v['memberIds'])
  self.assertTrue(any(e['source']=='editorial-review' for e in v['appearanceEvidence']))

 def test_pending_video_is_preserved_and_can_be_promoted_without_a_public_editor(self):
  from collectors.youtube import read_config,normalize
  from collectors.publish import publish
  config=read_config();channel=next(c for c in config['channels'] if c['id']=='its-live')
  v=normalize({'id':'reviewTest01','snippet':{'title':'첫사랑 이야기','description':'','publishedAt':'2026-11-17T00:00:00Z','channelTitle':'Studio'}},channel,config)
  with tempfile.TemporaryDirectory() as tmp:
   publish([v],config,output=tmp)
   queue=json.loads((Path(tmp)/'appearance-review.json').read_text(encoding='utf-8'))
   self.assertTrue(any(e['artistId']=='csr' and e['state']=='needs_review' for e in queue['items']))
   retained=json.loads((Path(tmp)/'review-content'/f"{v['id']}.json").read_text(encoding='utf-8'))
   self.assertFalse((Path(tmp)/'content'/f"{v['id']}.json").exists())
   with patch('collectors.appearance_review.load_decisions',return_value={'reviewTest01:group:csr':{'state':'inferred','reason':'reviewed artist context'}}):publish([retained],config,output=tmp)
   self.assertTrue((Path(tmp)/'content'/f"{v['id']}.json").exists())

 def test_unindexed_review_records_cannot_escape_the_output_directory(self):
  from collectors.publish import publish
  from collectors.youtube import read_config
  config=read_config()
  record={'id':'youtube__../unsafe','platform':'youtube','platformId':'../unsafe',
          'channelId':'its-live','title':'첫사랑 이야기','groupIds':[],'memberIds':[],
          'publishedAt':'2026-11-17T00:00:00Z'}
  with tempfile.TemporaryDirectory() as tmp:
   with self.assertRaisesRegex(ValueError,'Unsafe content ID'):
    publish([record],config,output=tmp)

if __name__=='__main__':unittest.main()
