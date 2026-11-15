import unittest
import importlib.util
from collectors.namuwiki_register import merge_fact, roster_entries, stable_id, record_roster_source


class FirstlineTests(unittest.TestCase):
 @unittest.skipUnless(importlib.util.find_spec('bs4'),'optional dump requirements not installed')
 def test_roster_does_not_absorb_guest_or_comparison_links(self):
  text='''# Group A
**Group A**
[A](a.md "A(가수)")
[B](b.md "B")
<details><summary>[ 전 멤버 ]</summary><a href="c.md" title="C">C</a></details>
<table><tr><td>음반</td></tr></table>
## 2. 멤버
<table><tr><td>게스트 공연</td><td><a href="other.md" title="Other">Other</a></td></tr></table>
'''
  self.assertEqual([(r['name'],r['status']) for r in roster_entries(text,'Group A')],[('A','current'),('B','current'),('C','former')])

 def test_firstline_fills_missing_but_retains_conflicts_and_history(self):
  record={'birthDate':'2000-01-01','profileSources':{'birthDate':{'verificationStatus':'official_verified'}}}
  source={'sourceUrl':'https://namu.wiki/w/A','dumpDate':'2026-08-29','checkedAt':'2026-11-16'}
  self.assertEqual(merge_fact(record,'birthDate','2001-01-01',source),'conflict_detected')
  self.assertEqual(record['birthDate'],'2000-01-01')
  self.assertEqual(merge_fact(record,'nationalities',['KR'],source),'namuwiki_collected')
  self.assertEqual(record['nationalities'],['KR'])
  merge_fact(record,'nationalities',['KR'],source)
  self.assertEqual(len(record['fieldEvidence']['nationalities']),1)
  roster={};evidence={'memberId':'a','name':'A','status':'current','sourceUrl':source['sourceUrl'],'dumpDate':source['dumpDate'],'checkedAt':'2026-11-16'}
  record_roster_source(roster,evidence);record_roster_source(roster,{**evidence,'checkedAt':'2026-11-17'})
  self.assertEqual(len(roster['entrySources']),1)
  merge_fact(record,'birthDate','2002-01-01',{'sourceUrl':'https://official.example/profile','checkedAt':'2026-11-16'},'official_verified')
  self.assertEqual(record['birthDate'],'2002-01-01')
  self.assertEqual(record['fieldEvidence']['birthDate'][-1]['previousValue'],'2000-01-01')

 @unittest.skipUnless(importlib.util.find_spec('bs4'),'optional dump requirements not installed')
 def test_ui_toggles_captions_and_song_rows_are_not_people(self):
  text='<table><tr><td>멤버</td><td>[ 펼치기 · 접기 ]</td></tr><tr><td>멤버</td><td>左: 채원 / 右: 지영</td></tr><tr><td>구성</td><td>좋아요 (I Like)</td></tr></table>'
  self.assertEqual(roster_entries(text,'Group'),[])

 @unittest.skipUnless(importlib.util.find_spec('bs4'),'optional dump requirements not installed')
 def test_member_table_ignores_previous_groups_symbols_and_songs(self):
  text='## 2. 멤버\n<table><tr><td>이름</td><td>생년월일</td><td>출신 그룹</td><td>상징</td></tr><tr><td><strong><a title="A(가수)" href="a.md">A</a></strong></td><td>2000년 1월 1일</td><td><a title="Other group" href="g.md">Other group</a></td><td><a title="장미" href="r.md">장미</a></td></tr></table>'
  self.assertEqual([r['name'] for r in roster_entries(text,'Group')],['A'])

 @unittest.skipUnless(importlib.util.find_spec('bs4'),'optional dump requirements not installed')
 def test_rowspan_member_column_does_not_shift_into_song_column(self):
  text='## 2. 멤버\n<table><tr><td>이름</td><td>생년월일</td><td>공연</td></tr><tr><td rowspan="2"><strong><a title="A(가수)" href="a.md">A</a></strong></td><td>2000년 1월 1일</td><td>song</td></tr><tr><td><strong><a title="Song" href="s.md">Song</a></strong></td></tr></table>'
  self.assertEqual([r['name'] for r in roster_entries(text,'Group')],['A'])

 def test_id_is_stable_for_retries(self):
  self.assertEqual(stable_id('person','https://namu.wiki/w/A'),stable_id('person','https://namu.wiki/w/A'))


class SharedIdentityTests(unittest.TestCase):
 def test_member_requires_explicit_group_but_accepts_previous_membership(self):
  from collectors.youtube import member_match,infer_members
  member={'id':'one','groupId':'old','name':'Artist','aliases':['Artist'],'taggingPolicy':'explicit-group-context',
          'membershipHistory':[{'groupId':'new','status':'current'}]}
  self.assertFalse(member_match(member,{'title':'Artist cover'},set()))
  self.assertTrue(member_match(member,{'title':'Artist vlog'},{'new'}))
  self.assertEqual(infer_members({'title':'Artist vlog'},{'new'},{'members':[member]}),['one'])

if __name__=='__main__':unittest.main()
