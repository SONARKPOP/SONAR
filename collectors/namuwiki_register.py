"""First-line dump registration; field evidence survives later wiki/official review."""
import argparse
import copy
import hashlib
import json
import re
import sqlite3
import urllib.parse
import zlib
from datetime import date
from pathlib import Path
from .publish import write
from .dump_markdown import soup,NON_PERSON,profile_candidates,listed_groups

ROOT=Path(__file__).resolve().parents[1]
def normalized(value):return re.sub(r'\s+','',str(value or '')).casefold()
def ref(title):return 'https://namu.wiki/w/'+urllib.parse.quote(title,safe='')
def stable_id(kind,value):return kind+'-'+hashlib.sha256(value.encode()).hexdigest()[:16]

def merge_fact(record,field,value,source,status='namuwiki_collected'):
 if value is None or value=='' or value==[]:return 'not_found'
 evidence={**source,'value':copy.deepcopy(value),'verificationStatus':status}
 existing=record.get(field)
 if existing not in (None,'',[],{}) and existing!=value and status!='official_verified':
  evidence['verificationStatus']='conflict_detected'
  evidence['existingValue']=copy.deepcopy(existing)
 rows=record.setdefault('fieldEvidence',{}).setdefault(field,[])
 identity=lambda row:{key:row.get(key) for key in ('sourceUrl','dumpDate','value','verificationStatus')}
 if not any(identity(row)==identity(evidence) for row in rows):rows.append(evidence)
 if evidence['verificationStatus']=='conflict_detected':return 'conflict_detected'
 if existing in (None,'',[],{}) or status=='official_verified':
  if existing not in (None,'',[],{}) and existing!=value:
   evidence['previousValue']=copy.deepcopy(existing);evidence['previousSource']=copy.deepcopy(record.get('profileSources',{}).get(field))
  record[field]=copy.deepcopy(value)
  record.setdefault('profileSources',{})[field]={**source,'verificationStatus':status}
 return status

def record_roster_source(roster,evidence):
 keys=('memberId','name','status','sourceUrl','dumpDate')
 if not any(all(row.get(key)==evidence.get(key) for key in keys) for row in roster.setdefault('entrySources',[])):
  roster['entrySources'].append(evidence)

def roster_entries(text,title,aliases=()):
 """Use explicit lineup cells and the group header, never narrative guest tables."""
 result=[];seen=set()
 def add(document,name,status,section):
  if not document or document==title or document in NON_PERSON or '/' in document or document.startswith(('분류:','틀:','파일:','http:','https:')):return
  if document in ('대한민국','한국','일본','중국','대만','태국','미국','국적'):return
  name=re.sub(r'\[\^\d+\]','',name).replace('**','').strip()
  if not name or len(name)>35 or not re.search(r'[가-힣A-Za-z一-龥ぁ-ゟァ-ヿ]',name) or re.search(r'펼치기|접기|左:|右:|맨 위|왼쪽|오른쪽',name):return
  if (document,status) in seen:return
  seen.add((document,status));result.append({'documentTitle':document,'name':name,'status':status,'section':section})
 header=None
 names={normalized(re.sub(r'\([^)]*\)$','',name)) for name in (title,*aliases)}
 for match in re.finditer(r'\*\*([^*\n]+)\*\*',text[:24000]):
  if normalized(match.group(1)) in names:
   tail=text[match.end():];end=re.search(r'<table\b|(?m:^##\s)',tail)
   header=tail[:end.start()] if end else tail[:10000];break
 if header:
  pattern=r'\[([^\[\]\n]+)\]\([^\n]*?\.md(?:#[^\s]*)?\s+"([^"]+)"\)'
  for line in header.splitlines():
   matches=list(re.finditer(pattern,line))
   remainder=re.sub(pattern,'',line)
   if matches and not re.sub(r'[\s*_·ㆍ|,/]+','',remainder):
    for match in matches:add(match.group(2),match.group(1),'current','group-header')
  for details in soup(header).find_all('details'):
   summary=details.find('summary')
   if summary and re.search(r'전 멤버|이전 멤버|탈퇴',summary.get_text()):
    for anchor in details.find_all('a',title=True):add(anchor['title'],anchor.get_text(' ',strip=True),'former','former-lineup')
 # Explicit information-box membership labels also cover small or archived groups.
 for row in soup(re.split(r'(?m)^##\s',text,1)[0]).find_all('tr'):
  cells=row.find_all(['td','th'],recursive=False)
  if len(cells)<2 or any(cell.find('table') for cell in cells):continue
  label=cells[0].get_text(' ',strip=True)
  if label not in ('멤버','구성원','현재 멤버','전 멤버','이전 멤버','탈퇴 멤버'):continue
  status='former' if label in ('전 멤버','이전 멤버','탈퇴 멤버') else 'current'
  for anchor in cells[1].find_all('a',title=True):add(anchor['title'],anchor.get_text(' ',strip=True),status,'lineup-cell')
  if not cells[1].find('a',title=True):
   for name in re.split(r'[,·ㆍ、|\n]',cells[1].get_text('\n',strip=True)):
    name=re.sub(r'\([^)]*(?:리더|보컬|래퍼|댄서|탈퇴)[^)]*\)','',name).strip()
    if not name or len(name)>12 or re.search(r'담당|상징|요일|동물|포지션|이미지|대표색|탄생화',name) or re.search(r'담당|상징|요일|동물|포지션|이미지|대표색|탄생화',name) or re.search(r'[\[\]():/]|펼치기|접기|좋아요|左|右',name) or re.search(r'\d|미정|불명|리더|보컬|래퍼|댄서|비공개|맨 위|맨 아래|위부터|왼쪽|순서|전원|멤버|해체|사진',name) or re.fullmatch(r'\([^)]*\)',name):continue
    key=('unlinked:'+name,status)
    if key not in seen:seen.add(key);result.append({'documentTitle':None,'name':name,'status':status,'section':'unlinked-lineup-cell'})
 # Only roster-shaped tables within an explicit member section. Stop at unrelated
 # headings; narrative guest/comparison tables must not become group members.
 active=False;section_status='current';member_level=None
 for part in re.split(r'(?m)(^#{2,4}[^\n]*\n)',text):
  if part.startswith('##'):
   heading=part.replace('\\','')
   level=len(re.match(r'^#+',heading).group())
   if re.search('멤버|구성원|그룹 구성',heading) and not re.search('케미|변천|관계|조합|포지션',heading):
    active=True;member_level=level;section_status='former' if re.search('전 멤버|이전 멤버|탈퇴',heading) else 'current'
   elif member_level and level<=member_level:active=False
   elif active and re.search('케미|변천|관계|조합|포지션',heading):active=False
   continue
  if not active:continue
  for table in soup(part).find_all('table'):
   plain=table.get_text(' ',strip=True)
   portrait_titles={a['title'] for a in table.find_all('a',title=True) if a.find('img') and a['title'] not in COUNTRIES and a['title']!=title and not re.search('로고|심볼|국기|logo|symbol',a.find('img').get('alt',''),re.I)}
   portraits=bool(portrait_titles)
   named_columns=bool(re.search('생년월일|포지션|생일|이름',plain))
   if not portraits and not named_columns:continue
   first_column_cells=set();occupied={}
   for row in table.find_all('tr'):
    if row.find_parent('table') is not table:continue
    column=0
    for candidate in row.find_all(['td','th'],recursive=False):
     while occupied.get(column,0)>0:column+=1
     if column==0:first_column_cells.add(id(candidate))
     span=int(candidate.get('colspan',1))
     for position in range(column,column+span):occupied[position]=int(candidate.get('rowspan',1))
     column+=span
    occupied={position:remaining-1 for position,remaining in occupied.items() if remaining>1}
   for cell in table.find_all(['td','th']):
    if cell.find('table'):continue
    details=cell.find_parent('details')
    if details and details.find('summary') and re.search(r'발매|음반|세계관|수상|커버',details.find('summary').get_text()):continue
    if not portraits and id(cell) not in first_column_cells:continue
    for anchor in cell.find_all('a',title=True):
     name=anchor.get_text(' ',strip=True)
     if portraits and anchor['title'] not in portrait_titles:continue
     if not portraits and not (anchor.find('strong') or anchor.find_parent('strong') or re.search(r'\d{4}[.년-]',cell.parent.get_text(' ',strip=True))):continue
     if name and len(name)<=20 and not re.search(r'\d|리더|보컬|래퍼|댄서|국기|케미',name) and cell.get_text(' ',strip=True)==name:
      add(anchor['title'],name,section_status,'member-section-table')
 return result

class Documents:
 def __init__(self,cache,source,online=False,budget=256*1024**2):
  self.cache=Path(cache);self.db=sqlite3.connect(self.cache/'documents.sqlite');self.remote=None
  self.parsed_path=self.cache/'firstline-parsed.json'
  self.parsed=json.loads(self.parsed_path.read_text(encoding='utf-8')) if self.parsed_path.exists() else {}
  if online:
   from .dump_sqlite import SQLiteDocuments
   self.remote=SQLiteDocuments(source,self.cache,budget)
 def get(self,title):
  row=self.db.execute('SELECT md FROM docs WHERE title=?',(title,)).fetchone()
  if row is None:
   if self.remote:return self.remote.get(title)
   raise OSError('not-cached; resume with --online')
  return zlib.decompress(row[0]).decode('utf-8') if row[0] is not None else None
 def prefetch(self,titles):
  if not self.remote:return
  wanted=[title for title in dict.fromkeys(titles) if not self.db.execute('SELECT 1 FROM docs WHERE title=?',(title,)).fetchone()]
  for start in range(0,len(wanted),32):self.remote.prefetch(wanted[start:start+32])
 def close(self):
  write(self.parsed_path,self.parsed)
  self.db.close()
  if self.remote:self.remote.close()
 def structured(self,title,text,kind,aliases=()):
  key=kind+':'+title;digest=hashlib.sha256(text.encode()).hexdigest();signature=sorted(aliases)
  old=self.parsed.get(key,{})
  version=8
  if old.get('version')==version and old.get('sha256')==digest and old.get('aliases')==signature:return old['values']
  values=personal_facts(text) if kind=='person' else {'profile':profile_candidates(text),'roster':roster_entries(text,title,aliases)}
  self.parsed[key]={'version':version,'sha256':digest,'aliases':signature,'values':values}
  return values

COUNTRIES={'대한민국':'KR','한국':'KR','일본':'JP','중국':'CN','중화인민공화국':'CN','대만':'TW','중화민국':'TW','태국':'TH','미국':'US','캐나다':'CA','호주':'AU','뉴질랜드':'NZ','베트남':'VN','인도네시아':'ID','필리핀':'PH','브라질':'BR','독일':'DE','벨기에':'BE','러시아':'RU','인도':'IN','세네갈':'SN'}

def personal_facts(text):
 # The article's own profile precedes the first narrative section.
 prefix=re.split(r'(?m)^##\s',text,maxsplit=1)[0]
 values=profile_candidates(prefix,person=True);result={}
 if values.get('birthDate'):result.update(birthDate=values['birthDate'],birthDatePrecision='day')
 if values.get('legalName'):result['legalNames']={'und':values['legalName']}
 if values.get('nationalitiesText'):
  countries=list(dict.fromkeys(code for name,code in COUNTRIES.items() if re.search(r'(?<![가-힣A-Za-z])'+re.escape(name)+r'(?![가-힣A-Za-z])',values['nationalitiesText'])))
  if countries:result['nationalities']=countries
 if values.get('birthPlaceText'):result['birthPlace']=values['birthPlaceText']
 for row in soup(prefix).find_all('tr'):
  cells=row.find_all(['td','th'],recursive=False)
  if len(cells)<2 or cells[0].get_text(' ',strip=True) not in ('활동명','예명','영문명'):continue
  value=cells[1].get_text(' ',strip=True)
  if len(value)>45:continue
  if re.fullmatch(r'[A-Za-z0-9 .!_\-]+',value):result.setdefault('nameEn',value)
  elif re.fullmatch(r'[가-힣 ·]+',value):result.setdefault('nameKo',value)
 return result

def names_in_header(text,title):
 aliases=[title,re.sub(r'\([^)]*\)$','',title)]
 # An alternative Latin/Hangul header can identify the same group in this document.
 heading=re.search(r'(?m)^#\s+(.+)',text)
 if heading:aliases.append(heading.group(1).strip())
 return list(dict.fromkeys(aliases))

def firstline(config,targets,documents,report_path,*,apply=False,checkpoint_every=20):
 from .registry import load_bundles,validate
 bundles,shared,taxonomy,settings=load_bundles(config)
 before=copy.deepcopy(bundles);by_id={g['id']:g for g in bundles};people={m['id']:m for g in bundles for m in g['members']}
 owners={m['id']:g for g in bundles for m in g['members']}
 group_aliases={}
 for group in bundles:
  if group['gender']!='girl' or group.get('artistType')=='solo':continue
  for name in [group['name'],group.get('nameKo',''),group.get('nameEn',''),*group['aliases']]:
   if name:group_aliases.setdefault(normalized(name),set()).add(group['id'])
 all_aliases={normalized(name):g['id'] for g in bundles for name in [g['name'],*g['aliases']]}
 person_docs={}
 for member in people.values():
  for source in member.get('profileSources',{}).values():
   url=source.get('sourceUrl','') if isinstance(source,dict) else ''
   if url.startswith('https://namu.wiki/w/'):person_docs.setdefault(urllib.parse.unquote(url.split('/w/',1)[1]),set()).add(member['id'])
 report={'schemaVersion':1,'source':targets['source'],'policy':'firstline-then-cross-check','checkedAt':date.today().isoformat(),
  'groups':{},'members':{},'conflicts':[],'duplicateTitles':[],'lists':{},'newGroupIds':[],'newMemberIds':[],'updatedMemberIds':[]}
 discovered={row['title']:dict(row) for row in targets['groups']}
 lists=['걸그룹/목록','분류:대한민국의 걸그룹','틀:대한민국의 걸그룹']
 done_lists=set()
 while lists:
  title=lists.pop(0)
  if title in done_lists:continue
  done_lists.add(title)
  try:text=documents.get(title)
  except (OSError,ValueError,RuntimeError) as exc:report['lists'][title]={'status':'source_unavailable','reason':str(exc)};continue
  if text is None:report['lists'][title]={'status':'not_found','reason':'missing_in_snapshot'};continue
  entries=listed_groups(text)
  report['lists'][title]={'status':'checked','discovered':len(entries),'sourceUrl':ref(title)}
  for entry in entries:discovered.setdefault(entry['title'],{**entry,'listedDebutDateCandidate':entry.get('debutDateCandidate')})
  from .dump_markdown import document_links
  for link in document_links(text):
   if link.startswith('걸그룹/목록') and link not in done_lists:lists.append(link)
 # Every discovered target gets a result, including aliases and failures.
 jobs=[];canonical_groups={}
 for title,seed in discovered.items():
  item=report['groups'].setdefault(title,{'sourceUrl':ref(title),'status':'pending','previousMemberCount':0})
  if title in {*COUNTRIES,'홍콩','전 세계','전세계'}:
   item.update(status='excluded_non_group',reason='country_reference_in_list_table');continue
  try:text=documents.get(title)
  except (OSError,ValueError,RuntimeError) as exc:item.update(status='source_unavailable',reason=str(exc));continue
  if text is None:item.update(status='not_found',reason='missing_in_snapshot');continue
  if '동음이의어' in title:item.update(status='excluded_non_group',reason='disambiguation_page');continue
  redirect=re.search(r'(?im)^#(?:redirect|넘겨주기)\s+\[?\[?([^\]\n]+)',text)
  canonical=redirect.group(1).strip() if redirect else title
  if redirect:
   try:text=documents.get(canonical)
   except (OSError,ValueError,RuntimeError) as exc:item.update(status='source_unavailable',reason=str(exc));continue
   if not text:item.update(status='not_found',reason='redirect_target_missing',redirectTo=canonical);continue
  aliases=names_in_header(text,canonical)
  ids=set().union(*(group_aliases.get(normalized(name),set()) for name in aliases))
  document_ids={g['id'] for g in bundles if ref(canonical) in g.get('sourceDocuments',[])}
  if document_ids:ids=document_ids
  source_year=(seed.get('listedDebutDateCandidate') or '')[:4]
  if not source_year:
   debut_hint=profile_candidates(re.split(r'(?m)^##\s',text,1)[0]).get('debutDateText','')
   year_match=re.search(r'(?<!\d)(\d{4})(?:년|[.-])',debut_hint)
   if year_match:source_year=year_match.group(1)
  if source_year and not document_ids:
   mismatched={gid for gid in ids if by_id[gid].get('debutYear') and abs(by_id[gid]['debutYear']-int(source_year))>=3 and normalized(canonical)!=normalized(by_id[gid]['name']) and ref(canonical) not in by_id[gid].get('sourceDocuments',[])}
   if mismatched:
    item['homonymReviewIds']=sorted(mismatched);ids-=mismatched
  if canonical in canonical_groups:ids.add(canonical_groups[canonical])
  if not ids and source_year:
   punctuation_key=lambda name:re.sub(r'[^가-힣A-Za-z0-9]','',name).casefold()
   ids={g['id'] for g in bundles if str(g.get('debutYear'))==source_year and g.get('artistType')!='solo' and punctuation_key(canonical) in {punctuation_key(n) for n in [g['name'],*g['aliases']]}}
  if len(ids)>1:item.update(status='conflict_detected',reason='ambiguous_group_identity',candidateIds=sorted(ids));continue
  if ids:group=by_id[next(iter(ids))]
  else:
   name=re.sub(r'\((?:걸그룹|아이돌|음악 그룹|그룹)\)$','',canonical).strip()
   if normalized(name) in all_aliases:name=canonical+' (그룹'+('·'+source_year if source_year else '')+')'
   gid=stable_id('gg',ref(canonical))
   group={'id':gid,'name':name,'nameKo':name if re.search('[가-힣]',name) else None,'nameEn':name if re.search('[A-Za-z]',name) else None,'aliases':[name],
    'gender':'mixed' if '혼성' in canonical else 'girl','artistType':'group','groupStatus':'unknown','debutYear':None,'platforms':['youtube'],'supported':True,'defaultSelected':False,
    'ambiguousName':True,'collectionEnabled':False,'sampleEnabled':False,'members':[],'channels':[], 'registrationStatus':'namuwiki_collected'}
   bundles.append(group);by_id[gid]=group;all_aliases[normalized(name)]=gid;report['newGroupIds'].append(gid)
   for alias in [canonical,*group['aliases']]:group_aliases.setdefault(normalized(alias),set()).add(gid)
  gid=group['id'];item.update(groupId=gid,status='document_checked',previousMemberCount=len(group['members']),canonicalTitle=canonical)
  if canonical in canonical_groups:report['duplicateTitles'].append({'title':title,'groupId':gid,'canonicalTitle':canonical})
  canonical_groups[canonical]=gid
  source={'sourceUrl':ref(canonical),'dumpDate':targets['source']['dumpDate'],'checkedAt':report['checkedAt'],'sourceType':'namuwiki-dump','independenceKey':'namuwiki-'+targets['source']['dumpDate']}
  parsed=documents.structured(canonical,text,'group',[group['name'],*group['aliases']])
  values=parsed['profile']
  if source_year:merge_fact(group,'debutYear',int(source_year),source)
  debut=values.get('debutDate') or seed.get('listedDebutDateCandidate')
  if debut:
   merge_fact(group,'debutDate',debut,source)
   if group.get('debutDate')==debut:merge_fact(group,'debutYear',int(debut[:4]),source)
  group.setdefault('sourceDocuments',[])
  if ref(canonical) not in group['sourceDocuments']:group['sourceDocuments'].append(ref(canonical))
  entries=parsed['roster'];item['extractedMemberCount']=len(entries)
  item['textSha256']=hashlib.sha256(text.encode()).hexdigest()
  for entry in entries:jobs.append((group,item,entry,source))
  if not entries:item.update(status='members_not_found',reason='lineup_not_extracted_from_supported_layouts')
  if len(report['groups'])%checkpoint_every==0:write(report_path,report)
 documents.prefetch([entry['documentTitle'] for _,_,entry,_ in jobs if entry.get('documentTitle')])
 for group,item,entry,group_source in jobs:
  title=entry.get('documentTitle');person_key=title or group['id']+'::'+entry['name'];person_result=report['members'].setdefault(person_key,{'status':'pending','groupIds':[]})
  if group['id'] not in person_result['groupIds']:person_result['groupIds'].append(group['id'])
  try:text=documents.get(title) if title else None
  except (OSError,ValueError,RuntimeError) as exc:text=None;person_result.update(status='source_unavailable',reason=str(exc))
  canonical=title or person_key
  if text:
   redirect=re.search(r'(?im)^#(?:redirect|넘겨주기)\s+\[?\[?([^\]\n]+)',text)
   if redirect:
    canonical=redirect.group(1).strip()
    try:text=documents.get(canonical)
    except (OSError,ValueError,RuntimeError):text=None
  candidates=set(person_docs.get(canonical,set()))
  names={normalized(entry['name']),normalized(re.sub(r'\([^)]*\)$','',title or entry['name']))}
  canonical_candidates=set(candidates)
  for artist in bundles:
   if artist.get('artistType')=='solo' and group['id'] in artist.get('relatedGroupIds',[]) and len(artist.get('relatedMemberIds',[]))==1 and names.intersection(normalized(name) for name in [artist['name'],*artist['aliases']]):
    if artist['relatedMemberIds'][0] in people:candidates.add(artist['relatedMemberIds'][0])
  for member in people.values():
   related=member['groupId']==group['id'] or any(h.get('groupId')==group['id'] for h in member.get('membershipHistory',[]))
   if related and names.intersection(normalized(v) for v in [member['name'],*member['aliases']]):candidates.add(member['id'])
  if len(canonical_candidates)==1:candidates=canonical_candidates
  if len(candidates)>1:
   person_result.update(status='conflict_detected',reason='ambiguous_person_identity',candidateIds=sorted(candidates));continue
  if candidates:member=people[next(iter(candidates))]
  else:
   mid=stable_id('person',ref(canonical) if title else 'roster:'+person_key)
   member={'id':mid,'groupId':group['id'],'name':entry['name'],'aliases':[v for v in dict.fromkeys([entry['name'],re.sub(r'\([^)]*\)$','',title or entry['name'])]) if v],
    'taggingPolicy':'explicit-group-context','registrationStatus':'namuwiki_collected'}
   group['members'].append(member);people[mid]=member;owners[mid]=group;report['newMemberIds'].append(mid)
  person_docs.setdefault(canonical,set()).add(member['id'])
  source={**group_source,'sourceUrl':ref(canonical) if text else group_source['sourceUrl']}
  membership={'groupId':group['id'],'status':entry['status'],'sourceUrl':group_source['sourceUrl'],'sourceCheckedAt':report['checkedAt'],
   'asOf':targets['source']['dumpDate'],'verificationStatus':'namuwiki_collected','startDate':None,'endDate':None}
  history=member.setdefault('membershipHistory',[])
  conflicts=[h for h in history if h.get('groupId')==group['id'] and h.get('status') not in (entry['status'],'unknown')]
  if conflicts:
   merge_fact(member,'membershipCandidate',membership,source)
   report['conflicts'].append({'memberId':member['id'],'groupId':group['id'],'field':'membershipHistory','candidate':membership,'existing':conflicts})
  elif not any(h.get('groupId')==group['id'] and h.get('status')==entry['status'] for h in history):history.append(membership)
  updated=False
  if text:
   for field,value in documents.structured(canonical,text,'person').items():
    previous=copy.deepcopy(member.get(field));status=merge_fact(member,field,value,source)
    if status=='conflict_detected':report['conflicts'].append({'memberId':member['id'],'field':field,'candidate':value,'existing':previous})
    if member.get(field)!=previous:updated=True
    if field in ('nameEn','nameKo') and member.get(field)==value and value not in member['aliases']:member['aliases'].append(value)
   person_result.update(status='checked',sourceUrl=ref(canonical))
  elif person_result['status']=='pending':person_result.update(status='not_found',reason='member_document_missing; registered_from_group_lineup')
  if updated and member['id'] not in report['updatedMemberIds']:report['updatedMemberIds'].append(member['id'])
  roster=group.setdefault('memberRoster',{'current':[],'former':[],'evidenceUrl':group_source['sourceUrl'],'formerEvidenceUrl':group_source['sourceUrl'],
   'checkedAt':report['checkedAt'],'verificationStatus':'namuwiki_collected','asOf':targets['source']['dumpDate']})
  opposite='former' if entry['status']=='current' else 'current'
  if entry['name'] not in roster[opposite] and entry['name'] not in roster[entry['status']]:roster[entry['status']].append(entry['name'])
  evidence={'memberId':member['id'],'name':entry['name'],'status':entry['status'],**group_source,'verificationStatus':'namuwiki_collected'}
  record_roster_source(roster,evidence)
  roster['hasUnverifiedChanges']=True
  if roster['former'] and not roster.get('formerEvidenceUrl'):roster['formerEvidenceUrl']=group_source['sourceUrl']
  item['status']='registered';person_result['memberId']=member['id']
  item.setdefault('memberIds',[])
  if member['id'] not in item['memberIds']:item['memberIds'].append(member['id'])
  if len(report['members'])%checkpoint_every==0:write(report_path,report)
 # Reuse a group member's person identity for an already linked solo career.
 report['soloIdentityLinks']=[]
 for artist in bundles:
  if artist.get('artistType')!='solo' or artist.get('relatedMemberIds'):continue
  parents=set(artist.get('relatedGroupIds',[]))
  if not parents:continue
  names={normalized(name) for name in [artist['name'],*artist['aliases']]}
  matches=[m for m in people.values() if (m['groupId'] in parents or any(h.get('groupId') in parents for h in m.get('membershipHistory',[]))) and names.intersection(normalized(name) for name in [m['name'],*m['aliases']])]
  if len(matches)==1:
   artist['relatedMemberIds']=[matches[0]['id']];report['soloIdentityLinks'].append({'artistId':artist['id'],'memberId':matches[0]['id']})
 # Registry rules still apply: no IDs or source relationships are silently deleted.
 validate(bundles,shared,taxonomy)
 before_by_id={g['id']:g for g in before};changed=[g for g in bundles if before_by_id.get(g['id'])!=g]
 if apply:
  backup=Path(report_path).parent.parent/'work'/'namuwiki-backups'/hashlib.sha256(json.dumps(before,sort_keys=True,ensure_ascii=False).encode()).hexdigest()[:16]
  backup.mkdir(parents=True,exist_ok=True)
  for group in before:
   path=backup/(group['id']+'.json')
   if not path.exists():write(path,group)
  report['backupPath']=str(backup)
  for group in changed:write(Path(config)/'groups'/f"{group['id']}.json",group)
 for item in report['groups'].values():
  if item.get('groupId') in by_id:
   item['afterOwnedMemberCount']=len(by_id[item['groupId']]['members']);item['registeredMemberCount']=len(item.get('memberIds',[]))
 by_identity={}
 for title,item in report['groups'].items():
  if item.get('groupId'):by_identity.setdefault(item['groupId'],[]).append(title)
 report['mergedGroupAliases']=[{'groupId':gid,'titles':titles} for gid,titles in by_identity.items() if len(titles)>1]
 report['summary']={'discoveredCandidates':len(discovered),'discoveredGroups':sum(v['status']!='excluded_non_group' for v in report['groups'].values()),'excludedNonGroups':sum(v['status']=='excluded_non_group' for v in report['groups'].values()),'groupDocumentsChecked':sum(v['status'] not in ('not_found','source_unavailable','pending','excluded_non_group') for v in report['groups'].values()),
  'groupsWithExtractedMembers':sum(bool(v.get('extractedMemberCount')) for v in report['groups'].values()),'memberDocumentsChecked':sum(v['status']=='checked' for v in report['members'].values()),
  'newGroups':len(report['newGroupIds']),'newMembers':len(report['newMemberIds']),'updatedMembers':len(set(report['updatedMemberIds'])-set(report['newMemberIds'])),'enrichedProfiles':len(report['updatedMemberIds']),'mergedTitles':len(report['duplicateTitles']),
  'conflicts':len(report['conflicts']),'changedGroups':len(changed),'soloIdentityLinks':len(report['soloIdentityLinks']),'applied':apply,'officialVerificationPerformed':False}
 write(report_path,report);return report

def main():
 parser=argparse.ArgumentParser(description=__doc__)
 parser.add_argument('--config',type=Path,default=ROOT/'config');parser.add_argument('--cache',type=Path,default=ROOT/'work/namuwiki-latest')
 parser.add_argument('--targets',type=Path,default=ROOT/'config/namuwiki-targets.json');parser.add_argument('--source',type=Path,default=ROOT/'config/namuwiki-latest-sqlite.json')
 parser.add_argument('--skip-youtube',action='store_true',help='Skip the separate dump-linked YouTube identity stage')
 parser.add_argument('--report',type=Path,default=ROOT/'reports/namuwiki-registration.json');parser.add_argument('--online',action='store_true');parser.add_argument('--apply',action='store_true')
 args=parser.parse_args();source=json.loads(args.source.read_text(encoding='utf-8'));targets=json.loads(args.targets.read_text(encoding='utf-8'))
 docs=Documents(args.cache,source,args.online)
 try:report=firstline(args.config,targets,docs,args.report,apply=args.apply)
 finally:docs.close()
 if args.apply and not args.skip_youtube:
  from .dump_youtube import collect
  links=collect(args.config,args.cache/'documents.sqlite',report,ROOT/'work/youtube-channel-metadata.json',args.report.parent/'namuwiki-youtube-links.json',apply=True,online=args.online)
  print(json.dumps({'youtubeLinks':links['summary']},ensure_ascii=False))
 print(json.dumps(report['summary'],ensure_ascii=False))

if __name__=='__main__':main()
