"""Bounded first collection for new sources while retaining the existing archive.

This does not refresh old metadata or claim a fresh check of existing live streams.
"""
import copy
import json
import math
from pathlib import Path
from .quota import BudgetExceeded
from .publish import publish, write, now

def pending_sources(config, previous):
    old={c['id']:c for c in previous.get('channels',[])}
    result=[]
    for c in config['channels']:
        if not c.get('collectionEnabled',True):continue
        prior=old.get(c['id'])
        changed=prior and ((c.get('handle') and c['handle']!=prior.get('handle')) or
                          (c.get('platformId') and c['platformId']!=prior.get('platformId')))
        if not prior or changed:result.append(c)
    return result

def collect_pending(api, config, overrides, output, previous):
    from .youtube import resolve, normalize, YouTubeHTTPError
    output=Path(output)
    candidates=pending_sources(config,previous)[:20]
    if not candidates:return False
    # At most one channel lookup + one 10-item playlist read per source, plus
    # batched seed/metadata reads and retry headroom. Never reset quota history.
    planned=sum(10+len(c.get('seedVideoIds',[])) for c in candidates)
    required=2*len(candidates)+math.ceil(planned/50)+8
    if api.budget and api.budget.remaining('read')<required:return False
    staged=copy.deepcopy(config)
    selected={c['id'] for c in candidates}
    stage_sources={c['id']:c for c in staged['channels']}
    lookup=resolve(api,{**staged,'channels':[stage_sources[c['id']] for c in candidates]})
    ids=set();seeds={}
    for cid in selected:
        source=stage_sources[cid]
        if not source.get('collectionEnabled',True):continue
        for vid in source.get('seedVideoIds',[]):seeds[vid]=source['platformId'];ids.add(vid)
        try:
            page=api.get('playlistItems',part='contentDetails',playlistId=source['uploadsPlaylistId'],maxResults=10)
            ids.update(v['contentDetails']['videoId'] for v in page.get('items',[]))
        except YouTubeHTTPError as exc:
            if exc.status not in (400,404):raise
            source.update(collectionEnabled=False,unavailableReason=f'uploads-http-{exc.status}')
            lookup.pop(source['platformId'],None)
    new_records=[]
    for raw in api.videos(ids):
        source=lookup.get(raw['snippet']['channelId'])
        if not source or raw.get('status',{}).get('privacyStatus')!='public':continue
        if raw['id'] in seeds and seeds[raw['id']]!=source['platformId']:continue
        record=normalize(raw,source,staged,overrides['videos'].get(raw['id']))
        if record['groupIds']:new_records.append(record)
    old_sources={c['id']:c for c in previous.get('channels',[])}
    for c in staged['channels']:
        prior=old_sources.get(c['id'],{})
        if c['id'] not in selected:
            for field in ('unavailableReason','observedChannelName'):
                if prior.get(field):c[field]=prior[field]
            if prior.get('unavailableReason'):c['collectionEnabled']=False
    retained=[json.loads(p.read_text(encoding='utf-8')) for p in (output/'content').glob('*.json')]
    merged={v['id']:v for v in retained if not v.get('demo')}
    merged.update({v['id']:v for v in new_records})
    live_path=output/'live.json';candidate_path=output/'live-candidates.json'
    live=json.loads(live_path.read_text(encoding='utf-8')) if live_path.exists() else {'updatedAt':None,'items':[]}
    live_candidates=json.loads(candidate_path.read_text(encoding='utf-8')) if candidate_path.exists() else {'ids':[]}
    publish(list(merged.values()),staged,output=output)
    write(live_path,live);write(candidate_path,live_candidates)
    report_path=output/'collection-report.json'
    prior_report=json.loads(report_path.read_text(encoding='utf-8')) if report_path.exists() else {}
    write(report_path,{'updatedAt':now(),'mode':'targeted-new-sources','lastFullCollectionAt':prior_report.get('lastFullCollectionAt') or (prior_report.get('updatedAt') if prior_report.get('mode')!='targeted-new-sources' else None),
        'recordCount':len(merged),'externalRecordCount':sum('external' in v.get('contentTypes',[]) or v.get('category')=='external' for v in merged.values()),
        'checkedSourceIds':sorted(selected),'targetedRecordCount':len(new_records),
        'unavailableSources':[{'id':c['id'],'reason':c['unavailableReason'],'observedName':c.get('observedChannelName')} for c in staged['channels'] if c.get('unavailableReason')]})
    print(f'Targeted collection checked {len(selected)} new sources and retained {len(new_records)} artist-attributed videos. Existing archive and live confirmation time preserved.')
    return True

