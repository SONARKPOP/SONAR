"""Read tables in the publicly archived rendered Markdown; candidates, not facts."""
import re
import urllib.parse
from datetime import date

def soup(text):
 from bs4 import BeautifulSoup
 return BeautifulSoup(text,'html.parser')

def clean(value):return re.sub(r'\[\^\d+\]','',value).strip()

def document_links(text):
 result=[]
 def add(title):
  if title and not title.startswith(('분류:','틀:','파일:','http://','https://','//')) and title not in result:result.append(title)
 for anchor in soup(text).find_all('a',href=True):
  if anchor.get('title') and re.search(r'\.md(?:#.*)?$',anchor['href']):add(anchor['title'])
 for match in re.finditer(r'(?<!!)\[[^\]\n]+\]\([^\n]*?\.md(?:#[^\s]*)?\s+"([^"]+)"\)',text):add(match.group(1))
 return result

def listed_groups(text):
 result=[];seen=set()
 for table in soup(text).find_all('table'):
  rows=table.find_all('tr')
  if not rows:continue
  header=rows[0].get_text(' ',strip=True)
  if not ('날짜' in header and '그룹명' in header and len(header)<80):continue
  preceding=table.find_previous(string=re.compile(r'(?m)^#{2,4}\s'))
  headings=re.findall(r'(?m)^#{2,4}\s+(.+)',str(preceding or ''))
  section=headings[-1].replace('\\','') if headings else None
  year=None
  for row in rows[1:]:
   cells=row.find_all(['td','th'],recursive=False)
   if len(cells)==1:
    match=re.fullmatch(r'(\d{4})년',cells[0].get_text(strip=True))
    if match:year=int(match.group(1))
    continue
   text_date=cells[0].get_text(strip=True) if cells else ''
   match=re.fullmatch(r'(\d{1,2})월\s*(\d{1,2})일',text_date)
   debut=None
   if year and match:
    try:debut=date(year,*map(int,match.groups())).isoformat()
    except ValueError:pass
   for anchor in row.find_all('a',title=True):
    title=anchor['title']
    if title in seen or title.startswith(('분류:','틀:','파일:')):continue
    seen.add(title);entry={'title':title,'debutDateCandidate':debut}
    if section:entry['listSection']=section
    result.append(entry)
 return result

LABELS={'데뷔':'debutDateText','데뷔일':'debutDateText','재데뷔':'redebutDateText','소속사':'agencyText','전 소속사':'formerAgencyText','이전 소속사':'formerAgencyText'}
PERSON={'본명':'legalName','출생':'birthDateText','생년월일':'birthDateText','국적':'nationalitiesText',
 '출생지':'birthPlaceText','출신지':'hometownText','학력':'educationText','사망':'deathDateText',
 '혼인 상태':'maritalStatusText','혼인 여부':'maritalStatusText','배우자':'spouseText'}
def profile_candidates(text,person=False):
 labels={**LABELS,**(PERSON if person else {})};result={};birth_place_next=False
 for row in soup(text).find_all('tr'):
  cells=row.find_all(['td','th'],recursive=False)
  if birth_place_next and len(cells)==1:
   result.setdefault('birthPlaceText',clean(cells[0].get_text(' ',strip=True))[:500]);birth_place_next=False
  if len(cells)<2:continue
  label=cells[0].get_text(' ',strip=True)
  if label not in labels:continue
  value=clean(cells[1].get_text(' ',strip=True))[:1200]
  if value:result.setdefault(labels[label],value)
  birth_place_next=person and label=='출생' and cells[0].get('rowspan')=='2'
 for key in ('birthDateText','deathDateText','debutDateText','redebutDateText'):
  match=re.search(r'(?<!\d)(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일',result.get(key,''))
  if match:
   try:result[key.removesuffix('Text')]=date(*map(int,match.groups())).isoformat()
   except ValueError:pass
 return result

NON_PERSON={'O형','A형','B형','AB형','한국인','일본인','중국인','독일인','호주인','국적','기타','드럼','건반 악기','베이스 기타','배우','가수','그룹','바이올린','경기도','강원도','경상남도','경상북도','충청남도','충청북도','전라남도','전라북도','제주도'}
def person_title(title):
 base=title.split('(',1)[0]
 return bool(title) and '/' not in title and title not in NON_PERSON and not title.startswith(('분류:','틀:','파일:','http:','https:')) and not re.search(r'학교|대학교|대학원|광역시|특별시|(?:시|군|구)$',base)

def member_links(text):
 result=[]
 heading=re.search(r'(?m)^#\s+(.+)',text)
 group_title=heading.group(1).strip() if heading else None
 for row in soup(text).find_all('tr'):
  cells=row.find_all(['td','th'],recursive=False)
  if len(cells)<2:continue
  label=cells[0].get_text(' ',strip=True)
  if label not in ('멤버','구성원','현재 멤버','전 멤버','이전 멤버','탈퇴 멤버'):continue
  status='former' if label in ('전 멤버','이전 멤버','탈퇴 멤버') else 'current'
  for title in document_links(str(cells[1])):
   if person_title(title) and title!=group_title and (title,status) not in result:result.append((title,status))
 # Many group articles use member portrait/name tables under a Markdown heading.
 active=False;status='current'
 for part in re.split(r'(?m)(^#{2,4}[^\n]*\n)',text):
  if part.startswith('##'):
   heading=part.replace('\\','')
   if re.match(r'^##\s',heading):active=bool(re.search(r'(?:멤버|구성원)',heading));status='current'
   elif active:
    if '변천' in heading:active=False
    elif re.search(r'(?:전 멤버|이전 멤버|탈퇴)',heading):status='former'
   continue
  if not active:continue
  for table in soup(part).find_all('table'):
   for anchor in table.find_all('a',title=True):
    title=anchor['title'];name=anchor.get_text(' ',strip=True)
    if not re.search(r'\.md(?:#.*)?$',anchor.get('href','')) or not person_title(title) or title==group_title:continue
    if not name or len(name)>25 or re.search(r'\d|보컬|래퍼|댄서|리더|센터|막내|포지션|팬덤',name):continue
    if anchor.find('img',alt=re.compile('국기')):continue
    if title in ('대한민국','한국','일본','중국','대만','태국','미국','국적'):continue
    if title.startswith(('분류:','틀:','파일:')):continue
    if (title,status) not in result:result.append((title,status))
 return result
