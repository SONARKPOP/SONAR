"""Exact rolling-window YouTube activity; independent of real-world group status."""
import json
from datetime import datetime, timezone
from pathlib import Path
from .upload_cadence import stamp, upload_interval_hours

RULES=json.loads((Path(__file__).resolve().parents[1]/'config/activity-rules.json').read_text(encoding='utf-8'))
DAY=86400
WINDOWS={'uploads_24h':DAY,'uploads_3d':3*DAY,'uploads_5d':5*DAY,'uploads_7d':7*DAY,'uploads_14d':14*DAY}

def iso(value):
    return datetime.fromtimestamp(value,timezone.utc).isoformat().replace('+00:00','Z')

def effective_upload(raw, current):
    """Public videos/Shorts use publication; actual live streams use actual start."""
    if raw.get('status',{}).get('privacyStatus')!='public':return None
    snippet=raw.get('snippet',{});live=raw.get('liveStreamingDetails',{})
    if snippet.get('liveBroadcastContent')=='upcoming':return None
    if live:
        value=live.get('actualStartTime')
        if not value:return None
    elif snippet.get('liveBroadcastContent')=='live':return None
    else:value=snippet.get('publishedAt')
    at=stamp(value)
    if not raw.get('id') or at is None or at>current:return None
    return {'id':raw['id'],'at':iso(at)}

def calculate_activity(uploads, current, *, complete=True, official=True, checked_at=None, error=None):
    # Compare at the same microsecond precision used by persisted ISO dates.
    # A rounded checked_at must not look fractionally later than this run.
    current=stamp(iso(current))
    result={'activity_status':'UNKNOWN','last_upload_at':None,**{k:None for k in WINDOWS},'updated_at':iso(current),'checked_at':checked_at,'reason':error}
    checked=stamp(checked_at)
    if not official or not complete or error or checked is None or checked>current:
        result['reason']=error or ('incomplete-data' if not complete else 'unverified-or-stale')
        return result
    unique={}
    for upload in uploads:
        at=stamp(upload.get('at'))
        if upload.get('id') and at is not None and at<=current:
            unique[upload['id']]=max(at,unique.get(upload['id'],at))
    if not unique:
        result['reason']='no-valid-upload';return result
    last=max(unique.values());age=current-last
    valid_hours=max(RULES['staleHours'],upload_interval_hours(last,current,RULES)+RULES['cacheHours'])
    if current-checked>valid_hours*3600:
        result['reason']='unverified-or-stale';return result
    result['valid_until']=iso(checked+valid_hours*3600)
    result.update({k:sum(0<=current-at<=window for at in unique.values()) for k,window in WINDOWS.items()})
    result['last_upload_at']=iso(last);result['reason']=None
    if age>=RULES['lostSignalDays']*DAY:state='LOST SIGNAL'
    elif age>=RULES['anchoredDays']*DAY:state='ANCHORED'
    elif age<=RULES['surge']['lastUploadHours']*3600 and any(result[key]>=RULES['surge'][threshold] for key,threshold in [('uploads_24h','hours24'),('uploads_3d','days3'),('uploads_5d','days5')]):state='SURGE'
    elif age<=RULES['sailing']['lastUploadDays']*DAY or result['uploads_7d']>=RULES['sailing']['days7'] or result['uploads_14d']>=RULES['sailing']['days14']:state='SAILING'
    else:state='COASTING'
    result['activity_status']=state
    return result

def eligible_group(group):
    year=group.get('debutYear')
    return group.get('gender')=='girl' and group.get('artistType','group')=='group' and isinstance(year,int) and 2000<=year<=datetime.now(timezone.utc).year and group.get('directoryVisibility')!='agency-only'

def dedicated_sources(group, channels):
    return [c for c in channels if c.get('official') and c.get('collectionEnabled', True) and c.get('platform')=='youtube' and c.get('groupIds')==[group['id']] and not c.get('shared') and c.get('verification') and c.get('verificationStatus','VERIFIED') in ('VERIFIED','SUPPORTED')]

def group_snapshot(group, channels, cache, current):
    sources=dedicated_sources(group,channels)
    entries=[cache.get(c['id'],{}) for c in sources]
    errors=[entry.get('error') for entry in entries if entry.get('error')]
    checked=[entry.get('checkedAt') for entry in entries]
    complete=bool(entries) and all(entry.get('complete') for entry in entries)
    # Missing/failed secondary channels must not silently lower the group's counts.
    at=min(checked,key=lambda v:stamp(v) or 0) if checked and all(checked) else None
    uploads=[v for entry in entries for v in entry.get('uploads',[])]
    return {**calculate_activity(uploads,current,complete=complete,official=bool(sources),checked_at=at,error=next(iter(errors),None)),
            'channel_ids':[entry.get('channelId') for entry in entries], 'uploads':list({v['id']:v for v in uploads}.values()) if complete else []}
