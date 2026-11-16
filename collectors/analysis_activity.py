"""Observed archive analytics, separate from official activity state rules."""
import argparse,json,math
from collections import defaultdict
from datetime import datetime,timedelta,timezone
from pathlib import Path
from .activity import DAY,iso,stamp,dedicated_sources
from .activity_comparison import confirmed,evidence_for
from .source_policy import approved_original,public_artist_scope,reviewed_dedicated_channel
from .broadcast import is_music_broadcast
from .live_policy import is_continuous_live
from .publish import DATA,write

PERIODS=(7,30,90)
SERIES_DAYS=400
TYPES=('music','broadcast','radio','officialContent','externalConfirmed','externalInferred','live','shorts','unclassified')
KST=timezone(timedelta(hours=9))
def type_for(video,official,evidence):
 tabs=set(video.get('contentTypes',[]))|set(video.get('contentTabs',[]))
 if video.get('format')=='short' or video.get('category')=='shorts' or 'shorts' in tabs:return 'shorts'
 if video.get('format')=='live' or video.get('liveStatus') in ('live','ended'):return 'live'
 if is_music_broadcast(video):return 'broadcast'
 if video.get('externalType')=='radio' or 'radio' in tabs:return 'radio'
 if video.get('category')=='music' or 'music' in tabs:return 'music'
 if official:return 'officialContent'
 return 'externalConfirmed' if any(confirmed(e) for e in evidence) else 'externalInferred'

def identity_matches(source,entry):
 identities={v for v in (source.get('platformId'),source.get('handle')) if v}
 return entry.get('configuredIdentity') in identities and (not source.get('platformId') or entry.get('channelId')==source['platformId'])

def source_history(source,entry,current,days):
 identity=source.get('platformId') or source.get('handle')
 checked=stamp(entry.get('checkedAt'))
 if not entry or entry.get('error') or not identity_matches(source,entry) or checked is None or not 0<=current-checked<=DAY:return None
 uploads={u['id']:stamp(u.get('at')) for u in entry.get('uploads',[]) if u.get('id') and stamp(u.get('at')) is not None and stamp(u.get('at'))<=current}
 if not uploads or not entry.get('complete'):return None
 start=current-days*DAY
 # Old caches promise only 14 days. A latest upload older than the window proves
 # an observed zero at checkedAt; other 30/90 totals require explicit coverage.
 complete=days<=14 or max(uploads.values())<start or bool(entry.get('historyExhausted')) or (stamp(entry.get('historyFrom')) is not None and stamp(entry['historyFrom'])<=start)
 return sum(start<=at<=current for at in uploads.values()) if complete else None

def daily_series(values):
 daily={}
 for v in values:
  day=datetime.fromtimestamp(v['at'],KST).date().isoformat();bucket=daily.setdefault(day,{'date':day,'observedUploads':0,'official':0,**{kind:0 for kind in TYPES}})
  bucket['observedUploads']+=1;bucket['official']+=int(v['official']);bucket[v['type']]+=1
 return [daily[key] for key in sorted(daily)]

def build_analysis(videos,config,current,channel_cache=None):
 config=public_artist_scope(config);sources={c['id']:c for c in config['channels']};groups={g['id']:g for g in config['groups']};members={m['id']:m for m in config.get('members',[])}
 cache=channel_cache or {};records={gid:{} for gid in groups};seen=set();excluded=defaultdict(int)
 for video in videos:
  identity=video.get('id') or 'youtube__'+str(video.get('platformId',''))
  if identity in seen:continue
  seen.add(identity)
  if video.get('demo') or video.get('platform')!='youtube' or video.get('liveStatus')=='upcoming' or is_continuous_live(video):continue
  at=stamp(video.get('actualStartTime') if video.get('format')=='live' and video.get('actualStartTime') else video.get('publishedAt'))
  if at is None or at>current:continue
  source=sources.get(video.get('channelId'),{})
  if not approved_original(source):excluded['unapprovedSource']+=1;continue
  if source.get('official') and not any(reviewed_dedicated_channel(source,gid) for gid in source.get('groupIds',[])):
   excluded['unreviewedOfficialSource']+=1;continue
  individual=video.get('individualActivity') or {}
  gids=set(video.get('groupIds',[]))|set(individual.get('groupIds',[]))|{individual.get('artistId')}
  for gid in gids&groups.keys():
   evidence=[e for e in video.get('appearanceEvidence',[]) if evidence_for(e,groups[gid],members)]
   if evidence and all(e.get('role') in ('mention','original-artist','cover-target') for e in evidence):continue
   own=bool(source.get('official') and gid in source.get('groupIds',[]))
   person=gid in individual.get('groupIds',[]) and gid!=individual.get('artistId')
   outside=not own and not person
   event=video.get('appearanceEventId') or video.get('appearanceId') or video.get('eventId')
   records[gid][identity]={'id':identity,'at':at,'official':own,'individual':person,'outside':outside,'confirmed':outside and any(confirmed(e) for e in evidence),'type':type_for(video,own,evidence),'event':str(event) if event else None,'metadata':True,'memberIds':sorted(mid for mid in set(video.get('memberIds',[]))|{individual.get('memberId')}|set(groups.get(individual.get('artistId'),{}).get('relatedMemberIds',[])) if mid in members)}
 # Include known official upload IDs absent from retained video metadata, without
 # inventing their content type or participants.
 for gid,group in groups.items():
  for source in dedicated_sources(group,config['channels']):
   entry=cache.get(source['id'],{})
   if not identity_matches(source,entry) or entry.get('error'):continue
   for upload in entry.get('uploads',[]):
    at=stamp(upload.get('at'));vid=upload.get('id')
    if not vid or at is None or at>current:continue
    identity='youtube__'+vid
    records[gid].setdefault(identity,{'id':identity,'at':at,'official':True,'individual':False,'outside':False,'confirmed':False,'type':'unclassified','event':None,'metadata':False})
 rows=[]
 for gid,group in groups.items():
  values=list(records[gid].values());owned=dedicated_sources(group,config['channels']);everOfficial=any(v['official'] for v in values);everOutside=any(v['outside'] for v in values);everIndividual=any(v['individual'] for v in values)
  periods={}
  for days in PERIODS:
   sample=[v for v in values if 0<=current-v['at']<=days*DAY]
   exact=[source_history(s,cache.get(s['id'],{}),current,days) for s in owned]
   official_ids={u['id'] for source in owned for u in cache.get(source['id'],{}).get('uploads',[]) if u.get('id') and stamp(u.get('at')) is not None and 0<=current-stamp(u['at'])<=days*DAY}
   official=len(official_ids) if exact and all(n is not None for n in exact) else None
   observed=sum(v['official'] for v in sample)
   # A claimed exact count smaller than retained observations is inconsistent.
   if official is not None and official<observed:official=None
   external=[v for v in sample if v['outside']];individual=[v for v in sample if v['individual']]
   linked=[v for v in external if v['event']];unlinked=len(external)-len(linked)
   bins=[0]*days
   if official is not None:
    times={u['id']:stamp(u['at']) for source in owned for u in cache.get(source['id'],{}).get('uploads',[]) if u.get('id') in official_ids}
    for at in times.values():bins[min(days-1,int((current-at)//DAY))]+=1
   mean=official/days if official is not None else None
   periods[str(days)]={'officialPerDayMean':mean,'officialPerDayStdDev':math.sqrt(sum((n-mean)**2 for n in bins)/days) if mean is not None else None,'official':official,'officialObserved':observed if everOfficial else None,'confirmed':sum(v['confirmed'] for v in external) if everOutside else None,'inferred':sum(not v['confirmed'] for v in external) if everOutside else None,
    'member':len(individual) if everIndividual else None,'observedUploads':len(sample),'types':{kind:sum(v['type']==kind for v in sample) for kind in TYPES},
    'linkedAppearanceEvents':len({v['event'] for v in linked}),'unlinkedAppearanceUploads':unlinked,'distinctAppearances':len({v['event'] for v in linked}) if external and not unlinked else None,
    'officialCoverage':'complete' if official is not None else 'partial' if everOfficial else 'uncollected','series':daily_series(sample),'members':[{'memberId':mid,'name':members[mid].get('name',mid),'count':sum(mid in v.get('memberIds',[]) for v in individual)} for mid in sorted({mid for v in individual for mid in v.get('memberIds',[])})]}
  positive=any((periods['90'].get(key) or 0)>0 for key in ('official','officialObserved','confirmed','inferred','member'))
  last=max((v['at'] for v in values if v['official']),default=None)
  rows.append({'artistId':gid,'name':group.get('name',gid),'kind':'solo' if group.get('artistType')=='solo' else 'group','windows':periods,'series':daily_series([v for v in values if 0<=current-v['at']<=SERIES_DAYS*DAY]),'seriesDays':SERIES_DAYS,
   'lastObservedOfficialAt':iso(last) if last is not None else None,'hasObservedHistory':bool(values),'hasPositive90d':positive,
   'officialCheckedAt':min((cache.get(s['id'],{}).get('checkedAt') for s in owned if cache.get(s['id'],{}).get('checkedAt')),default=None),
   'knownInactiveDays':max((days for days in PERIODS if periods[str(days)]['official']==0),default=None)})
 return {'schemaVersion':1,'generatedAt':iso(current),'asOf':iso(current),'seriesDays':SERIES_DAYS,'periodDays':list(PERIODS),'dateBasis':'publishedAt; actualStartTime for live; Asia/Seoul buckets','typePriority':list(TYPES),'coverage':'retained public archive plus checked official upload IDs; external universe incomplete',
  'eventPolicy':'Only explicit appearance/event IDs link derived uploads. Similar titles are never merged.','excluded':dict(excluded),'artists':rows}

def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--data',type=Path,default=DATA);p.add_argument('--as-of');args=p.parse_args()
 catalog=json.loads((args.data/'catalog.json').read_text(encoding='utf-8'));current=stamp(args.as_of or catalog.get('contentUpdatedAt') or catalog['updatedAt'])
 videos=[json.loads(path.read_text(encoding='utf-8')) for path in (args.data/'content').glob('*.json')];cache=json.loads((args.data/'channel-activity.json').read_text(encoding='utf-8')).get('channels',{})
 result=build_analysis(videos,catalog,current,cache);write(args.data/'analysis-activity.json',result);print(json.dumps({'artists':len(result['artists']),'positive90d':sum(r['hasPositive90d'] for r in result['artists']),'asOf':result['asOf']}))
if __name__=='__main__':main()
