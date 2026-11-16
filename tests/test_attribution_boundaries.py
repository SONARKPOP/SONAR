import unittest
from collectors.youtube import mentions,normalize,prune_stale_attribution,member_match
class AttributionBoundaryTests(unittest.TestCase):
 def config(self):
  groups=[{'id':gid,'name':name,'aliases':aliases,'titleBoundaryReview':True} for gid,name,aliases in [('evol','EvoL',['EvoL','이블']),('luv','LUV',['LUV','러브']),('iu','IU',['IU','아이유']),('soyou','소유',['소유','SOYOU']),('clc','CLC',['CLC','씨엘씨']),('sorn','SORN',['SORN','손']),('davichi','다비치',['다비치','DAVICHI'])]]
  groups[5].update(artistType='solo',ambiguousAliases=['손'],relatedGroupIds=['clc'])
  return {'groups':groups,'members':[{'id':'clc-sorn','name':'SORN','groupId':'clc','aliases':['SORN','손']}],'taxonomy':{'categories':['external','own','music','shorts'],'formats':['video','short','live']}}
 def channel(self,**kw):return {'id':'show','name':'Show','official':False,'groupIds':[],**kw}
 def raw(self,title):return {'id':'test-video','snippet':{'title':title,'description':'','channelTitle':'Show','publishedAt':'2026-11-16T00:00:00Z'}}
 def test_review_policy_survives_registry_projection(self):
  from collectors.registry import load_config
  config=load_config()
  for gid in ['evol','luv','soyou','iu']:self.assertTrue(next(g for g in config['groups'] if g['id']==gid)['titleBoundaryReview'])
 def test_korean_tokens_not_substrings(self):
  for title,alias in [('테이블 가격','이블'),('엑스러브 XLOV','러브'),('소유미_평생직장','소유')]:self.assertFalse(mentions(title,alias))
  for title,alias in [('#아이유','아이유'),('아이유의 팔레트','아이유'),('소유 _ new song','소유')]:self.assertTrue(mentions(title,alias))
 def test_known_false_titles_and_old_attribution_are_removed(self):
  for title,gid in [('말 안 되는 요즘 테이블 가격','evol'),('XLOV (엑스러브) Band LIVE','luv'),('소유미_평생직장','soyou'),('해방촌 아이유','iu'),('망원동아이유','iu'),('PC방 아이유가 알려주는 메뉴','iu')]:
   with self.subTest(title=title):
    raw=self.raw(title);video=normalize(raw,self.channel(),self.config());self.assertNotIn(gid,video['groupIds'])
    stale={**video,'groupIds':[gid]};self.assertNotIn(gid,prune_stale_attribution(stale,self.channel(),self.config())['groupIds'])
 def test_hand_is_not_sorn_without_clc_context(self):
  m=self.config()['members'][0]
  self.assertFalse(member_match(m,{'title':'이 대화에 끼고 싶다 손?'},set()))
  self.assertTrue(member_match(m,{'title':'CLC 손 촬영 비하인드'},{'clc'}))
  self.assertNotIn('sorn',normalize(self.raw('두 손 안무'),self.channel(),self.config())['groupIds'])
 def test_confirmed_appearance_and_overrides_survive_cleanup(self):
  record={**normalize(self.raw('오늘의 인터뷰'),self.channel(),self.config()),'groupIds':['iu'],'appearanceEvidence':[{'groupId':'iu','role':'participant','source':'editorial-review','url':'https://publisher.example'}]}
  self.assertEqual(prune_stale_attribution(record,self.channel(),self.config())['groupIds'],['iu'])
  self.assertEqual(prune_stale_attribution(record,self.channel(),self.config(),{'groupIds':['iu']})['groupIds'],['iu'])
 def test_official_guest_challenge_is_not_owner_appearance(self):
  channel=self.channel(official=True,groupIds=['davichi'],guestOnlyTitlePattern=r'^#.+만들어낸 또 하나의 미장센')
  raw=self.raw('#LUCY #조원상 이 만들어낸 또 하나의 미장센 🎬')
  video=normalize(raw,channel,self.config());self.assertNotIn('davichi',video['groupIds'])
  self.assertNotIn('davichi',prune_stale_attribution({**video,'groupIds':['davichi']},channel,self.config())['groupIds'])
if __name__=='__main__':unittest.main()
