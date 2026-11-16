"""Register explicit title-song listings from already matched, cached artist documents.

Listings without authoritative work/recording IDs stay workId=null/recordingIds=[];
no track position, contributor role, ISRC or identity is inferred from a title.
"""
import argparse
import hashlib
import json
import re
from datetime import date
from pathlib import Path
from .profile_enrichment import documents_from_cache,clean,full_dates,source,soup
from .music_credits import build_catalog
ROOT=Path(__file__).resolve().parents[1]
TITLE_HEADERS={'타이틀곡','타이틀곡 및 후속곡'}
ALBUM_HEADERS={'앨범명','음반명','앨범 이름','제목','음반 제목','앨범'}
def key(text):return re.sub(r'\s+','',text).casefold()
def digest(text):return hashlib.sha256(text.encode()).hexdigest()[:20]

def table_rows(table):
 occupied={}
 for row in table.find_all('tr'):
  if row.find_parent('table') is not table:continue
  cells={pos:v[0] for pos,v in occupied.items()};next_occupied={pos:(cell,n-1) for pos,(cell,n) in occupied.items() if n>1};col=0
  for cell in row.find_all(['td','th'],recursive=False):
   while col in cells:col+=1
   w=int(cell.get('colspan',1));h=int(cell.get('rowspan',1))
   for pos in range(col,col+w):
    cells[pos]=cell
    if h>1:next_occupied[pos]=(cell,h-1)
   col+=w
  occupied=next_occupied
  yield [cells.get(pos) for pos in range(max(cells,default=-1)+1)]

def song_names(cell):
 copied=soup(str(cell))
 for tag in copied.find_all(['br','hr']):tag.replace_with('␞')
 lines=[]
 for line in copied.get_text(' ',strip=True).split('␞'):
  text=clean(line).strip('"“”‘’ ')
  if text and text not in ('-','―','—','미정','타이틀곡','TITLE') and len(text)<180:lines.append(text)
 # Logos can carry no visible text. A source song-document title is explicit identity evidence.
 if not lines:
  for a in cell.find_all('a',title=True):
   title=a['title']
   if a.find('img') and not title.startswith(('파일:','http:','https:')):lines.append(title)
 return list(dict.fromkeys(lines))

def candidates(text):
 for table_number,table in enumerate(soup(text).find_all('table')):
  if table.find('table'):continue
  rows=list(table_rows(table))
  if not rows:continue
  headers=[c.get_text(' ',strip=True) if c else '' for c in rows[0]]
  titlecol=next((i for i,h in enumerate(headers) if h in TITLE_HEADERS),None)
  albumcol=next((i for i,h in enumerate(headers) if h in ALBUM_HEADERS),None)
  datecol=next((i for i,h in enumerate(headers) if h in ('발매일','날짜','발매연도')),None)
  if titlecol is None or albumcol is None:continue
  year=None
  for row_number,cells in enumerate(rows[1:],1):
   if not cells:continue
   if len({id(c) for c in cells if c})==1:
    match=re.fullmatch(r'(\d{4})년',cells[0].get_text(' ',strip=True))
    if match:year=match[1]
    continue
   if max(titlecol,albumcol)>=len(cells) or cells[titlecol] is None or cells[albumcol] is None:continue
   albumcell=cells[albumcol];titlecell=cells[titlecol]
   albumanchors=[a for a in albumcell.find_all('a',title=True) if not a['title'].startswith(('http:','https:','파일:'))]
   albumdoc=albumanchors[0]['title'] if albumanchors else None
   albumtext=clean(albumcell.get_text(' ',strip=True));album=albumdoc or albumtext
   if not album or len(album)>180:continue
   date_text=cells[datecol].get_text(' ',strip=True) if datecol is not None and datecol<len(cells) and cells[datecol] else albumtext
   dates=full_dates(date_text)
   if not dates and year:
    dates=full_dates(year+'년 '+date_text)
   release_date=dates[0] if len(dates)==1 else None
   for title in song_names(titlecell):
    yield {'title':title,'releaseContext':{'title':album,'releaseDate':release_date,'sourceDocumentTitle':albumdoc},'promotionRole':'title' if headers[titlecol]=='타이틀곡' else 'title_or_followup','sourceLocator':{'table':table_number,'row':row_number,'column':titlecol},'sourceTitleDocument':next((a['title'] for a in titlecell.find_all('a',title=True) if clean(a.get_text(' ',strip=True))==title),None)}

def collect(seed_path,profile_report,cache,report_path,apply=False):
 data=json.loads(seed_path.read_text(encoding='utf-8-sig'));profiles=json.loads(profile_report.read_text(encoding='utf-8-sig'));docs=documents_from_cache(cache)
 songs={s['id']:s for s in data['songs']};artist_ids={a['artistId'] for a in data['artists']};source_ids={s['id'] for s in data['sources']};report={'schemaVersion':1,'checkedAt':date.today().isoformat(),'mode':'apply' if apply else 'dry_run','artists':{},'summary':{}};added=0;corroborated=0
 for artist,item in profiles['artists'].items():
  if item['status']!='processed':report['artists'][artist]={'status':'source_unavailable','registered':0};continue
  text=docs[item['documentTitle']];rows=list(candidates(text));report['artists'][artist]={'status':'processed' if rows else 'no_explicit_title_column','registered':0,'candidates':len(rows)}
  if not rows:continue
  sid='namu-titles-'+artist;src=source(item['documentTitle'],report['checkedAt'])
  if sid not in source_ids:
   data['sources'].append({'id':sid,'url':src['sourceUrl'],'publisher':'Namuwiki','retrievedAt':report['checkedAt'],'dumpDate':'2026-08-29','method':'cached_explicit_title_song_column','verification':'namuwiki_collected','documentSha256':hashlib.sha256(text.encode()).hexdigest(),'scope':['title_song_listing','release_context'],'note':'Title/lead-song listing only; no contributor or recording identity inference.'});source_ids.add(sid)
  if artist not in artist_ids:data['artists'].append({'artistId':artist,'externalIds':{},'identityEvidence':[src['sourceUrl']],'identityStatus':'reviewed_registry_match'});artist_ids.add(artist)
  for row in rows:
   identity=artist+'|'+item['documentTitle']+'|'+row['releaseContext']['title']+'|'+row['title'];identifier='namu-title:'+digest(identity)
   if identifier in songs:continue
   # Link only when artist + album context + song title match a single existing release appearance.
   matches=[]
   for song in data['songs']:
    if artist not in song['artistIds'] or key(song['title'])!=key(row['title']):continue
    recs=set(song['recordingIds']);albumids={t['albumId'] for t in data['tracks'] if t['recordingId'] in recs}
    if any(a['id'] in albumids and key(a['title'])==key(row['releaseContext']['title']) for a in data['albums']):matches.append(song)
   if len(matches)==1:
    song=matches[0];song['titleTrack']=True;song.setdefault('titleTrackEvidence',[])
    evidence={'sourceId':sid,'promotionRole':row['promotionRole'],'sourceLocator':row['sourceLocator']}
    if evidence not in song['titleTrackEvidence']:song['titleTrackEvidence'].append(evidence);corroborated+=1
    if sid not in song['sourceIds']:song['sourceIds'].append(sid)
    continue
   song={'id':identifier,'title':row['title'],'artistIds':[artist],'workId':None,'recordingIds':[],'canonicalBasis':'explicit_source_title_song_listing','titleTrack':row['promotionRole']=='title','promotionRole':row['promotionRole'],'releaseContext':row['releaseContext'],'sourceLocator':row['sourceLocator'],'sourceTitleDocument':row['sourceTitleDocument'],'sourceIds':[sid]}
   data['songs'].append(song);songs[identifier]=song;added+=1;report['artists'][artist]['registered']+=1
 data['coverage']['artistCount']=len(data['artists']);data['coverage']['note']=f"부분 수집: 크레딧 작품 {len(data['works'])}개와 명시적 타이틀/후속곡 목록. 나무위키 1차 수집은 공식 검증과 구분하며, 제목만 확인된 곡의 작가·녹음·트랙 순서는 미확인입니다."
 registry={json.loads(p.read_text(encoding='utf-8-sig'))['id'] for p in (ROOT/'config/groups').glob('*.json')};build_catalog(data,registry)
 report['summary']={'processedArtistDocuments':sum(i['status']!='source_unavailable' for i in report['artists'].values()),'artistsWithExplicitTitleColumns':sum(i['status']=='processed' for i in report['artists'].values()),'newTitleListings':added,'existingCreditSongsCorroborated':corroborated,'totalSongs':len(data['songs']),'works':len(data['works']),'recordings':len(data['recordings']),'artists':len(data['artists'])}
 if apply:
  backup=ROOT/'work/music-title-backups';backup.mkdir(parents=True,exist_ok=True);backupfile=backup/(report['checkedAt']+'.json')
  if not backupfile.exists():backupfile.write_bytes(seed_path.read_bytes())
  seed_path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
 report_path.parent.mkdir(parents=True,exist_ok=True);report_path.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n');return report

def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--cache',type=Path,required=True);p.add_argument('--profiles',type=Path,default=ROOT/'reports/profile-enrichment-20261117.json');p.add_argument('--seed',type=Path,default=ROOT/'config/music-credits.json');p.add_argument('--report',type=Path,default=ROOT/'reports/title-song-collection-20261117.json');p.add_argument('--apply',action='store_true');a=p.parse_args();print(json.dumps(collect(a.seed,a.profiles,a.cache,a.report,a.apply)['summary']))
if __name__=='__main__':main()
