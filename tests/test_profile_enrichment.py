import unittest
from collectors.profile_enrichment import extracted_dates,agency_candidates,usable_profile
from collectors.namuwiki_register import personal_facts
from collectors.title_songs import candidates

class ProfileEnrichmentTests(unittest.TestCase):
 def test_rowspan_domestic_debut_and_solo_date_are_exact(self):
  text='''# Artist
<table><tr><td rowspan="2">데뷔</td><td>2007년 8월 5일 그룹 싱글 (그룹)</td></tr><tr><td>2015년 10월 7일 미니 1집 (솔로)</td></tr></table>'''
  dates=extracted_dates(text,True)
  self.assertEqual(dates['debutDate'],'2007-08-05');self.assertEqual(dates['soloDebutDate'],'2015-10-07')
 def test_country_cell_and_actor_debut_do_not_hide_music_debut(self):
  text='''# Artist
<table><tr><td rowspan="2">데뷔</td><td>2012년 1월 30일 드라마 (배우)</td></tr><tr><td>2012년 2월 9일 싱글 (가수)</td></tr></table>'''
  self.assertEqual(extracted_dates(text,True)['debutDate'],'2012-02-09')
  text='''# Group
<table><tr><td>데뷔일</td><td>대한민국</td><td>2020년 11월 12일</td></tr></table>'''
  self.assertEqual(extracted_dates(text)['debutDate'],'2020-11-12')
 def test_year_only_and_birthday_in_narrative_are_not_exact_dates(self):
  text='# A\n<table><tr><td>데뷔</td><td>2020년</td></tr></table>\n## Guest\n<table><tr><td>출생</td><td>1999년 1월 2일</td></tr></table>'
  self.assertIsNone(extracted_dates(text,True)['debutDate']);self.assertIsNone(extracted_dates(text,True)['birthDate'])
 def test_agency_label_and_previous_collapsible_are_separate(self):
  text='''# A
<table><tr><td rowspan="2">소속사</td><td><a title="MORE VISION">MORE VISION</a></td></tr><tr><td><details><summary>이전 소속사 펼치기 · 접기</summary><a title="MNH엔터테인먼트">MNH엔터테인먼트</a></details></td></tr><tr><td>레이블</td><td><a title="영국">영국</a></td><td><a title="Polydor">Polydor</a></td></tr></table>'''
  values=agency_candidates(text)
  self.assertEqual([(v['name'],v['role'],v['status']) for v in values],[('MORE VISION','agency','current'),('MNH엔터테인먼트','agency','former'),('Polydor','label','current')])
 def test_disambiguation_and_person_cannot_become_group(self):
  text='# A\n[동명이인](category.md)\n<table><tr><td>출생</td><td>1990년 1월 2일</td></tr></table>'
  self.assertFalse(usable_profile('A',text,True))
  text='# A\n<table><tr><td>출생</td><td>1990년 1월 2일</td></tr><tr><td>데뷔</td><td>2010년 1월 1일</td></tr></table>'
  self.assertFalse(usable_profile('A',text,False))
 def test_indonesia_does_not_add_india(self):
  text='# Dinda\n<table><tr><td>국적</td><td>인도네시아</td></tr></table>'
  self.assertEqual(personal_facts(text)['nationalities'],['ID'])
  self.assertEqual(personal_facts(text.replace('인도네시아','인도, 인도네시아'))['nationalities'],['ID','IN'])
 def test_title_columns_not_supporting_tracks_and_linebreak_titles(self):
  text='''# A
<table><tr><td>앨범명</td><td>타이틀곡</td><td>수록곡</td></tr><tr><td>Album</td><td>Song A<br>Song B</td><td>Optional track</td></tr></table>'''
  rows=list(candidates(text));self.assertEqual([r['title'] for r in rows],['Song A','Song B']);self.assertTrue(all(r['promotionRole']=='title' for r in rows))
  self.assertEqual(list(candidates(text.replace('타이틀곡','타이틀곡 별 메인보컬'))),[])

 def test_closed_year_only_agency_range_is_former_without_inventing_date(self):
  text='# Group\n<table><tr><td>소속사</td><td><a title="SM엔터테인먼트">SM엔터테인먼트</a> (2009년 ~ 2019년)</td></tr></table>'
  row=agency_candidates(text)[0]
  self.assertEqual(row['status'],'former');self.assertIsNone(row['startDate']);self.assertIsNone(row['endDate'])
