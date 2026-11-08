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
from .source_policy import approved_original, public_artist_scope
from .individual_activity import personal_title_kind

class YouTubeHTTPError(RuntimeError):
    def __init__(self, resource, status):
        self.resource, self.status = resource, status
        super().__init__(f'YouTube {resource} returned HTTP {status}; check key restrictions, quota, and source configuration.')

def expected_channel(channel, title, custom_url=''):
    # A reviewed, pinned channel can have a generic display name (e.g.
    # "OFFICIAL") while its exact artist handle establishes its identity.
    handle=lambda value:value.strip().casefold().removeprefix('@')
    if channel.get('platformId') and custom_url and any(handle(custom_url)==handle(value) for value in channel.get('expectedHandles',[])):
        return True
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
    elif re.search(r'\bM/?V\b|music video|official video|live clip|special clip|live video|lyric video|official audio|performance|퍼포먼스', title, re.I):
        category, subtype = 'music', 'MV' if re.search(r'\bM/?V\b|music video', title, re.I) else '퍼포먼스'
    elif re.search(r'vlog|브이로그', title, re.I):
        subtype = '브이로그'
    short = bool(re.search(r'#shorts?\b', title + '\n' + description, re.I))
    return ('shorts' if short else category), subtype, short

def group_title_aliases(group):
    ambiguous = {alias.casefold() for alias in group.get('ambiguousAliases', [])}
    return [alias for alias in group['aliases'] if alias.casefold() not in ambiguous]


def has_collaboration_title(title, owner_aliases, guest_aliases):
    separator = r'(?:\s*×\s*|\s+[xX]\s+)'
    for owner in owner_aliases:
        for guest in guest_aliases:
            left, right = re.escape(owner), re.escape(guest)
            if re.search(r'(?<!\w)(?:'+left+separator+right+'|'+right+separator+left+r')(?!\w)', title, re.I):
                return True
    return False


ORIGINAL_ARTIST_CREDIT = re.compile(
    r'[\[(]\s*(?:원곡(?:자)?\s*[:：]|original(?:ly)?(?: performed)? by\b)\s*[^\])]*[\])]',
    re.I,
)


def normalize(raw, channel, config, override=None):
    snippet = raw['snippet']
    text = ORIGINAL_ARTIST_CREDIT.sub(' ', snippet['title'])
    groups = set(channel['groupIds'] if channel['official'] else [])
    owner_groups = set(groups)
    credit_lines = [line for line in snippet.get('description', '').splitlines()
                    if re.match(r'^\s*(?:\uCD9C\uC5F0(?:\uC9C4)?|\uAC8C\uC2A4\uD2B8|guests?|starring)\s*[:\uFF1A-]', line, re.I)]
    owner_aliases = [alias for g in config['groups'] if g['id'] in owner_groups for alias in group_title_aliases(g)]
    scoped_members, appearance_evidence = [], []
    for group in config['groups']:
        gid = group['id']
        if gid in owner_groups:
            continue
        related = owner_groups.intersection(group.get('relatedGroupIds', []))
        if group.get('ambiguousName') and not related:
            continue
        aliases = group_title_aliases(group)
        if any(alias_pattern(alias).search(line) for line in credit_lines for alias in aliases):
            groups.add(gid)
            appearance_evidence.append({'groupId':gid, 'source':'publisher-credit-line',
                'role':'participant', 'url':'https://www.youtube.com/watch?v=' + raw['id']})
        elif any(mentions(text, alias) for alias in aliases) and (
                not channel['official'] or (related and
                 (group.get('artistType') != 'solo' or personal_title_kind(text, aliases, True))) or
                (group.get('artistType') != 'solo' and has_collaboration_title(text, owner_aliases, aliases))):
            groups.add(gid)
    for artist in config['groups']:
        if artist['id'] in groups and artist.get('artistType') == 'solo':
            groups.update(artist.get('relatedGroupIds', []))
    if not channel['official']:
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
    members = infer_members({**snippet, 'title':text}, groups, config) if groups else []
    members = sorted(set(members + scoped_members))
    groups.update(m['groupId'] for m in config['members'] if m['id'] in members)
    for artist in config['groups']:
        tagged_members = set(artist.get('relatedMemberIds', [])).intersection(members)
        if artist.get('artistType') == 'solo' and tagged_members and len(members) == 1 and (
                personal_title_kind(text, artist['aliases'], bool(owner_groups)) or artist['id'] in groups):
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

def ambiguous_artist_links(config):
    return {g['id']: {g['id'], *g.get('relatedGroupIds', []), *g.get('previousGroupIds', [])}
            for g in config['groups'] if g.get('ambiguousAliases')}


def prune_stale_attribution(record, channel, config, override=None, ambiguous_links=None):
    """Remove unsupported automatic group tags from retained videos."""
    if override and 'groupIds' in override:
        keep = set(override['groupIds'])
        member_groups = {m['id']:m['groupId'] for m in config['members']}
        return {**record, 'groupIds':override['groupIds'],
                'memberIds':[mid for mid in override.get('memberIds', record['memberIds'])
                             if member_groups.get(mid) in keep]}
    groups = set(record['groupIds'])
    owners = set(channel['groupIds']) if channel['official'] else set()
    links = ambiguous_links if ambiguous_links is not None else ambiguous_artist_links(config)
    risky = set().union(*(links[gid] for gid in groups & links.keys() - owners))
    if (record.get('demo') or record.get('platform') != 'youtube' or not record.get('title') or
            not ((owners and groups - owners) or risky)):
        return record
    raw = {'id':record['platformId'], 'snippet':{
        'title':record['title'], 'description':record.get('description', ''),
        'publishedAt':record['publishedAt'], 'channelTitle':record.get('channelName', channel['name'])}}
    inferred = normalize(raw, channel, config)
    keep = groups.intersection(inferred['groupIds'])
    if not owners:
        keep |= groups - risky
    if keep == groups:
        return record
    member_groups = {m['id']:m['groupId'] for m in config['members']}
    cleaned = {**record, 'groupIds':sorted(keep),
               'memberIds':[mid for mid in record['memberIds'] if member_groups.get(mid) in keep]}
    if 'appearanceEvidence' in cleaned:
        cleaned['appearanceEvidence'] = [e for e in cleaned['appearanceEvidence']
                                         if e.get('groupId') in keep or member_groups.get(e.get('memberId')) in keep]
    return cleaned


def read_overrides():
    return json.loads((ROOT / 'config' / 'overrides.json').read_text(encoding='utf-8'))

def resolve(api, config, only=None):
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
        if only is not None and c['id'] not in only:
            continue
        response = api.get('channels', part='snippet,contentDetails', **({'id':c['platformId']} if c.get('platformId') else {'forHandle':c['handle']}))
        if not response.get('items'):
            c.update(collectionEnabled=False, unavailableReason='channel-not-found')
            print(f"Source unavailable: {c['id']}; retained archive is preserved.")
            continue
        raw = response['items'][0]
        c['observedChannelName'] = raw.get('snippet', {}).get('title', '')
        if not expected_channel(c, raw.get('snippet', {}).get('title', ''), raw.get('snippet', {}).get('customUrl', '')):
            c.update(collectionEnabled=False, unavailableReason='channel-name-needs-review')
            print(f"Source identity needs review: {c['id']}; observed name={json.dumps(c['observedChannelName'], ensure_ascii=True)}")
            continue
        if raw['id'] in lookup:
            raise RuntimeError(f"Duplicate resolved YouTube channel: {c['id']} and {lookup[raw['id']]['id']}. Register this source once.")
        c['platformId'] = raw['id']
        c['uploadsPlaylistId'] = raw['contentDetails']['relatedPlaylists']['uploads']
        lookup[c['platformId']] = c
    return lookup

def collect(api, pages=1, *, incremental=False):
    from .quota import metadata_read_reserve
    from .activity import RULES, stamp, iso
    from .upload_cadence import source_due_slot, source_identity
    attribution_config, overrides = read_config(), read_overrides()
    config = public_artist_scope(attribution_config)
    current = time.time()
    previous = {}
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
            if incremental and same and old.get('unavailableReason'):
                c.update(collectionEnabled=False, unavailableReason=old['unavailableReason'])
    groups = {g['id']:g for g in previous.get('groups', [])}
    activity_path = DATA/'channel-activity.json'
    activity = json.loads(activity_path.read_text(encoding='utf-8')) if activity_path.exists() else {}
    activity_cache = activity.get('channels', {})
    check_history = api.budget.state.get('uploadChecks', {}) if api.budget else {}
    deferred = set()
    due = {}
    boost = bool(api.budget and api.budget.read_boost and api.budget.remaining_daily('read') >= 500)
    for source in config['channels']:
        if not source.get('official') or not source.get('collectionEnabled', True):
            continue
        sid = source['id']
        last = max((value for upload in activity_cache.get(sid, {}).get('uploads', [])
                    if (value := stamp(upload.get('at'))) is not None and value <= current), default=None)
        slot = source_due_slot(source, groups, current, RULES, check_history.get(sid, {}), last, boost=boost)
        if api.budget and slot is None:
            deferred.add(sid)
        else:
            due[sid] = slot if slot is not None else current
    if incremental and not due:
        return
    supported = {g['id'] for g in config['groups']}
    sources = {c['id']:c for c in config['channels']}
    retained = [record for path in (DATA/'content').glob('youtube__*.json')
                if (record:=json.loads(path.read_text(encoding='utf-8')))['channelId'] in sources
                and supported.intersection(record['groupIds'])]
    retained_ids = {record['platformId'] for record in retained
                    if record['channelId'] not in deferred or record.get('liveStatus') in ('live','upcoming')}
    if incremental:
        retained_ids = {v['platformId'] for v in retained if v.get('liveStatus') in ('live', 'upcoming')}
    unresolved = sum(not c.get('uploadsPlaylistId') for c in config['channels']
                     if c.get('collectionEnabled', True) and (not incremental or c['id'] in due))
    if api.budget and api.budget.remaining('read') < metadata_read_reserve(retained_ids) + unresolved:
        if incremental:
            return
        from .targeted import collect_pending
        if collect_pending(api,config,overrides,DATA,previous,attribution_config=attribution_config):return
        raise BudgetExceeded('Insufficient read budget for a safe metadata refresh; collection deferred, existing data retained.')
    lookup = resolve(api, config, only=due) if incremental else resolve(api, config)
    ids = set()
    archived = {v['platformId'] for v in retained if not v.get('demo')}
    archive_path = DATA / 'external-backfill.json'
    archive_state = json.loads(archive_path.read_text(encoding='utf-8')) if archive_path.exists() else {}
    scan_channels=[c for c in config['channels'] if c.get('collectionEnabled',True)]
    scan_start=int(api.budget.state.get('uploadsCursor',0))%len(scan_channels) if api.budget and scan_channels else 0
    scan_channels=scan_channels[scan_start:]+scan_channels[:scan_start]
    if incremental:
        scan_channels = sorted((c for c in scan_channels if c['id'] in due),
                               key=lambda c: (stamp(check_history.get(c['id'], {}).get('checkedAt')) or 0, due[c['id']]))[:24]
    visited=0
    checked_uploads={}
    for c in scan_channels:
        if c['id'] in deferred:
            visited+=1
            continue
        requests = 1 if incremental else c.get('collectionPages',pages)+c.get('archivePages',0)
        if api.budget and api.budget.remaining('read') < requests+metadata_read_reserve(retained_ids,ids,requests*50):
            print('Playlist scanning paused to reserve metadata calls; remaining channels rotate into the next full run.')
            break
        visited+=1
        try:
            ids.update(set(c.get('seedVideoIds', [])) - (archived if incremental else set()))
            if c.get('archivePages') and not c['official']:
                from .external_archive import scan_uploads
                found, state = scan_uploads(api, c, archive_state.get(c['id']))
                ids.update(found)
                archive_state[c['id']] = state
            else:
                for item in api.pages('playlistItems', limit=1 if incremental else c.get('collectionPages', pages), part='contentDetails', playlistId=c['uploadsPlaylistId'], maxResults=50):
                    video_id = item['contentDetails']['videoId']
                    if not incremental or video_id not in archived:
                        ids.add(video_id)
            checked_uploads[c['id']]={'identity':source_identity(c),'checkedAt':iso(current)}
        except YouTubeHTTPError as exc:
            # Query shape is fixed; 400/404 here identifies an inaccessible or
            # invalid uploads playlist. Global auth/quota errors remain fatal.
            if exc.status not in (400, 404):
                raise
            c.update(collectionEnabled=False, unavailableReason=f'uploads-http-{exc.status}')
            lookup.pop(c.get('platformId'), None)
            print(f"Source unavailable: {c['id']}; retained archive is preserved.")
    if incremental and not ids:
        if api.budget and checked_uploads:
            api.budget.state.setdefault('uploadChecks', {}).update(checked_uploads)
            write(api.budget.path, api.budget.state)
        return
    paused = []
    cadence_retained = []
    sources = {c['id']:c for c in config['channels']}
    supported = {g['id'] for g in config['groups']}
    ambiguous_links = ambiguous_artist_links(attribution_config)
    for old in retained:
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
            elif (incremental or source['id'] in deferred) and old.get('liveStatus') not in ('live','upcoming'):
                cleaned=prune_stale_attribution(old,source,attribution_config,overrides['videos'].get(old['platformId']),ambiguous_links)
                if cleaned['groupIds']:cadence_retained.append(cleaned)
            else:
                ids.add(old['platformId'])
    # Any official source can still contribute live IDs via its uploads playlist.
    snapshots = activity.get('groups', {})
    active_groups = {gid for gid, snapshot in snapshots.items()
                     if snapshot.get('activity_status') in ('SURGE', 'SAILING')
                     and (stamp(snapshot.get('valid_until')) or 0) > current}
    official = [c for c in config['channels'] if c['official'] and c.get('collectionEnabled', True)
                and active_groups.intersection(c.get('groupIds', []))]
    discovery = [] if incremental else api.budget.discovery_sources(official) if api.budget else official
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
    if api.budget and not incremental:api.budget.advance_discovery(checked,len(official))
    enabled = set(config.get('collectionGroupIds', [g['id'] for g in config['groups']]))
    matching_config = {**config, 'groups':[g for g in config['groups'] if g['id'] in enabled], 'members':[m for m in config['members'] if m['groupId'] in enabled]}
    records = paused + [old for old in cadence_retained if old['platformId'] not in ids]
    seed_sources = {vid:c.get('platformId') for c in config['channels'] for vid in c.get('seedVideoIds', [])}
    # Refresh requested metadata. Channels waiting for their next upload check retain their archive.
    for raw in api.videos(ids):
        channel = lookup.get(raw['snippet']['channelId'])
        if raw['id'] in seed_sources and raw['snippet']['channelId'] != seed_sources[raw['id']]:
            continue
        if not channel or raw.get('status', {}).get('privacyStatus') != 'public':
            continue
        v = normalize(raw, channel, attribution_config, overrides['videos'].get(raw['id']))
        if supported.intersection(v['groupIds']):
            records.append(v)
    if incremental:
        # A newly seen ID can be private or unrelated; avoid rebuilding Pages
        # solely because an uploads playlist returned such a candidate.
        changed = any(v['platformId'] not in archived for v in records)
    else:
        changed = True
    if changed:
        publish(records, config, output=DATA)
    if api.budget and scan_channels:
        if not incremental:
            api.budget.state['uploadsCursor']=(scan_start+visited)%len(scan_channels)
        api.budget.state.setdefault('uploadChecks',{}).update(checked_uploads)
        write(api.budget.path,api.budget.state)
    if not changed:
        return
    if not incremental:
        write(archive_path, archive_state)
    write(DATA / 'collection-report.json', {'updatedAt':now(), 'recordCount':len(records), 'externalRecordCount':sum('external' in v.get('contentTypes', []) or v.get('category')=='external' for v in records),
        'checkedUploadSources':len(checked_uploads),'waitingForUploadCadence':len(deferred),
        'unavailableSources':[{'id':c['id'],'reason':c['unavailableReason'],'observedName':c.get('observedChannelName')} for c in config['channels'] if c.get('unavailableReason')]})
    print(f'Published {len(records)} records. Upload playlists checked: {len(checked_uploads)}; waiting for cadence: {len(deferred)}.')

def refresh_live(api):
    if not (DATA / 'catalog.json').exists():
        raise RuntimeError('Run full collection first.')
    catalog = public_artist_scope(json.loads((DATA / 'catalog.json').read_text(encoding='utf-8')))
    from .publish import live_candidate_index
    from .upload_cadence import stamp
    index = json.loads((DATA / 'live-candidates.json').read_text(encoding='utf-8'))
    old_feed = json.loads((DATA/'live.json').read_text(encoding='utf-8'))
    old_live = {video['platformId'] for key in ('items', 'stations') for video in old_feed.get(key, [])}
    horizon = time.time() + 3600
    waiting = {video_id: start for video_id, start in index.get('scheduledStarts', {}).items()
               if video_id in index['ids'] and video_id not in old_live and (stamp(start) or 0) > horizon}
    ids = (set(index['ids']) | old_live) - waiting.keys()
    if not ids:
        print('No known live candidates due; no YouTube calls or data changes.')
        return
    lookup = {c.get('platformId'): c for c in catalog['channels'] if c['official'] and c.get('platformId')}
    candidates = []
    overrides = read_overrides()
    from .source_policy import scope_video
    attribution_config = read_config()
    groups = {g['id'] for g in catalog['groups']}
    members = {m['id'] for m in catalog['members']}
    for raw in api.videos(ids):
        channel = lookup.get(raw['snippet']['channelId'])
        if channel and raw.get('status', {}).get('privacyStatus') == 'public':
            video = scope_video(normalize(raw, channel, attribution_config, overrides['videos'].get(raw['id'])), groups, members)
            if video['groupIds']:
                candidates.append(video)
    from .live_policy import is_continuous_live
    active=[v for v in candidates if v['liveStatus']=='live' and v.get('actualStartTime') and not v.get('actualEndTime')]
    feed = {'items': [v for v in active if not is_continuous_live(v)],
            'stations': [v for v in active if is_continuous_live(v)]}
    for key, videos in feed.items():
        videos.sort(key=lambda v: v['platformId'])
    def comparable(videos):
        return sorted(({k: value for k, value in v.items() if k != 'source'} for v in videos),
                      key=lambda v: v['platformId'])
    if any(comparable(videos) != comparable(old_feed.get(key, [])) for key, videos in feed.items()):
        write(DATA / 'live.json', {'updatedAt': now(), **feed})
    write(DATA / 'live-candidates.json', live_candidate_index(candidates, waiting))
    print(f'Refreshed {len(candidates)} known live/upcoming videos. New discovery happens in full collection.')

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument('--refresh-live', action='store_true')
    mode.add_argument('--refresh-uploads', action='store_true')
    parser.add_argument('--pages', type=int, default=1, choices=range(1, 11))
    args = parser.parse_args()
    try:
        api = YouTube(os.environ.get('YOUTUBE_API_KEY'),budget=QuotaGuard(DATA/'collection-state.json'))
        if args.refresh_live:
            refresh_live(api)
        elif args.refresh_uploads:
            collect(api, args.pages, incremental=True)
        else:
            # Keep known on-air streams fresh even if the large archive scan
            # must defer for quota. This is one batched read for usual feeds.
            if all((DATA/name).exists() for name in ('catalog.json','live.json','live-candidates.json')):
                refresh_live(api)
            collect(api, args.pages)
    except BudgetExceeded as exc:
        print(f'Collection deferred: {exc}')
        print('Existing published videos are retained; site-only updates may still deploy.')
    except (ValueError, RuntimeError) as exc:
        parser.exit(1, f'{exc}\n')

if __name__ == '__main__':
    main()
