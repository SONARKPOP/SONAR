"""Offline source-scoped profile enrichment from an existing Namuwiki document cache."""
import argparse
import copy
import hashlib
import json
import re
import sqlite3
import zlib
from collections import Counter
from datetime import date
from pathlib import Path
from urllib.parse import quote, unquote
from .dump_markdown import soup
from .namuwiki_register import merge_fact, personal_facts

ROOT=Path(__file__).resolve().parents[1]
NAMESPACE='https://namu.wiki/w/'
AGENCIES={
 'JYP엔터테인먼트':('jyp-entertainment','JYP Entertainment'),'JYP Entertainment':('jyp-entertainment','JYP Entertainment'),
 'SM엔터테인먼트':('sm-entertainment','SM Entertainment'),'SM Entertainment':('sm-entertainment','SM Entertainment'),
 'YG엔터테인먼트':('yg-entertainment','YG Entertainment'),'YG Entertainment':('yg-entertainment','YG Entertainment'),
 'HYBE':('hybe','HYBE'),'하이브':('hybe','HYBE'),
 '큐브엔터테인먼트':('cube-entertainment','CUBE Entertainment'),'CUBE엔터테인먼트':('cube-entertainment','CUBE Entertainment'),
 '피네이션':('p-nation','P NATION'),'P NATION':('p-nation','P NATION'),'PNATION':('p-nation','P NATION'),
 '하이업엔터테인먼트':('high-up-entertainment','HIGH UP Entertainment'),
 '울림엔터테인먼트':('woollim-entertainment','Woollim Entertainment'),
 'RBW':('rbw','RBW'),'알비더블유':('rbw','RBW'),
 'MW엔터테인먼트':('mw-entertainment','MW Entertainment'),
 '스타쉽엔터테인먼트':('starship-entertainment','Starship Entertainment'),
 '쏘스뮤직':('source-music','SOURCE MUSIC'),'SOURCE MUSIC':('source-music','SOURCE MUSIC'),
 '플레디스엔터테인먼트':('pledis-entertainment','PLEDIS Entertainment'),
 'DSP미디어':('dsp-media','DSP Media'),'DSP Media':('dsp-media','DSP Media'),
 '이담엔터테인먼트':('edam-entertainment','EDAM Entertainment'),'EDAM엔터테인먼트':('edam-entertainment','EDAM Entertainment'),
 '어비스컴퍼니':('abyss-company','ABYSS Company'),'THEBLACKLABEL':('the-black-label','THEBLACKLABEL'),
 'MORE VISION':('more-vision','MORE VISION'),'FNC엔터테인먼트':('fnc-entertainment','FNC Entertainment'),
 'IST엔터테인먼트':('ist-entertainment','IST Entertainment'),'위에화엔터테인먼트':('yuehua-entertainment','Yuehua Entertainment')}

def normalized(value):return re.sub(r'\s+','',str(value)).casefold()
def clean(value):return re.sub(r'\[\^\d+\]','',value).strip()
def source(title,checked):return {'sourceUrl':NAMESPACE+quote(title,safe=''),'dumpDate':'2026-08-29','checkedAt':checked,'sourceType':'namuwiki-dump','independenceKey':'namuwiki-2026-08-29'}
def full_dates(text):
 result=[]
 for match in re.finditer(r'(?<!\d)(\d{4})(?:년\s*|[.\-/]\s*)(\d{1,2})(?:월\s*|[.\-/]\s*)(\d{1,2})(?:일|\b)',text):
  try:result.append(date(*map(int,match.groups())).isoformat())
  except ValueError:pass
 return list(dict.fromkeys(result))

def profile_rows(text):
 """Expand rowspan only inside each table; no narrative/nav date guessing."""
 prefix=re.split(r'(?m)^##\s',text,1)[0]
 for table in soup(prefix).find_all('table'):
  occupied={}
  for row in table.find_all('tr'):
   if row.find_parent('table') is not table:continue
   cells={column:value[0] for column,value in occupied.items()};column=0
   next_occupied={column:(cell,remaining-1) for column,(cell,remaining) in occupied.items() if remaining>1}
   for cell in row.find_all(['td','th'],recursive=False):
    while column in cells:column+=1
    width=int(cell.get('colspan',1));height=int(cell.get('rowspan',1))
    for pos in range(column,column+width):
     cells[pos]=cell
     if height>1:next_occupied[pos]=(cell,height-1)
    column+=width
   occupied=next_occupied
   ordered=[]
   for _,cell in sorted(cells.items()):
    if not ordered or cell is not ordered[-1]:ordered.append(cell)
   if len(ordered)>1:
    yield clean(ordered[0].get_text(' ',strip=True)),ordered[1:]

def extracted_dates(text,solo=False):
 births=[];music=[];solo_dates=[]
 for label,cells in profile_rows(text):
  values=' '.join(c.get_text(' ',strip=True) for c in cells)
  if label in ('출생','생년월일'):births.extend(full_dates(values))
  if label not in ('데뷔','데뷔일'):continue
  if re.search(r'\(배우\)|\(모델\)|\(아역\)|성우|드라마|영화',values) and not re.search(r'가수|솔로|그룹|음반|싱글|미니|정규',values):continue
  dates=full_dates(values)
  # Only the explicit event's date; country or anniversary text never supplies another date.
  if dates:
   music.append(dates[0])
   if re.search(r'솔로|\(가수\)',values):solo_dates.append(dates[0])
 if solo and len(set(music))==1 and not solo_dates:solo_dates=music[:]
 return {'birthDate':births[0] if len(set(births))==1 else None,
  'debutDate':min(music) if music else None,'soloDebutDate':min(solo_dates) if solo_dates else None}

def agency_candidates(text):
 result=[]
 labels={'소속사':('agency','current'),'전 소속사':('agency','former'),'이전 소속사':('agency','former'),
  '레이블':('label','current'),'소속 레이블':('label','current'),'전 레이블':('label','former'),'이전 레이블':('label','former')}
 for label,cells in profile_rows(text):
  if label not in labels:continue
  role,status=labels[label]
  for cell in cells:
   if cell.find('table'):continue
   anchors=[a for a in cell.find_all('a',title=True) if not re.search(r'국기|로고',a.get('title',''))]
   companies=[]
   for a in anchors:
    title=a['title'];name=clean(a.get_text(' ',strip=True)) or title
    if title in ('대한민국','한국','일본','미국','중국','대만','유럽','전 세계','영국','캐나다','호주','독일','프랑스','태국','싱가포르','기획','경영') or re.search(r'^\d|음반사|엔터테인먼트$|기획사',title) and title in ('엔터테인먼트','음반사','기획사'):continue
    if title.startswith(('파일:','틀:','분류:')):continue
    if len(name)>90:continue
    if name in ('기획','경영','대한민국','한국','일본','미국','중국','대만','유럽','전 세계','영국','캐나다','호주','독일','프랑스','태국','싱가포르'):continue
    if name in ('무소속','없음','개인 활동','독립','-','미정'):continue
    details=a.find_parent('details');summary=details.find('summary').get_text(' ',strip=True) if details and details.find('summary') else ''
    state='former' if a.find_parent(['del','s','strike']) or re.search('이전|과거|전 소속|전 레이블',summary) else status
    companies.append((title,name,state))
   plain=clean(cell.get_text(' ',strip=True))
   plain=re.sub(r'^\[\s*이전 (?:소속사|레이블) 펼치기 · 접기\s*\]\s*','',plain)
   details=cell.find('details')
   if details and details.find('summary') and re.search('이전|과거',details.find('summary').get_text()):status='former'
   if not companies and plain:
    # Plain unlinked company names only, without speculative splitting of prose.
    name=clean(re.split(r'\s*\((?:\d{4}|무소속|독립)',plain,1)[0])
    if name in ('기획','경영','대한민국','한국','일본','미국','중국','대만','유럽','전 세계','영국','캐나다','호주','독일','프랑스','태국','싱가포르'):continue
    if name in ('무소속','없음','개인 활동','독립','-','미정'):
     result.append({'role':role,'status':'independent','name':name,'agencyId':None,'startDate':None,'endDate':None});continue
    if len(name)<80 and not re.search(r'데뷔|활동|소속|계약|국기',name):companies=[(name,name,status)]
   for title,name,state in companies:
    dates=full_dates(plain);end=None;start=dates[0] if dates else None
    # A closed year/month range is still historical even when an exact end day is unknown.
    if re.search(r'~\s*\d{4}',plain):state='former'
    if re.search(r'\(\s*~\s*\d{4}',plain):
     end=dates[0] if dates else None;start=None
    if len(companies)==1 and re.search(r'~\s*\d{4}',plain):
     end=dates[1] if len(dates)>1 else None
     if end:state='former'
    if len(companies)>1:start=None
    known=next((v for k,v in AGENCIES.items() if normalized(k) in (normalized(title),normalized(name))),None)
    identity,display=known or ('namu-company-'+hashlib.sha256(title.encode()).hexdigest()[:16],name)
    result.append({'agencyId':identity,'name':display,'sourceDocumentTitle':title,'role':role,'status':state,'startDate':start,'endDate':end})
 return list({(r.get('agencyId'),r['role'],r['status'],r['startDate'],r['endDate']):r for r in result}.values())

def documents_from_cache(path):
 db=sqlite3.connect('file:'+str(Path(path).resolve()).replace('\\','/')+'?mode=ro',uri=True)
 try:return {title:zlib.decompress(md).decode('utf-8') for title,md in db.execute('select title,md from docs where md is not null')}
 finally:db.close()

def usable_profile(title,text,solo):
 prefix=re.split(r'(?m)^##\s',text,1)[0]
 # Disambiguation pages often embed a singer link; they are never that person's profile.
 if re.search(r'\[동(?:음이의어|명이인)\]\(',prefix):return False
 labels={label for label,_ in profile_rows(text)}
 if not solo and labels & {'출생','생년월일'}:return False
 return bool(labels & ({'출생','생년월일'} if solo else {'데뷔','데뷔일','소속사','레이블','결성'}))

def match_document(bundle,documents,title_index,claims):
 urls=list(bundle.get('sourceDocuments',[]))
 for src in bundle.get('profileSources',{}).values():
  if isinstance(src,dict):urls.append(src.get('sourceUrl',''))
 exact={unquote(u.split('/w/',1)[1]) for u in urls if isinstance(u,str) and u.startswith(NAMESPACE)}
 available={title for title in exact&documents.keys() if usable_profile(title,documents[title],bundle.get('artistType')=='solo')}
 if len(available)==1:return next(iter(available)),'existing_source_document'
 if len(available)>1:return None,'ambiguous_source_documents'
 names={normalized(n) for n in [bundle['name'],bundle.get('nameKo',''),bundle.get('nameEn',''),*bundle.get('aliases',[])] if n}
 direct={title for title in documents if normalized(title) in names and not title.startswith(('분류:','틀:')) and usable_profile(title,documents[title],bundle.get('artistType')=='solo')}
 if len(direct)==1:
  title=next(iter(direct))
  if len(claims.get(normalized(title),set()))==1:return title,'unique_exact_registry_alias'
 if len(direct)>1:return None,'ambiguous_alias_documents'
 # Disambiguated cached person title: require a singer/artist qualifier and a unique registry alias.
 qualified={title for name in names for title in title_index.get(name,[]) if usable_profile(title,documents[title],bundle.get('artistType')=='solo') and re.search(r'\((?:가수|아이돌|래퍼|싱어송라이터|배우|성우|[A-Za-z0-9 .]+)\)$',title)}
 if len(qualified)==1:
  title=next(iter(qualified));base=normalized(re.sub(r'\([^)]*\)$','',title))
  if len(claims.get(base,set()))==1:return title,'unique_qualified_registry_alias'
 return None,'not_cached_or_ambiguous_identity'

def merge_agencies(bundle,candidates,src):
 changed=[];conflicts=[];history=bundle.setdefault('agencyHistory',[]) if candidates else bundle.get('agencyHistory',[])
 for candidate in candidates:
  if candidate['status']=='independent':
   evidence={**src,'value':candidate,'verificationStatus':'namuwiki_collected'}
   field=bundle.setdefault('fieldEvidence',{}).setdefault('agencyStatus',[])
   if not any(e.get('sourceUrl')==src['sourceUrl'] and e.get('value')==candidate for e in field):field.append(evidence)
   continue
  same=[r for r in history if r.get('agencyId')==candidate['agencyId'] and r.get('status')==candidate['status'] and r.get('role','agency')==candidate['role']]
  if same:
   # Keep stronger provenance; add first-line corroboration as evidence only.
   row=same[0];evidence={**src,'verificationStatus':'namuwiki_collected'}
   if not any(e.get('sourceUrl')==src['sourceUrl'] and e.get('dumpDate')==src['dumpDate'] for e in row.get('evidence',[])):row.setdefault('evidence',[]).append(evidence)
   if 'role' not in row:row['role']=candidate['role']
   continue
  strong=[r for r in history if r.get('status')=='current' and r.get('role','agency')==candidate['role'] and r.get('verificationStatus') in ('VERIFIED','official_verified')]
  if candidate['status']=='current' and strong:
   evidence={**src,'value':candidate,'verificationStatus':'conflict_detected','existingValue':strong}
   field=bundle.setdefault('fieldEvidence',{}).setdefault('agencyHistory',[])
   if not any(e.get('sourceUrl')==src['sourceUrl'] and e.get('value')==candidate for e in field):field.append(evidence)
   conflicts.append(candidate);continue
  history.append({**candidate,**src,'verificationStatus':'namuwiki_collected'});changed.append(candidate)
 return changed,conflicts

def enrich(config,cache,report_path,apply=False):
 from .registry import load_bundles,validate
 bundles,shared,taxonomy,settings=load_bundles(config);before=copy.deepcopy(bundles)
 docs=documents_from_cache(cache);index={};claims={}
 for title in docs:index.setdefault(normalized(re.sub(r'\([^)]*\)$','',title)),[]).append(title)
 for b in bundles:
  for name in [b['name'],*b.get('aliases',[])]:claims.setdefault(normalized(name),set()).add(b['id'])
 checked=date.today().isoformat();report={'schemaVersion':1,'checkedAt':checked,'dumpDate':'2026-08-29','mode':'apply' if apply else 'dry_run','cachedDocuments':len(docs),'artists':{},'conflicts':[],'summary':{}}
 for b in bundles:
  item={'artistType':b.get('artistType','group'),'changedFields':[]};report['artists'][b['id']]=item
  title,basis=match_document(b,docs,index,claims);item['identityBasis']=basis
  if not title:item['status']='source_unavailable';continue
  text=docs[title];src=source(title,checked);item.update(status='processed',documentTitle=title,sourceUrl=src['sourceUrl'],textSha256=hashlib.sha256(text.encode()).hexdigest())
  solo=b.get('artistType')=='solo';dates=extracted_dates(text,solo)
  if solo and dates['birthDate']:
   profile=b.setdefault('personProfile',{});old=profile.get('birthDate')
   result=merge_fact(profile,'birthDate',dates['birthDate'],src)
   if result=='conflict_detected':report['conflicts'].append({'artistId':b['id'],'field':'personProfile.birthDate','candidate':dates['birthDate'],'existing':old})
   if profile.get('birthDate')==dates['birthDate']:merge_fact(profile,'birthDatePrecision','day',src)
   if old!=profile.get('birthDate'):item['changedFields'].append('personProfile.birthDate')
  for field in ('debutDate','soloDebutDate'):
   if field=='soloDebutDate' and not solo:continue
   value=dates[field]
   if not value:continue
   old=b.get(field);result=merge_fact(b,field,value,src)
   if result=='conflict_detected':report['conflicts'].append({'artistId':b['id'],'field':field,'candidate':value,'existing':old})
   if b.get(field)==value:
    if field=='debutDate':merge_fact(b,'debutDatePrecision','day',src)
    if field=='debutDate' and not b.get('debutYear'):merge_fact(b,'debutYear',int(value[:4]),src)
   if old!=b.get(field):item['changedFields'].append(field)
  agencies=agency_candidates(text);added,conflicts=merge_agencies(b,agencies,src);item['agencyCandidates']=len(agencies);item['agencyAdded']=len(added)
  if added:item['changedFields'].append('agencyHistory')
  for conflict in conflicts:report['conflicts'].append({'artistId':b['id'],'field':'agencyHistory','candidate':conflict})
  item['birthDateFound']=bool(dates['birthDate']);item['debutDateFound']=bool(dates['debutDate']);item['soloDebutDateFound']=bool(dates['soloDebutDate']) if solo else False
  if item['changedFields']:
   b.setdefault('sourceDocuments',[])
   if src['sourceUrl'] not in b['sourceDocuments']:b['sourceDocuments'].append(src['sourceUrl'])
 changed=[(old,new) for old,new in zip(before,bundles) if old!=new]
 validate(bundles,shared,taxonomy)
 report['summary']={'registryArtists':len(bundles),'processed':sum(i['status']=='processed' for i in report['artists'].values()),'unavailable':sum(i['status']=='source_unavailable' for i in report['artists'].values()),'changedRegistryFiles':len(changed),'newBirthDates':sum('personProfile.birthDate' in i['changedFields'] for i in report['artists'].values()),'newDebutDates':sum('debutDate' in i['changedFields'] for i in report['artists'].values()),'newSoloDebutDates':sum('soloDebutDate' in i['changedFields'] for i in report['artists'].values()),'newAgencyHistoryEntries':sum(i.get('agencyAdded',0) for i in report['artists'].values()),'conflicts':len(report['conflicts'])}
 if apply:
  backup=ROOT/'work/profile-enrichment-backups'/checked;backup.mkdir(parents=True,exist_ok=True)
  for old,new in changed:
   path=config/'groups'/(new['id']+'.json');saved=backup/path.name
   if not saved.exists():saved.write_text(json.dumps(old,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
   path.write_text(json.dumps(new,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
 report_path.parent.mkdir(parents=True,exist_ok=True);report_path.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
 return report

def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--cache',type=Path,required=True);p.add_argument('--config',type=Path,default=ROOT/'config');p.add_argument('--report',type=Path,default=ROOT/'reports/profile-enrichment-20261117.json');p.add_argument('--apply',action='store_true');a=p.parse_args();print(json.dumps(enrich(a.config,a.cache,a.report,a.apply)['summary'],ensure_ascii=False))
if __name__=='__main__':main()
