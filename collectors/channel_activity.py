"""Cached, bounded official girl-group upload activity collection. No search.list."""
import argparse
import json
import os
import time
from pathlib import Path
from .activity import RULES, DAY, stamp, iso, effective_upload, eligible_group, dedicated_sources, group_snapshot
from .publish import DATA, write
from .registry import load_config
from .youtube import YouTube, expected_channel
from .quota import QuotaGuard, BudgetExceeded

def collect_channel(api, source, current):
    params={'id':source['platformId']} if source.get('platformId') else {'forHandle':source['handle'].lstrip('@')}
    response=api.get('channels',part='snippet,contentDetails',**params)
    raw=next(iter(response.get('items',[])),None)
    if not raw:raise ValueError('channel-unavailable')
    snippet=raw.get('snippet',{})
    if not expected_channel(source,snippet.get('title',''),snippet.get('customUrl','')):raise ValueError('channel-identity-changed')
    if 'topic' in snippet.get('title','').casefold().split():raise ValueError('topic-channel-excluded')
    playlist=raw['contentDetails']['relatedPlaylists']['uploads']
    ids=set();token=None;complete=False;uploads=[]
    for _ in range(RULES['maxPagesPerChannel']):
        page=api.get('playlistItems',part='contentDetails',playlistId=playlist,maxResults=50,**({'pageToken':token} if token else {}))
        rows=page.get('items',[])
        batch={v.get('contentDetails',{}).get('videoId') for v in rows}-{None}-ids
        ids.update(batch)
        for video in api.videos(batch):
            if video.get('snippet',{}).get('channelId')!=raw['id']:continue
            value=effective_upload(video,current)
            if value:uploads.append(value)
        token=page.get('nextPageToken')
        published=[stamp(v.get('contentDetails',{}).get('videoPublishedAt')) for v in rows]
        # Do not trust playlist modification time. Require a full old published
        # page beyond the 14-day boundary, or actual exhaustion of uploads.
        old_page=bool(published) and all(v is not None and v<current-14*DAY for v in published)
        if not token or (old_page and uploads):complete=True;break
    last=max(uploads,key=lambda value:stamp(value['at']),default=None)
    uploads=[v for v in uploads if current-stamp(v['at'])<=14*DAY or v==last]
    return {'channelId':raw['id'],'handle':snippet.get('customUrl'),'channelUrl':'https://www.youtube.com/channel/'+raw['id'],
            'configuredIdentity':source.get('platformId') or source.get('handle'),'checkedAt':iso(current),'complete':complete,
            'error':None if complete else 'pagination-incomplete','uploads':list({v['id']:v for v in uploads}.values())}

def refresh(api, config, output=DATA, current=None):
    current=time.time() if current is None else current;output=Path(output)
    path=output/'channel-activity.json'
    old=json.loads(path.read_text(encoding='utf-8')) if path.exists() else {}
    cache=old.get('channels',{});groups=[g for g in config['groups'] if eligible_group(g)]
    sources={c['id']:c for g in groups for c in dedicated_sources(g,config['channels'])}
    due=[c for c in sources.values() if cache.get(c['id'],{}).get('configuredIdentity')!=(c.get('platformId') or c.get('handle')) or current-(stamp(cache.get(c['id'],{}).get('checkedAt')) or 0)>=RULES['cacheHours']*3600]
    due.sort(key=lambda c:stamp(cache.get(c['id'],{}).get('checkedAt')) or 0)
    checked=0
    for source in due:
        if api.budget and api.budget.remaining('read')<4:break
        try:cache[source['id']]=collect_channel(api,source,current);checked+=1
        except BudgetExceeded:break
        except (RuntimeError,ValueError,KeyError,OSError) as exc:
            cache[source['id']]={'configuredIdentity':source.get('platformId') or source.get('handle'),'checkedAt':iso(current),'channelId':source.get('platformId'),'complete':False,'uploads':[],'error':str(exc)}
    cache={key:value for key,value in cache.items() if key in sources}
    snapshots={g['id']:group_snapshot(g,config['channels'],cache,current) for g in groups}
    write(path,{'schemaVersion':1,'updatedAt':iso(current),'channels':cache,'groups':snapshots,'checkedThisRun':checked,'dueRemaining':max(0,len(due)-checked)})
    print(f'Activity: {len(groups)} girl groups; {checked} channels checked; '+str(sum(v['activity_status']!='UNKNOWN' for v in snapshots.values()))+' classified. Unknown is retained for missing, stale or incomplete data.')
    return snapshots

def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--recalculate',action='store_true');args=parser.parse_args()
    if args.recalculate:
        class CachedOnly:
            class Budget:
                def remaining(self,_):return 0
            budget=Budget()
        api=CachedOnly()
    else:
        api=YouTube(os.environ.get('YOUTUBE_API_KEY'),QuotaGuard(DATA/'collection-state.json',read_run=RULES['maxReadCallsPerRun']))
    refresh(api,load_config())

if __name__=='__main__':main()
