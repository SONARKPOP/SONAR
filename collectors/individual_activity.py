"""Classify individual content from explicit, attributable evidence."""
import re
from datetime import datetime, timedelta, timezone

SOLO = re.compile(r'\bsolo\b|솔로|단독', re.I)
RELEASE = re.compile(r'\bofficial\s+(?:music\s+)?video\b|\bofficial\s+(?:audio|m/?v)\b|공식\s*뮤직비디오', re.I)
PERSONAL = re.compile(r'\bvlog\b|브이로그|\binterview\b|인터뷰', re.I)
AMBIGUOUS = re.compile(r'\b(?:cover|reaction|ost)\b|커버|리액션|떼창|단체', re.I)


def personal_title_kind(title, aliases, official):
    if AMBIGUOUS.search(title):
        return None
    named_first = any(re.match(r'^\s*[\[\(「〈#]?\s*' + re.escape(alias) + r'(?!\w)', title, re.I)
                      for alias in aliases)
    if official and named_first and RELEASE.search(title):
        return 'solo-music'
    if SOLO.search(title) or (named_first and PERSONAL.search(title)):
        return 'individual'
    return None


def classify_individual(video, channel, artists, members):
    if video.get('demo'):
        return None
    linked = set(video.get('groupIds', []))
    people = [members[mid] for mid in set(video.get('memberIds', [])) if mid in members]
    if len(people) > 1:
        return None
    owners = channel.get('groupIds', []) if channel.get('official') else []
    if len(owners) == 1:
        artist = artists.get(owners[0], {})
        parents = set(artist.get('relatedGroupIds', [])) | set(artist.get('previousGroupIds', []))
        if artist.get('artistType') == 'solo' and parents and linked <= parents | {owners[0]}:
            return {'artistId': owners[0], 'groupIds': sorted(parents), 'kind': 'individual',
                    'evidence': 'official-solo-channel'}
    if len(people) != 1:
        return None
    member = people[0]
    parent = member['groupId']
    if parent not in linked:
        return None
    profiles = [artists[gid] for gid in linked if gid in artists and
                member['id'] in artists[gid].get('relatedMemberIds', [])]
    related = {gid for profile in profiles for gid in
               [profile['id'], *profile.get('relatedGroupIds', []), *profile.get('previousGroupIds', [])]}
    if linked - related - {parent}:
        return None
    kind = personal_title_kind(video.get('title', ''), member.get('aliases', []), parent in owners)
    if kind:
        result = {'memberId': member['id'], 'groupIds': sorted({parent} | {
            gid for profile in profiles for gid in [*profile.get('relatedGroupIds', []), *profile.get('previousGroupIds', [])]
        }), 'kind': kind, 'evidence': 'explicit-title'}
        if len(profiles) == 1:
            result['artistId'] = profiles[0]['id']
        return result
    return None


def solo_review_candidates(videos, sources, artists):
    """Recommend new profiles only when archived videos provide concrete evidence."""
    registered = {mid for artist in artists.values() if artist.get('artistType') == 'solo'
                  for mid in artist.get('relatedMemberIds', [])}
    by_member, last_group = {}, {}
    now = datetime.now(timezone.utc)
    for video in videos:
        if video.get('demo'):
            continue
        try:
            date = datetime.fromisoformat(video['publishedAt'].replace('Z', '+00:00'))
        except (ValueError, TypeError, KeyError):
            continue
        if not date.tzinfo or date > now:
            continue
        activity = video.get('individualActivity')
        if activity:
            member = activity.get('memberId')
            if member and member not in registered:
                by_member.setdefault(member, []).append((date, video))
        elif sources.get(video['channelId'], {}).get('official'):
            for group in sources[video['channelId']]['groupIds']:
                last_group[group] = max(date, last_group.get(group, date))
    candidates = []
    for member, events in sorted(by_member.items()):
        events.sort(key=lambda event:event[0], reverse=True)
        latest, video = events[0]
        parents = video['individualActivity']['groupIds']
        release = next((v for _,v in events if v['individualActivity']['kind'] == 'solo-music'), None)
        uninterrupted = [event for event in events if all(event[0] > last_group.get(parent, datetime.min.replace(tzinfo=timezone.utc)) for parent in parents)]
        sustained = (len({date.date() for date,_ in uninterrupted}) >= 3 and
                     latest - uninterrupted[-1][0] >= timedelta(days=365))
        if release or sustained:
            evidence = [release] if release else [uninterrupted[0][1], uninterrupted[-1][1]]
            candidates.append({'memberId':member, 'groupIds':parents,
                               'reason':'official-solo-release' if release else 'individual-activity-over-one-year',
                               'evidenceUrls':['https://www.youtube.com/watch?v='+v['platformId'] for v in evidence]})
    return candidates
