"""Only reviewed original publishers may supply SONAR records."""
from datetime import date
from urllib.parse import urlparse

ORIGINAL_KINDS = {'broadcaster', 'production', 'program', 'brand', 'artist-label',
                  'creator', 'public-institution'}


def reviewed_dedicated_channel(channel, group_id):
    if (not channel.get('official') or channel.get('platform') != 'youtube'
            or channel.get('shared') or channel.get('groupIds') != [group_id]
            or channel.get('verificationStatus') not in ('VERIFIED', 'SUPPORTED')):
        return False
    evidence = channel.get('verification')
    if not isinstance(evidence, dict):
        return False
    try:
        url = urlparse(evidence['evidenceUrl'])
        date.fromisoformat(evidence['checkedAt'][:10])
        return url.scheme == 'https' and bool(url.hostname) and not url.username and not url.password
    except (KeyError, TypeError, ValueError, AttributeError):
        return False


def approved_original(channel):
    if channel.get('official') is True:
        return True
    review = channel.get('publisherReview', {})
    return (review.get('status') == 'approved'
            and review.get('kind') in ORIGINAL_KINDS
            and isinstance(review.get('evidenceUrl'), str)
            and review['evidenceUrl'].startswith('https://'))


def public_artist(artist):
    return artist.get('gender') != 'boy' or artist.get('artistType') == 'solo'


def public_artist_scope(config):
    """Keep female and mixed groups, including duos, and solo artists."""
    groups = [g for g in config['groups'] if public_artist(g)]
    group_ids = {g['id'] for g in groups}
    members = [m for m in config['members'] if m['groupId'] in group_ids]
    member_ids = {m['id'] for m in members}
    channels = []
    for source in config['channels']:
        owners = [gid for gid in source.get('groupIds', []) if gid in group_ids]
        if source.get('groupIds') and not owners:
            continue
        channel = {**source, 'groupIds':owners}
        if 'programs' in source:
            channel['programs'] = [
                {**program, 'cast':[cast for cast in program.get('cast', []) if cast['memberId'] in member_ids]}
                for program in source['programs']
            ]
        channels.append(channel)
    return {
        **config, 'groups':[
            {**group, **{field:[gid for gid in group[field] if gid in group_ids]
                         for field in ('previousGroupIds','relatedGroupIds') if field in group},
             **({'relatedMemberIds':[mid for mid in group['relatedMemberIds'] if mid in member_ids]}
                if 'relatedMemberIds' in group else {})}
            for group in groups
        ],
        'members':members, 'channels':channels,
        **{field:[gid for gid in config[field] if gid in group_ids]
           for field in ('defaultGroupIds','sampleGroupIds','collectionGroupIds') if field in config},
    }


def scope_video(record, groups, members):
    record = {**record, 'groupIds':[gid for gid in record['groupIds'] if gid in groups],
              'memberIds':[mid for mid in record.get('memberIds', []) if mid in members]}
    if 'appearanceEvidence' in record:
        record['appearanceEvidence'] = [
            evidence for evidence in record['appearanceEvidence']
            if evidence.get('groupId') in record['groupIds'] or evidence.get('memberId') in record['memberIds']
        ]
    return record
