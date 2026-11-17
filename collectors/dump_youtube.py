"""Register dump-linked dedicated YouTube identities without inventing verification."""
import argparse,copy,hashlib,json,re,sqlite3,urllib.parse,urllib.request,zlib
from concurrent.futures import ThreadPoolExecutor,as_completed
from pathlib import Path
from .publish import write,now
from .registry import load_bundles,validate
from .channel_registration import register_channel

ROOT=Path(__file__).resolve().parents[1]
def normalize_url(value):
 try:
  parsed=urllib.parse.urlsplit(value)
  if parsed.hostname not in ('youtube.com','www.youtube.com','m.youtube.com') or parsed.username or parsed.password:return None
  path=urllib.parse.unquote(parsed.path).rstrip('/')
  match=re.match(r'^/(channel/UC[\w-]{22}|@[^/\s?#]+|(?:user|c)/[^/\s?#]+)(?:/(?:videos|featured|streams|shorts|about))?$',path)
  return 'https://www.youtube.com/'+match.group(1) if match else None
 except ValueError:return None

def extract_links(text):
 from .dump_markdown import soup
 prefix=re.split(r'(?m)^##\s',text,1)[0]
 found=[a['href'] for a in soup(prefix).find_all('a',href=True)]
 found+=re.findall(r'https?://(?:www\.|m\.)?youtube\.com/[^\s\]<>"()]+',prefix)
 return sorted({url for value in found if (url:=normalize_url(value))})

def channel_metadata(html):
 match=re.search(r'"channelMetadataRenderer"\s*:',html)
 if not match:raise ValueError('channel_metadata_missing')
 record,_=json.JSONDecoder().raw_decode(html[match.end():].lstrip())
 cid=record.get('externalId','')
 if not re.fullmatch(r'UC[\w-]{22}',cid):raise ValueError('channel_id_missing')
 return {'channelId':cid,'name':record.get('title',''),'description':record.get('description',''),
         'handleUrl':record.get('vanityChannelUrl'),'channelUrl':'https://www.youtube.com/channel/'+cid}

def resolve(url):
 parsed=urllib.parse.urlsplit(url)
 request=urllib.request.Request(urllib.parse.urlunsplit((parsed.scheme,parsed.netloc,urllib.parse.quote(parsed.path,safe='/@._-'),parsed.query,'')),headers={'User-Agent':'Mozilla/5.0 SONARChannelReview/1.0 (https://github.com/SONARKPOP/SONAR)'})
 with urllib.request.urlopen(request,timeout=20) as response:html=response.read(8*1024**2).decode('utf-8')
 return {**channel_metadata(html),'checkedAt':now()}

def identity_matches(group,observed):
 norm=lambda v:re.sub(r'[^\w]','',v.casefold())
 title=norm(observed.get('name',''));description=observed.get('description','')
 if re.search(r'fan.?channel|fan.?archive|fan.?site|fan.?page|unofficial|비공식|팬.?채널|팬.?페이지|팬.?사이트|팬튜브|\btopic\b|주제(?:\s|$)',observed.get('name','')+' '+description,re.I):return False
 if re.search(r'vevo(?:\s|$)|\bcompany\b|\bentertainment\b|엔터테인먼트',observed.get('name',''),re.I):return False
 aliases=[norm(v) for v in [group['name'],group.get('nameKo',''),group.get('nameEn',''),*group['aliases']] if v]
 return any(value and (title==value or len(value)>=3 and value in title) for value in aliases)

def collect(config,documents,registration,cache,report_path,apply=False,online=False):
 bundles,shared,taxonomy,_=load_bundles(config);before=copy.deepcopy(bundles);groups={g['id']:g for g in bundles}
 cache=Path(cache);state=json.loads(cache.read_text(encoding='utf-8')) if cache.exists() else {}
 db=sqlite3.connect(documents);items=[];seen=set()
 for title,row in registration['groups'].items():
  if row.get('groupId') not in groups:continue
  canonical=row.get('canonicalTitle',title);raw=db.execute('SELECT md FROM docs WHERE title=?',(canonical,)).fetchone()
  if not raw or not raw[0]:continue
  for url in extract_links(zlib.decompress(raw[0]).decode('utf-8')):
   key=(row['groupId'],url)
   if key in seen:continue
   seen.add(key);items.append({'groupId':key[0],'channelUrl':url,'sourceUrl':row['sourceUrl'],'dumpDate':registration['source']['dumpDate']})
 db.close()
 existing=[c for b in bundles for c in b['channels']]+shared
 owners={c['platformId']:c for c in existing if c.get('platformId')}
 known_urls={normalize_url('https://www.youtube.com/'+c['handle']):c for c in existing if c.get('handle')}
 known_urls.update({normalize_url('https://www.youtube.com/channel/'+c['platformId']):c for c in existing if c.get('platformId')})
 wanted=sorted({i['channelUrl'] for i in items if i['channelUrl'] not in state and not known_urls.get(i['channelUrl'],{}).get('platformId')})
 if online:
  with ThreadPoolExecutor(max_workers=4) as pool:
   futures={pool.submit(resolve,url):url for url in wanted}
   for future in as_completed(futures):
    url=futures[future]
    try:state[url]=future.result()
    except Exception as exc:state[url]={'error':type(exc).__name__+': '+str(exc),'checkedAt':now()}
    write(cache,state)
 for url,source in known_urls.items():
  if source.get('platformId'):state.setdefault(url,{'channelId':source['platformId'],'name':source['name'],'description':'','knownSourceId':source['id'],'channelUrl':'https://www.youtube.com/channel/'+source['platformId']})
 report={'updatedAt':now(),'sourceSnapshot':registration['source']['dumpDate'],'items':[],'newSourceIds':[],'filledChannelIds':[],'linkedArtists':[]}
 for item in items:
  group=groups[item['groupId']];observed=state.get(item['channelUrl'],{});cid=observed.get('channelId');owner=owners.get(cid)
  own=next((c for c in group['channels'] if c.get('platformId')==cid or normalize_url('https://www.youtube.com/'+c.get('handle',''))==item['channelUrl']),None)
  status='existing' if own and own.get('platformId') else 'pending'
  candidate={**item,'verificationStatus':'UNVERIFIED','observedName':observed.get('name'),'channelId':cid,'handle':observed.get('handleUrl'),'lastCheckedAt':observed.get('checkedAt'),'reason':observed.get('error') or 'Dedicated ownership requires review.'}
  # A registry fallback is not a fresh observation. Do not invent checked dates.
  if observed.get('checkedAt') or status!='existing':
   previous_id=own.get('platformId') if own else None
   decision=register_channel(group,{**observed,'channelUrl':item['channelUrl']},bundles,existing)
   candidate.update(decision)
   status='existing' if own and decision['decision']=='approve' else 'linked' if decision['decision']=='approve' else 'pending'
   if status=='linked':
    source=next(c for c in group['channels'] if c['id']==decision['sourceId'])
    existing.append(source);owners[cid]=source
    report['newSourceIds'].append(source['id']);report['linkedArtists'].append(group['id'])
   elif status=='existing' and not previous_id:
    report['filledChannelIds'].append(own['id'])
  report['items'].append({**candidate,'status':status})
 validate(bundles,shared,taxonomy)
 changed=[g for old,g in zip(before,bundles) if old!=g]
 if apply:
  backup=ROOT/'work/youtube-link-backup';backup.mkdir(parents=True,exist_ok=True)
  for old in before:
   path=backup/(old['id']+'.json')
   if not path.exists():write(path,old)
  for g in changed:write(Path(config)/'groups'/(g['id']+'.json'),g)
 report['summary']={'linksFound':len(items),'artistsWithLinks':len({i['groupId'] for i in items}),'newDedicatedChannels':len(report['newSourceIds']),'newlyLinkedArtists':len(set(report['linkedArtists'])),'filledChannelIds':len(report['filledChannelIds']),'pendingLinks':sum(i['status'] in ('pending','shared_or_other_artist') for i in report['items']),'changedProfiles':len(changed),'applied':apply}
 write(report_path,report);return report

def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--documents',type=Path,required=True);p.add_argument('--cache',type=Path,default=ROOT/'work/youtube-channel-metadata.json');p.add_argument('--report',type=Path,default=ROOT/'reports/namuwiki-youtube-links.json');p.add_argument('--online',action='store_true');p.add_argument('--apply',action='store_true');args=p.parse_args()
 report=collect(ROOT/'config',args.documents,json.loads((ROOT/'reports/namuwiki-registration.json').read_text(encoding='utf-8')),args.cache,args.report,args.apply,args.online);print(json.dumps(report['summary']))
if __name__=='__main__':main()
