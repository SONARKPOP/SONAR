"""Collect reviewed CHZZK live broadcasts using its documented Open API."""
import json
import os
import re
from datetime import datetime, timezone
from urllib.error import URLError
from urllib.parse import urlencode, urlsplit
from urllib.request import Request, urlopen

from .content_tags import apply_tags
from .publish import DATA, KST, ROOT, now, write
from .registry import load_config

CONFIG = ROOT / 'config' / 'platform-content.json'
CHANNEL = re.compile(r'[0-9a-f]{32}')
HOSTS = {'chzzk': {'chzzk.naver.com'}, 'naver': {'tv.naver.com'},
         'weverse': {'weverse.io'}, 'berriz': {'berriz.in', 'link.berriz.in'},
         'mnet': {'www.mnetplus.world', 'mnetplus.world'}}


def trusted_url(platform, value):
    url = urlsplit(value)
    return url.scheme == 'https' and url.hostname in HOSTS.get(platform, ()) and not url.username and not url.password and url.path not in ('', '/')


def make_request(client_id, secret):
    def get(path, **params):
        request = Request('https://openapi.chzzk.naver.com/open/v1/' + path + '?' + urlencode(params, doseq=True),
                          headers={'Client-Id': client_id, 'Client-Secret': secret, 'Accept': 'application/json'})
        with urlopen(request, timeout=15) as response:
            body = json.load(response)
        payload = body.get('content')
        if not isinstance(payload, dict) or not isinstance(payload.get('data'), list):
            raise ValueError('Unexpected CHZZK Open API response')
        return payload
    return get


def live_records(sources, get):
    candidates = {}
    ids = list(sources)
    for start in range(0, len(ids), 20):
        for channel in get('channels', channelIds=ids[start:start + 20])['data']:
            cid = channel['channelId']
            if cid in sources:
                candidates[cid] = channel['channelName']
    live, cursors = {}, set()
    next_page = None
    for _ in range(10 if candidates else 0):
        page = get('lives', size=20, **({'next': next_page} if next_page else {}))
        for entry in page['data']:
            cid = entry.get('channelId')
            raw_id = str(entry.get('liveId', ''))
            if cid not in candidates or not raw_id.isdecimal() or entry.get('adult') or not entry.get('liveTitle'):
                continue
            try:
                start = datetime.fromisoformat(entry['openDate'].replace('Z', '+00:00'))
                start = start.replace(tzinfo=start.tzinfo or KST).astimezone(timezone.utc).isoformat()
            except (KeyError, ValueError, AttributeError):
                continue
            source = sources[cid]
            thumbnail = (entry.get('liveThumbnailImageUrl') or '').replace('{type}', '480')
            tags = [tag for tag in (entry.get('tags') or []) if isinstance(tag, str)]
            live[raw_id] = apply_tags({
                'id': 'chzzk__live-' + raw_id, 'platform': 'chzzk', 'externalId': raw_id,
                'platformId': raw_id, 'sourceUrl': 'https://chzzk.naver.com/live/' + cid,
                'title': entry['liveTitle'], 'channelId': 'chzzk-' + cid, 'channelName': candidates[cid],
                'groupIds': source['groupIds'], 'memberIds': source.get('memberIds', []),
                'category': 'live', 'format': 'live', 'subtypes': ['LIVE'], 'tags': tags,
                'thumbnail': thumbnail if urlsplit(thumbnail).scheme == 'https' else '',
                'publishedAt': start, 'actualStartTime': start, 'liveStatus': 'live', 'official': True,
            }, True)
        next_page = (page.get('page') or {}).get('next')
        if not next_page or next_page in cursors:
            break
        cursors.add(next_page)
    return list(live.values())


def curated_records(rows, known):
    found = {}
    for entry in rows:
        platform, external_id = entry['platform'], str(entry['externalId'])
        if (not re.fullmatch(r'[A-Za-z0-9_-]+', external_id)
                or not trusted_url(platform, entry['sourceUrl'])
                or not trusted_url(platform, entry['evidenceUrl'])
                or not entry.get('groupIds')
                or set(entry['groupIds']) - known):
            raise ValueError('Invalid reviewed platform video')
        video_id = platform + '__' + external_id
        found[video_id] = apply_tags({'memberIds': [], 'subtypes': [], 'tags': [], 'format': 'video',
                                     'category': 'external', **entry, 'id': video_id,
                                     'externalId': external_id, 'platformId': external_id},
                                    entry.get('official', False))
    return list(found.values())


def main():
    config = json.loads(CONFIG.read_text(encoding='utf-8'))
    registry = load_config()
    known = {group['id'] for group in registry['groups']}
    members = {member['id']: member['groupId'] for member in registry['members']}
    sources = {}
    for source in config['chzzkChannels']:
        cid = source['channelId']
        groups = set(source['groupIds'])
        if (not CHANNEL.fullmatch(cid) or cid in sources or not groups or groups - known
                or not source.get('evidenceUrl', '').startswith('https://')
                or any(members.get(mid) not in groups for mid in source.get('memberIds', []))):
            raise ValueError('Invalid reviewed CHZZK channel')
        sources[cid] = source
    write(DATA / 'platform-content.json', {'items': curated_records(config['videos'], known)})
    client, secret = os.getenv('CHZZK_CLIENT_ID'), os.getenv('CHZZK_CLIENT_SECRET')
    live_path = DATA / 'chzzk-live.json'
    if not (client and secret and sources):
        if not sources or not live_path.exists():
            write(live_path, {'items': []})
        print('CHZZK live collection is waiting for credentials and reviewed channel IDs.')
        return
    try:
        live = live_records(sources, make_request(client, secret))
    except (URLError, ValueError, KeyError, OSError) as error:
        # Omit request and response details to avoid logging authentication material.
        print('::warning::CHZZK Open API collection failed (' + type(error).__name__ + ').')
        return
    write(live_path, {'updatedAt': now(), 'items': live})
    print(f'CHZZK reviewed live broadcasts: {len(live)}')


if __name__ == '__main__':
    main()
