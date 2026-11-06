"""YouTube adapter. Uses stdlib only; secrets never appear in URLs in logs."""
import argparse
from functools import lru_cache
import json
import os
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from .publish import ROOT, DATA, now, publish, write
from .registry import load_config
from .quota import QuotaGuard, BudgetExceeded
from .source_policy import approved_original

class YouTubeHTTPError(RuntimeError):
    def __init__(self, resource, status):
        self.resource, self.status = resource, status
        super().__init__(f'YouTube {resource} returned HTTP {status}; check key restrictions, quota, and source configuration.')

def expected_channel(channel, title):
    normalize_name = lambda value: re.sub(r'[^\w]', '', value.casefold())
    actual = normalize_name(title)
    names = channel.get('expectedChannelNames', [])
    return not names or any(normalize_name(name) in actual for name in names if normalize_name(name))

class YouTube:
    def __init__(self, key, budget=None):
        if not key:
            raise ValueError('Set YOUTUBE_API_KEY (GitHub Actions secret or environment variable).')
        self.key = key
        self.budget = budget

    def get(self, resource, **params):
        url = 'https://www.googleapis.com/youtube/v3/' + resource + '?' + urllib.parse.urlencode({**params, 'key': self.key})
        for attempt in range(4):
            if self.budget:self.budget.consume(resource)
            try:
                with urllib.request.urlopen(url, timeout=30) as response:
                    return json.load(response)
            except urllib.error.HTTPError as exc:
                # Avoid including the request URL (which contains the API key).
                if exc.code not in (429, 500, 502, 503, 504) or attempt == 3:
                    raise YouTubeHTTPError(resource, exc.code) from None
            except urllib.error.URLError:
                if attempt == 3:
                    raise RuntimeError('YouTube connection failed after retries.') from None
            time.sleep(2 ** attempt)

    def pages(self, resource, limit=2, **params):
        token = None
        for _ in range(limit):
            result = self.get(resource, **params, **({'pageToken': token} if token else {}))
            yield from result.get('items', [])
            token = result.get('nextPageToken')
            if not token:
                break

    def videos(self, ids):
        ids = sorted(set(ids))
        result = []
        for start in range(0, len(ids), 50):
            result.extend(self.get('videos', part='snippet,contentDetails,liveStreamingDetails,status', id=','.join(ids[start:start + 50])).get('items', []))
        return result

@lru_cache(maxsize=4096)
def alias_pattern(alias):
    return re.compile(r'(?<![\w])' + re.escape(alias) + r'(?![\w])', re.IGNORECASE)


def mentions(text, alias):
    # Latin word boundaries prevent IVE matching "live" or REI matching other words.
    return bool(alias_pattern(alias).search(text)) if alias.isascii() else alias.casefold() in text.casefold()

def member_match(member, snippet, groups):
    title = snippet['title']
    cautious = {a.casefold() for a in member.get('ambiguousAliases', [])}
    for alias in member['aliases']:
        if alias.casefold() in cautious:
            # Descriptions often contain a boilerplate list of every member.
            # Only explicit title mentions or editorial overrides assign members.
            if re.search(r'#' + re.escape(alias) + r'(?![\w])', title, re.I):
                return True
            if alias.isascii() and alias.upper()==alias and member['groupId'] in groups and re.search(r'(?<![\w])' + re.escape(alias) + r'(?![\w])', title):
                return True
        elif re.search(r'(?<![\w])' + re.escape(alias) + r'(?![\w])', title, re.I):
            return True
    return False

def infer_members(snippet, groups, config):
    """Resolve shared stage names only within explicit group context."""
    matched=[m for m in config['members'] if member_match(m,snippet,groups)]
    if groups:
        # Group-owned videos never imply another group from a bare member name.
        return [m['id'] for m in matched if m['groupId'] in groups]
    result=[]
    for member in matched:
        aliases=[a for a in member['aliases'] if re.search(r'(?<![\w])'+re.escape(a)+r'(?![\w])',snippet['title'],re.I)]
        unique=any(not any(other['groupId']!=member['groupId'] and a.casefold() in {v.casefold() for v in other['aliases']} for other in config['members']) for a in aliases)
        if unique:result.append(member['id'])
    return result

def classify(title, description, official):
    category, subtype = ('own' if official else 'external'), '기타'
    # Related videos take precedence over the MV/performance words they discuss.
    if re.search(r'reaction|리액션|리엑션', title, re.I):
        subtype = '리액션'
    elif re.search(r'behind|비하인드', title, re.I):
        subtype = '비하인드'
    elif re.search(r'teaser|티저|preview|미리보기', title, re.I):
        subtype = '티저'
    elif re.search(r'cover video|커버', title, re.I):
        category, subtype = 'music', '커버'
    elif re.search(r'\bM/?V\b|music video|performance|퍼포먼스', title, re.I):
        category, subtype = 'music', 'MV' if re.search(r'\bM/?V\b|music video', title, re.I) else '퍼포먼스'
    elif re.search(r'vlog|브이로그', title, re.I):
        subtype = '브이로그'
    short = bool(re.search(r'#shorts?\b', title + '\n' + description, re.I))
    return ('shorts' if short else category), subtype, short

def normalize(raw, channel, config, override=None):
    snippet = raw['snippet']
    text = snippet['title']
    groups = set(channel['groupIds'] if channel['official'] else [])
    owner_groups = set(groups)
    groups.update(g['id'] for g in config['groups'] if (not g.get('ambiguousName') or owner_groups.intersection(g.get('relatedGroupIds', [])))
                  and (not channel['official'] or g.get('artistType') != 'solo' or g['id'] in owner_groups
                       or owner_groups.intersection(g.get('relatedGroupIds', [])))
                  and any(mentions(text, a) for a in g['aliases'] if a not in g.get('ambiguousAliases', []) or owner_groups.intersection(g.get('relatedGroupIds', []))))
    for artist in config['groups']:
        if artist['id'] in groups and artist.get('artistType') == 'solo':
            groups.update(artist.get('relatedGroupIds', []))
    scoped_members, appearance_evidence = [], []
    if not channel['official']:
        credit_lines = [line for line in snippet.get('description', '').splitlines()
                        if re.match(r'^\s*(?:\uCD9C\uC5F0(?:\uC9C4)?|\uAC8C\uC2A4\uD2B8|guests?|starring)\s*[:\uFF1A-]', line, re.I)]
        for group in config['groups']:
            if not group.get('ambiguousName') and any(mentions(line, alias) for line in credit_lines for alias in group['aliases']):
                groups.add(group['id'])
                appearance_evidence.append({'groupId':group['id'], 'source':'publisher-credit-line',
                    'role':'participant', 'url':'https://www.youtube.com/watch?v=' + raw['id']})
        known_members = {m['id']: m for m in config['members']}
        for program in channel.get('programs', []):
            if not re.search(program['titlePattern'], text, re.I):
                continue
            for cast in program.get('cast', []):
                member = known_members.get(cast['memberId'])
                if member and any(mentions(text, alias) for alias in cast['titleAliases']):
                    groups.add(member['groupId'])
                    scoped_members.append(member['id'])
                    appearance_evidence.append({'memberId':member['id'], 'source':'publisher-program-title',
                        'role':'participant', 'url':cast['evidenceUrl']})
    # A name unique in our catalog may still belong to an unrelated artist.
    members = infer_members(snippet, groups, config) if groups else []
    members = sorted(set(members + scoped_members))
    groups.update(m['groupId'] for m in config['members'] if m['id'] in members)
    for artist in config['groups']:
        if artist.get('artistType') == 'solo' and set(artist.get('relatedMemberIds', [])).intersection(members):
            groups.add(artist['id'])
            groups.update(artist.get('relatedGroupIds', []))
    live = raw.get('liveStreamingDetails', {})
    status = 'ended' if live.get('actualEndTime') else 'live' if live.get('actualStartTime') else 'upcoming' if live.get('scheduledStartTime') else 'none'
    category, subtype, short = classify(snippet['title'], snippet.get('description', ''), channel['official'])
    thumbnails = snippet.get('thumbnails', {})
    thumb = next((thumbnails[k]['url'] for k in ('high', 'medium', 'default') if k in thumbnails), '')
    v = {'id': f"youtube__{raw['id']}", 'platform': 'youtube', 'platformId': raw['id'], 'demo': False, 'title': snippet['title'], 'description': snippet.get('description', ''), 'publishedAt': snippet['publishedAt'], 'groupIds': sorted(groups), 'memberIds': members, 'channelId': channel['id'], 'channelName': snippet['channelTitle'], 'category': category, 'subtypes': [subtype], 'tags': [subtype], 'format': 'short' if short else 'live' if status in ('live', 'upcoming', 'ended') else 'video', 'thumbnail': thumb, 'durationLabel': raw.get('contentDetails', {}).get('duration', 'VIDEO').replace('PT', '').lower(), 'liveStatus': status, 'actualStartTime': live.get('actualStartTime'), 'actualEndTime': live.get('actualEndTime'), 'scheduledStartTime': live.get('scheduledStartTime'), 'source': {'collectedAt': now(), 'adapter': 'youtube-v3'}}
    # Source ownership is independent of music/short/live format.
    if not channel['official']:
        v['contentTypes'] = ['external']
        if channel.get('externalType'):
            v['externalType'] = channel['externalType']
    if not channel['official']:
        for program in channel.get('programs', []):
            if re.search(program['titlePattern'], snippet['title'], re.I):
                v.update(programId=channel['id'] + '--' + program['id'],
                         programName=program['name'], externalType=program['externalType'])
                break
    if appearance_evidence:
        v['appearanceEvidence'] = appearance_evidence
    if override:
        allowed = {'groupIds', 'memberIds', 'category', 'subtypes', 'tags', 'format', 'externalType', 'programId', 'programName', 'contentTypes', 'ownType', 'appearanceEvidence'}
        unknown = set(override) - allowed
        if unknown:
            raise ValueError(f'Unsupported override fields: {sorted(unknown)}')
        v.update(override)
    v['memberTagging'] = {'policy':'title-only-v1', 'source':'manual-override' if override and 'memberIds' in override else 'publisher-program-title' if scoped_members else 'title' if v['memberIds'] else 'unclassified', 'appearanceVerified':False}
    valid_groups = {g['id'] for g in config['groups']}
    valid_members = {m['id']:m['groupId'] for m in config['members']}
    if set(v['groupIds']) - valid_groups or any(m not in valid_members or valid_members[m] not in v['groupIds'] for m in v['memberIds']):
        raise ValueError('Override refers to an unknown group/member or unlinked member group')
    if v['category'] not in config['taxonomy']['categories'] or v['format'] not in config['taxonomy']['formats']:
        raise ValueError('Invalid category or format')
    return v


def read_config():
    return load_config()

def read_overrides():
    return json.loads((ROOT / 'config' / 'overrides.json').read_text(encoding='utf-8'))

def resolve(api, config):
    lookup = {}
    for c in config['channels']:
        if not c.get('collectionEnabled', True):
            continue
        if not approved_original(c):
            c.update(collectionEnabled=False, unavailableReason='source-not-approved')
            continue
        if c.get('platformId') and c.get('uploadsPlaylistId'):
            if c['platformId'] in lookup:raise RuntimeError('Duplicate resolved YouTube channel identity.')
            lookup[c['platformId']]=c
            continue
        response = api.get('channels', part='snippet,contentDetails', **({'id':c['platformId']} if c.get('platformId') else {'forHandle':c['handle']}))
        if not response.get('items'):
            c.update(collectionEnabled=False, unavailableReason='channel-not-found')
            print(f"Source unavailable: {c['id']}; retained archive is preserved.")
            continue
        raw = response['items'][0]
        c['observedChannelName'] = raw.get('snippet', {}).get('title', '')
        if not expected_channel(c, raw.get('snippet', {}).get('title', '')):
            c.update(collectionEnabled=False, unavailableReason='channel-name-needs-review')
            print(f"Source identity needs review: {c['id']}; observed name={json.dumps(c['observedChannelName'], ensure_ascii=True)}")
            continue
        if raw['id'] in lookup:
            raise RuntimeError(f"Duplicate resolved YouTube channel: {c['id']} and {lookup[raw['id']]['id']}. Register this source once.")
        c['platformId'] = raw['id']
        c['uploadsPlaylistId'] = raw['contentDetails']['relatedPlaylists']['uploads']
        lookup[c['platformId']] = c
    return lookup

def collect(api, pages=1):
    config, overrides = read_config(), read_overrides()
    previous_path=DATA/'catalog.json'
    if previous_path.exists():
        previous=json.loads(previous_path.read_text(encoding='utf-8'))
        old_sources={c['id']:c for c in previous.get('channels',[])}
        for c in config['channels']:
            old=old_sources.get(c['id'],{})
            same=(c.get('handle') and c.get('handle')==old.get('handle')) or (c.get('platformId') and c.get('platformId')==old.get('platformId'))
            valid_cache = bool(re.fullmatch(r'UC[\w-]{22}', old.get('platformId', ''))) and bool(re.fullmatch(r'UU[\w-]{22}', old.get('uploadsPlaylistId', '')))
            if same and valid_cache:
                for field in ('platformId','uploadsPlaylistId'):
                    if old.get(field) and not c.get(field):c[field]=old[field]
    lookup = resolve(api, config)
    ids = set()
    archive_path = DATA / 'external-backfill.json'
    archive_state = json.loads(archive_path.read_text(encoding='utf-8')) if archive_path.exists() else {}
    for c in config['channels']:
        if not c.get('collectionEnabled', True):
            continue
        try:
            ids.update(c.get('seedVideoIds', []))
            if c.get('archivePages') and not c['official']:
                from .external_archive import scan_uploads
                found, state = scan_uploads(api, c, archive_state.get(c['id']))
                ids.update(found)
                archive_state[c['id']] = state
            else:
                for item in api.pages('playlistItems', limit=c.get('collectionPages', pages), part='contentDetails', playlistId=c['uploadsPlaylistId'], maxResults=50):
                    ids.add(item['contentDetails']['videoId'])
        except YouTubeHTTPError as exc:
            # Query shape is fixed; 400/404 here identifies an inaccessible or
            # invalid uploads playlist. Global auth/quota errors remain fatal.
            if exc.status not in (400, 404):
                raise
            c.update(collectionEnabled=False, unavailableReason=f'uploads-http-{exc.status}')
            lookup.pop(c.get('platformId'), None)
            print(f"Source unavailable: {c['id']}; retained archive is preserved.")
    paused = []
    sources = {c['id']:c for c in config['channels']}
    supported = {g['id'] for g in config['groups']}
    for path in (DATA / 'content').glob('*.json'):
        old = json.loads(path.read_text(encoding='utf-8'))
        if old.get('platform') == 'youtube' and not re.fullmatch(r'[A-Za-z0-9_-]{11}', old.get('platformId', '')):
            continue
        if not old.get('demo'):
            source = sources.get(old['channelId'])
            if not source or not approved_original(source):
                continue
            if source and not source['collectionEnabled']:
                old['groupIds'] = [g for g in old['groupIds'] if g in supported]
                # Pausing collection retains the archive, never asserts a continuing live.
                old['liveStatus'] = 'none'
                if old['groupIds']:paused.append(old)
            else:
                ids.add(old['platformId'])
    official=[c for c in config['channels'] if c['official'] and c.get('collectionEnabled',True)]
    discovery=api.budget.discovery_sources(official) if api.budget else official
    checked=0
    for c in discovery:
        try:
            # Upcoming search was removed: SONAR has an upload calendar, not an event calendar.
            for item in api.pages('search', limit=1, part='snippet', channelId=c['platformId'], eventType='live', type='video', maxResults=50):
                ids.add(item['id']['videoId'])
            checked+=1
        except BudgetExceeded:
            print('Live discovery budget exhausted; remaining sources will be checked in a later run.')
            break
    if api.budget:api.budget.advance_discovery(checked,len(official))
    enabled = set(config.get('collectionGroupIds', [g['id'] for g in config['groups']]))
    matching_config = {**config, 'groups':[g for g in config['groups'] if g['id'] in enabled], 'members':[m for m in config['members'] if m['groupId'] in enabled]}
    records = paused
    seed_sources = {vid:c.get('platformId') for c in config['channels'] for vid in c.get('seedVideoIds', [])}
    # Refresh all retained metadata; removed/private videos disappear from the index.
    for raw in api.videos(ids):
        channel = lookup.get(raw['snippet']['channelId'])
        if raw['id'] in seed_sources and raw['snippet']['channelId'] != seed_sources[raw['id']]:
            continue
        if not channel or raw.get('status', {}).get('privacyStatus') != 'public':
            continue
        v = normalize(raw, channel, config, overrides['videos'].get(raw['id']))
        if v['groupIds']:
            records.append(v)
    publish(records, config, output=DATA)
    write(archive_path, archive_state)
    write(DATA / 'collection-report.json', {'updatedAt':now(), 'recordCount':len(records), 'externalRecordCount':sum('external' in v.get('contentTypes', []) or v.get('category')=='external' for v in records),
        'unavailableSources':[{'id':c['id'],'reason':c['unavailableReason'],'observedName':c.get('observedChannelName')} for c in config['channels'] if c.get('unavailableReason')]})
    print(f'Published {len(records)} records.')

def refresh_live(api):
    if not (DATA / 'catalog.json').exists():
        raise RuntimeError('Run full collection first.')
    catalog = json.loads((DATA / 'catalog.json').read_text(encoding='utf-8'))
    ids = json.loads((DATA / 'live-candidates.json').read_text(encoding='utf-8'))['ids']
    old_feed=json.loads((DATA/'live.json').read_text(encoding='utf-8'))
    if not ids and not old_feed.get('items'):
        print('No known live candidates; no YouTube calls or data changes.')
        return
    lookup = {c.get('platformId'): c for c in catalog['channels'] if c['official'] and c.get('platformId')}
    candidates = []
    overrides = read_overrides()
    for raw in api.videos(ids):
        channel = lookup.get(raw['snippet']['channelId'])
        if channel and raw.get('status', {}).get('privacyStatus') == 'public':
            candidates.append(normalize(raw, channel, catalog, overrides['videos'].get(raw['id'])))
    active=[v for v in candidates if v['liveStatus']=='live']
    if active or old_feed.get('items'):
        write(DATA / 'live.json', {'updatedAt': now(), 'items': active})
    write(DATA / 'live-candidates.json', {'ids': [v['platformId'] for v in candidates if v['liveStatus'] in ('live', 'upcoming')]})
    print(f'Refreshed {len(candidates)} known live/upcoming videos. New discovery happens in full collection.')

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--refresh-live', action='store_true')
    parser.add_argument('--pages', type=int, default=1, choices=range(1, 11))
    args = parser.parse_args()
    try:
        api = YouTube(os.environ.get('YOUTUBE_API_KEY'),budget=QuotaGuard(DATA/'collection-state.json'))
        refresh_live(api) if args.refresh_live else collect(api, args.pages)
    except (ValueError, RuntimeError) as exc:
        parser.exit(1, f'{exc}\n')

if __name__ == '__main__':
    main()
