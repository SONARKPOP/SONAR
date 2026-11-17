"""Deterministic dedicated-channel approval from observed identity, never URLs alone."""
import re
import hashlib
import unicodedata
from datetime import date
from urllib.parse import unquote, urlparse


def normalized(value):
    return ''.join(c for c in unicodedata.normalize('NFKC', value or '').casefold() if c.isalnum())


def artist_names(group):
    return {normalized(v) for v in [group.get('name'), group.get('nameKo'), group.get('nameEn'),
            *group.get('aliases', [])] if v and v not in group.get('ambiguousAliases', [])}


def https_url(value):
    try:
        p = urlparse(value or '')
        return p.scheme == 'https' and bool(p.hostname) and not p.username and not p.password
    except ValueError:
        return False


def observed_handle(observed):
    value = observed.get('handle') or observed.get('handleUrl') or ''
    if value.startswith(('https://', 'http://')):
        p = urlparse(value)
        value = unquote(p.path).strip('/') if p.hostname in ('youtube.com', 'www.youtube.com') else ''
    return value if re.fullmatch(r'@[^/\s?#]+', value) else None


def evaluate_channel(group, observed, groups=(), sources=(), ownership=None):
    """Ownership must describe an inspected primary page and its actual target UC ID.

    A bare evidence URL, a description claim, or a database link is insufficient.
    Exact title + handle agreement is a separate sufficient path, with collisions blocked.
    """
    cid = observed.get('channelId') or observed.get('id')
    handle = observed_handle(observed)
    result = {'decision': 'review', 'channelId': cid, 'observedName': observed.get('name'),
              'handle': handle, 'checkedAt': observed.get('checkedAt'),
              'evidenceUrl': observed.get('channelUrl') or ('https://www.youtube.com/channel/' + cid if cid else None)}
    def stop(reason):
        return {**result, 'reason': reason}
    if not re.fullmatch(r'UC[\w-]{22}', cid or '') or not observed.get('name'):
        return stop('missing-observed-channel-identity')
    if handle and not re.fullmatch(r'@[\w.-]{3,30}', handle):
        return stop('unsupported-observed-handle')
    try:
        date.fromisoformat(observed['checkedAt'][:10])
    except (KeyError, TypeError, ValueError):
        return stop('missing-observation-date')
    text = observed['name'] + ' ' + observed.get('description', '') + ' ' + (handle or '')
    if re.search(r'\bfan\b|fan(?:channel|archive|site|page)|unofficial|reuploads?|비공식|팬.?채널|팬.?페이지|팬.?사이트|팬튜브|\btopic\b|주제(?:\s|$)', text, re.I):
        return stop('fan-reupload-or-topic')
    if observed.get('shared') or re.search(r'\bcompany\b|\bentertainment\b|엔터테인먼트|vevo(?:\s|$)', observed['name'], re.I):
        return stop('shared-agency-or-distributor')
    for source in sources:
        same_cid = source.get('platformId') == cid
        same_handle = handle and str(source.get('handle', '')).casefold() == handle.casefold()
        if same_handle and source.get('platformId') and not same_cid:
            return stop('existing-handle-channel-id-conflict')
        if same_handle and (source.get('shared') or source.get('groupIds') != [group['id']] or not source.get('official')):
            return stop('handle-owned-by-another-source')
        if same_cid and (source.get('shared') or source.get('groupIds') != [group['id']] or not source.get('official')):
            return stop('channel-owned-by-another-source')
        if source.get('official') and source.get('platform') == 'youtube' and source.get('groupIds') == [group['id']] and source.get('platformId') and not same_cid:
            return stop('existing-artist-channel-id-conflict')
    names = artist_names(group)
    title = normalized(re.sub(r'\s+official(?:\s+(?:youtube|channel))?\s*$', '', observed['name'], flags=re.I))
    hname = normalized((handle or '').lstrip('@'))
    # Conventional official suffixes are allowed only after an exact artist stem.
    exact = title in names and any(hname == n or hname == n + 'official' for n in names)
    collision = any(g.get('id') != group['id'] and names & artist_names(g) for g in groups)
    ownership = ownership or {}
    primary = (ownership.get('kind') in ('artist-site', 'agency-site')
               and ownership.get('groupId') == group['id'] and ownership.get('channelId') == cid
               and ownership.get('dedicated') is True and https_url(ownership.get('evidenceUrl'))
               and ownership.get('checkedAt') == observed.get('checkedAt', '')[:10])
    if primary:
        return {**result, 'decision': 'approve', 'reason': 'official-owned-link',
                'evidenceUrl': ownership['evidenceUrl'], 'verificationStatus': 'VERIFIED'}
    if collision:
        return stop('artist-name-collision')
    if exact:
        return {**result, 'decision': 'approve', 'reason': 'exact-name-and-handle', 'verificationStatus': 'SUPPORTED'}
    return stop('identity-needs-review')


def register_channel(group, observed, groups=(), sources=(), ownership=None, collection_enabled=False):
    """Mutate only an approved dedicated source; preserve stable IDs and prior handles."""
    decision = evaluate_channel(group, observed, groups, sources, ownership)
    if decision['decision'] != 'approve':
        candidate = {**decision, 'groupId': group['id'], 'channelUrl': decision['evidenceUrl'], 'verificationStatus': 'UNVERIFIED'}
        queue = group.setdefault('youtubeCandidates', [])
        queue[:] = [c for c in queue if not ((c.get('channelId') == decision['channelId'] and c.get('channelId')) or
                    (candidate.get('channelUrl') and c.get('channelUrl') == candidate['channelUrl']))]
        queue.append(candidate)
        return decision
    cid = decision['channelId']
    source = next((s for s in group['channels'] if s.get('platformId') == cid or
                   (decision['handle'] and str(s.get('handle', '')).casefold() == decision['handle'].casefold())), None)
    if source is None:
        source = {'id': group['id'] + '-youtube-' + hashlib.sha256(cid.encode()).hexdigest()[:12], 'platform': 'youtube', 'official': True,
                  'groupIds': [group['id']], 'collectionEnabled': collection_enabled}
        group['channels'].append(source)
    if decision['handle']:
        old = source.get('handle')
        if old and old.casefold() != decision['handle'].casefold():
            source['historicalUrls'] = list(dict.fromkeys([*source.get('historicalUrls', []), 'https://www.youtube.com/' + old]))
        source['handle'] = decision['handle']
    previous_verification = source.get('verification', {})
    evidence_urls = list(dict.fromkeys([*previous_verification.get('sources', []),
        *([previous_verification['evidenceUrl']] if previous_verification.get('evidenceUrl') else []), decision['evidenceUrl']]))
    source.update(platformId=cid, name=decision['observedName'], expectedChannelNames=[decision['observedName']],
                  verificationStatus=decision['verificationStatus'], verification={
                      **previous_verification, 'sources': evidence_urls,
                      'checkedAt': decision['checkedAt'][:10], 'evidenceUrl': decision['evidenceUrl'],
                      'basis': decision['reason'], 'observedName': decision['observedName'], 'observedHandle': decision['handle']})
    group['youtubeCandidates'] = [c for c in group.get('youtubeCandidates', []) if c.get('channelId') != cid]
    return {**decision, 'sourceId': source['id']}
