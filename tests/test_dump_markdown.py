import unittest
import importlib.util
from collectors.dump_markdown import document_links, listed_groups, profile_candidates, member_links

@unittest.skipUnless(importlib.util.find_spec('bs4'),'optional dump requirements not installed')
class MarkdownDumpTests(unittest.TestCase):
 def test_table_list_excludes_navigation_and_preserves_title(self):
  text='<table><tr><td><a title="가수" href="x.md">가수</a></td></tr></table><table><tr><td>날짜</td><td>그룹명</td><td>비고</td></tr><tr><td>2020년</td></tr><tr><td>1월 1일</td><td><a title="AAA(그룹)" href="AAA.md">AAA</a></td></tr></table>'
  self.assertEqual(listed_groups(text),[{'title':'AAA(그룹)','debutDateCandidate':'2020-01-01'}])
 def test_profile_no_marriage_inference_and_birth_date(self):
  text='<table><tr><td>본명</td><td>이름</td></tr><tr><td>출생</td><td>2000년 1월 2일<br>부산</td></tr><tr><td>국적</td><td>대한민국</td></tr></table>'
  value=profile_candidates(text,True)
  self.assertEqual(value['birthDate'],'2000-01-02')
  self.assertNotIn('maritalStatusText',value)
 def test_members_excludes_program_guest(self):
  text='<table><tr><td>멤버</td><td><a title="가나" href="name.md">가나</a></td></tr><tr><td>이전 멤버</td><td><a title="다라" href="old.md">다라</a></td></tr></table><a title="게스트" href="guest.md">게스트</a>'
  self.assertEqual(member_links(text),[('가나','current'),('다라','former')])
 def test_markdown_relative_links_use_explicit_title(self):
  self.assertEqual(document_links('[이름](name.md "이름(그룹)")'),['이름(그룹)'])
 def test_portrait_member_section_and_former_section(self):
  text='## 2\\. 멤버\n<table><tr><td><a title="가나" href="a.md">가나</a></td></tr></table>\n### 2.1. 전 멤버\n<table><tr><td><a title="다라" href="b.md">다라</a></td></tr></table>\n## 3\\. 활동\n<table><tr><td><a title="게스트" href="c.md">게스트</a></td></tr></table>'
  self.assertEqual(member_links(text),[('가나','current'),('다라','former')])
 def test_external_urls_and_profile_attributes_are_not_people(self):
  text='## 2\\. 멤버\n<table><tr><td><a title="그룹" href="g.md">그룹</a></td></tr><tr><td><a title="가나" href="a.md">가나</a></td><td><a title="다라" href="b.md">다라</a></td></tr><tr><td><a title="O형" href="blood.md">O형</a></td><td><a title="서울중학교" href="school.md">서울중학교</a></td></tr><tr><td><a title="https://twitter.com/member" href="https://twitter.com/member">SNS</a></td></tr></table>'
  self.assertEqual(member_links(text),[('가나','current'),('다라','current')])
