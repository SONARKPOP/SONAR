"""Canonical records are stored once; group files contain thin discovery indexes."""
import json
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from .live_policy import is_continuous_live

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'public' / 'data'
KST = timezone(timedelta(hours=9))

def now():
    return datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')

def write(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix('.tmp')
    content = json.dumps(value, ensure_ascii=False, indent=2) + '\n'
    if path.exists() and path.read_text(encoding='utf-8') == content:
        return
    temporary.write_text(content, encoding='utf-8')
    for attempt in range(6):
        try:
            temporary.replace(path)
            break
        except PermissionError:
            # Windows file scanners can briefly hold a freshly written index.
            if attempt == 5:
                raise
            time.sleep(0.05 * 2 ** attempt)

def summary(v):
    return {k: value for k, value in v.items() if k not in ('description', 'source', 'liveStatus', 'actualStartTime', 'actualEndTime', 'scheduledStartTime')}


def discovery_groups(video):
    return set(video['groupIds']) | set(video.get('individualActivity', {}).get('groupIds', []))


def archive_years(items):
    years = set()
    for item in items:
        try:
            stamp = datetime.fromisoformat(item['publishedAt'].replace('Z', '+00:00'))
        except (AttributeError, ValueError):
            continue
        years.add(str(stamp.replace(tzinfo=stamp.tzinfo or timezone.utc).astimezone(KST).year))
    return sorted(years, reverse=True)

def publish(records, config, events=(), output=DATA, demo=False):
    output = Path(output)
    # Events remain an empty schema field for compatibility; schedules are disabled.
    events = ()
    from .content_tags import apply_tags
    from .individual_activity import classify_individual, solo_review_candidates
    from .source_policy import approved_original, public_artist_scope, scope_video
    from .browse_index import build_indexes
    config = public_artist_scope(config)
    sources = {c['id']:c for c in config['channels']}
    artists = {group['id']:group for group in config['groups']}
    members = {member['id']:member for member in config['members']}
    indexed = {}
    for record in records:
        source = sources.get(record['channelId'], {})
        if not approved_original(source):
            continue
        record = scope_video(record, artists, members)
        if not record['groupIds']:
            continue
        video = apply_tags(record, source.get('official', False))
        activity = classify_individual(video, source, artists, members)
        if activity:
            video['individualActivity'] = activity
        else:
            video.pop('individualActivity', None)
        indexed[video['id']] = video
    records = indexed
    updated = now()
    ordered = sorted(records.values(), key=lambda v: v['publishedAt'], reverse=True)
    write(output / 'solo-review.json', {'updatedAt':updated,'candidates':solo_review_candidates(ordered,sources,artists)})
    for v in ordered:
        if v['id'] != f"{v['platform']}__{v['platformId']}":
            raise ValueError('Invalid canonical ID')
        if not all(c.isalnum() or c in '_-' for c in v['id']):
            raise ValueError('Unsafe content ID')
        write(output / 'content' / f"{v['id']}.json", v)
    # Remove records no longer retained (including initial demo data).
    for old in (output / 'content').glob('*.json'):
        if old.stem not in records:
            old.unlink()
    group_indexes = {group['id']:[] for group in config['groups']}
    for video in ordered:
        item = summary(video)
        for group_id in discovery_groups(video):
            if group_id in group_indexes:
                group_indexes[group_id].append(item)
    for group_id, items in group_indexes.items():
        write(output / 'groups' / f"{group_id}.json", {'schemaVersion': 1, 'updatedAt': updated, 'items':items, 'events':[]})
    group_ids = {g['id'] for g in config['groups']}
    for old in (output / 'groups').glob('*.json'):
        if old.stem not in group_ids:
            old.unlink()
    write(output / 'latest.json', {'schemaVersion': 1, 'updatedAt': updated, 'items': [summary(v) for v in ordered[:72]], 'events': list(events)})
    public_config = {k: config[k] for k in ('groups', 'members', 'channels', 'taxonomy')}
    public_config['browse'] = build_indexes(ordered,group_indexes,output,write,summary,discovery_groups,
                                            datetime.fromisoformat(updated.replace('Z','+00:00')))
    report_path = output/'collection-report.json'
    previous_collection = json.loads(report_path.read_text(encoding='utf-8')) if report_path.exists() else {}
    public_config['contentUpdatedAt'] = previous_collection.get('updatedAt') or max(
        (video.get('source',{}).get('collectedAt') or '' for video in ordered if not video.get('demo')),default='') or None
    # Only group-owned official uploads determine activity. Shared appearances
    # must not make a dormant official channel appear recently active.
    public_config['groups'] = []
    for g in config['groups']:
        owners = {g['id'], *g.get('relatedGroupIds', [])}
        official_ids = {c['id'] for c in config['channels'] if c['official'] and owners.intersection(c['groupIds'])}
        dates = [v.get('actualStartTime') or v['publishedAt'] for v in ordered
                 if not v.get('demo') and v.get('liveStatus')!='upcoming' and v['channelId'] in official_ids and g['id'] in v['groupIds']]
        source_review = next((c['unavailableReason'] for c in config['channels'] if c['id'] in official_ids and c.get('unavailableReason')), '')
        public_config['groups'].append({**g, 'contentCount':len(group_indexes[g['id']]), 'archiveYears':archive_years(group_indexes[g['id']]),
            'lastOfficialUploadAt':max(dates, default=None), 'officialSourceReviewReason':source_review, 'officialSourceConnected':any(c['id'] in official_ids and c.get('collectionEnabled',True) and not c.get('unavailableReason') for c in config['channels'])})
    public_config['defaultGroupIds'] = config.get('defaultGroupIds', [])
    public_config['collectionGroupIds'] = config.get('collectionGroupIds', [])
    from .activity import eligible_group, group_snapshot
    activity_path=output/'channel-activity.json'
    activity_cache=json.loads(activity_path.read_text(encoding='utf-8')).get('channels',{}) if activity_path.exists() else {}
    for group in public_config['groups']:
        if eligible_group(group):
            group['youtubeActivity']=group_snapshot(group,config['channels'],activity_cache,time.time())
    write(output / 'catalog.json', {'schemaVersion': 1, 'updatedAt': updated, 'demo': demo, **public_config})
    from .activity_comparison import build_comparison
    write(output / 'activity-comparison.json', build_comparison(ordered,{**config,'groups':public_config['groups']},time.time()))
    official = {c['id'] for c in config['channels'] if c['official']}
    live = [v for v in ordered if v.get('liveStatus') == 'live' and v['channelId'] in official and v.get('actualStartTime') and not v.get('actualEndTime') and not v.get('demo')]
    write(output / 'live.json', {'updatedAt': updated, 'items': [v for v in live if not is_continuous_live(v)], 'stations':[v for v in live if is_continuous_live(v)]})
    candidates = [v for v in ordered if v.get('liveStatus') in ('live', 'upcoming') and v['channelId'] in official]
    write(output / 'live-candidates.json', live_candidate_index(candidates))


def live_candidate_index(videos, waiting=None):
    starts = dict(waiting or {})
    ids = list(starts)
    for video in videos:
        if video['liveStatus'] not in ('live', 'upcoming'):
            continue
        video_id = video['platformId']
        ids.append(video_id)
        if video['liveStatus'] == 'upcoming' and video.get('scheduledStartTime'):
            starts[video_id] = video['scheduledStartTime']
    result = {'ids': sorted(set(ids))}
    if starts:
        result['scheduledStarts'] = starts
    return result
