"""Canonical records are stored once; group files contain thin discovery indexes."""
import json
import time
from datetime import datetime, timezone
from pathlib import Path
from .live_policy import is_continuous_live

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'public' / 'data'

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

def publish(records, config, events=(), output=DATA, demo=False):
    output = Path(output)
    # Events remain an empty schema field for compatibility; schedules are disabled.
    events = ()
    from .content_tags import apply_tags
    from .source_policy import approved_original
    sources = {c['id']:c for c in config['channels']}
    records = {v['id']: apply_tags(v, sources.get(v['channelId'], {}).get('official', False)) for v in records if approved_original(sources.get(v['channelId'], {}))}
    updated = now()
    ordered = sorted(records.values(), key=lambda v: v['publishedAt'], reverse=True)
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
    for g in config['groups']:
        write(output / 'groups' / f"{g['id']}.json", {'schemaVersion': 1, 'updatedAt': updated, 'items': [summary(v) for v in ordered if g['id'] in v['groupIds']], 'events': [e for e in events if g['id'] in e['groupIds']]})
    group_ids = {g['id'] for g in config['groups']}
    for old in (output / 'groups').glob('*.json'):
        if old.stem not in group_ids:
            old.unlink()
    write(output / 'latest.json', {'schemaVersion': 1, 'updatedAt': updated, 'items': [summary(v) for v in ordered[:72]], 'events': list(events)})
    public_config = {k: config[k] for k in ('groups', 'members', 'channels', 'taxonomy')}
    # Only group-owned official uploads determine activity. Shared appearances
    # must not make a dormant official channel appear recently active.
    public_config['groups'] = []
    for g in config['groups']:
        owners = {g['id'], *g.get('relatedGroupIds', [])}
        official_ids = {c['id'] for c in config['channels'] if c['official'] and owners.intersection(c['groupIds'])}
        dates = [v['publishedAt'] for v in ordered if not v.get('demo') and v['channelId'] in official_ids and g['id'] in v['groupIds']]
        source_review = next((c['unavailableReason'] for c in config['channels'] if c['id'] in official_ids and c.get('unavailableReason')), '')
        public_config['groups'].append({**g, 'contentCount':sum(g['id'] in v['groupIds'] for v in ordered),
            'lastOfficialUploadAt':max(dates, default=None), 'officialSourceReviewReason':source_review, 'officialSourceConnected':any(c['id'] in official_ids and c.get('collectionEnabled',True) and not c.get('unavailableReason') for c in config['channels'])})
    public_config['defaultGroupIds'] = config.get('defaultGroupIds', [])
    public_config['collectionGroupIds'] = config.get('collectionGroupIds', [])
    write(output / 'catalog.json', {'schemaVersion': 1, 'updatedAt': updated, 'demo': demo, **public_config})
    official = {c['id'] for c in config['channels'] if c['official']}
    live = [v for v in ordered if v.get('liveStatus') == 'live' and not is_continuous_live(v) and v['channelId'] in official and v.get('actualStartTime') and not v.get('actualEndTime') and not v.get('demo')]
    write(output / 'live.json', {'updatedAt': updated, 'items': live})
    candidates = [v['platformId'] for v in ordered if v.get('liveStatus') in ('live', 'upcoming') and v['channelId'] in official]
    write(output / 'live-candidates.json', {'ids': candidates})
