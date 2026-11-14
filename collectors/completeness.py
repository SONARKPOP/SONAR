"""Reproducible registry audit. Reads local data without API calls or mutations."""
import argparse
import json
import unicodedata
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from .source_policy import public_artist, reviewed_dedicated_channel


def normalized_name(value):
    return unicodedata.normalize('NFKC', value).casefold().strip()


def audit(bundles, catalog=None, candidates=()):
    members = [member for group in bundles for member in group.get('members', [])]
    missing_roster = []
    missing_status = []
    missing_channel = []
    statuses = Counter()
    known_ids = {group['id'] for group in bundles}
    candidate_ids = {candidate['groupId'] for candidate in candidates if candidate['groupId'] in known_ids}
    registered, reviewed = set(), set()
    unresolved = set()
    reviewed_channels = 0
    for group in bundles:
        names = {normalized_name(name) for member in group.get('members', [])
                 for name in [member['name'], *member.get('aliases', [])]}
        roster = group.get('memberRoster', {})
        for section in ('current', 'former'):
            for name in roster.get(section, []):
                if normalized_name(name) not in names:
                    missing_roster.append({'groupId': group['id'], 'name': name,
                                           'section': section, 'evidenceUrl': roster.get(
                                               'formerEvidenceUrl' if section == 'former' else 'evidenceUrl')})
        channels = [channel for channel in group.get('channels', [])
                    if channel.get('official') and channel.get('platform') == 'youtube'
                    and not channel.get('shared') and channel.get('groupIds') == [group['id']]]
        if not channels:
            missing_channel.append(group['id'])
        else:
            registered.add(group['id'])
        if any(reviewed_dedicated_channel(channel,group['id']) for channel in channels):
            reviewed.add(group['id'])
        reviewed_channels += sum(reviewed_dedicated_channel(channel,group['id']) for channel in channels)
        if any(not reviewed_dedicated_channel(channel,group['id']) for channel in channels):
            unresolved.add(group['id'])
        for channel in channels:
            statuses[channel.get('verificationStatus') or 'MISSING'] += 1
            if not channel.get('verificationStatus'):
                missing_status.append({'groupId': group['id'], 'channelId': channel['id']})
    public = [group for group in bundles if group.get('supported') and public_artist(group)]
    expected_groups = {group['id'] for group in public}
    expected_members = {member['id'] for group in public for member in group.get('members', [])}
    actual_groups = {group['id'] for group in (catalog or {}).get('groups', [])}
    actual_members = {member['id'] for member in (catalog or {}).get('members', [])}
    return {
        'generatedAt': datetime.now(timezone.utc).isoformat(),
        'counts': {'profiles': len(bundles), 'members': len(members),
                   'groupProfiles':sum(group.get('artistType','group')!='solo' for group in bundles),
                   'soloProfiles':sum(group.get('artistType')=='solo' for group in bundles),
                   'withRegisteredDedicatedChannel':len(registered),
                   'withReviewedDedicatedChannel':len(reviewed),
                   'registeredDedicatedChannels':sum(statuses.values()),
                   'reviewedDedicatedChannels':reviewed_channels,
                   'unreviewedDedicatedChannels':sum(statuses.values())-reviewed_channels,
                   'partiallyReviewedProfiles':len(unresolved&reviewed),
                   'channelReviewRequired':len(registered-reviewed),
                   'candidateOnlyProfiles':len(candidate_ids-registered),
                   'withoutChannelOrCandidate':sum(group['id'] not in registered|candidate_ids for group in bundles),
                   'withRoster': sum(bool(group.get('memberRoster')) for group in bundles),
                   'withMembers': sum(bool(group.get('members')) for group in bundles),
                   'withBirthDate': sum(bool(member.get('birthDate')) for member in members),
                   'withDebutDate': sum(bool(group.get('debutDate')) for group in bundles),
                   'unlinkedRosterEntries': len(missing_roster)},
        'channelVerification': dict(sorted(statuses.items())),
        'publicCounts':{'profiles':len(public),'members':len(expected_members),
                        'withReviewedDedicatedChannel':len(reviewed&expected_groups),
                        'channelReviewRequired':len((registered-reviewed)&expected_groups),
                        'partiallyReviewedProfiles':len(unresolved&reviewed&expected_groups),
                        'candidateOnlyProfiles':len((candidate_ids-registered)&expected_groups),
                        'withoutChannelOrCandidate':len(expected_groups-registered-candidate_ids)},
        'unlinkedRoster': missing_roster,
        'missingVerificationStatus': missing_status,
        'withoutDedicatedChannel': missing_channel,
        'missingBirthDates':[{'memberId':member['id'],'groupId':group['id'],'name':member['name']}
                             for group in bundles for member in group.get('members',[]) if not member.get('birthDate')],
        'missingExactDebutDate':[group['id'] for group in bundles if not group.get('debutDate')],
        'missingMemberRoster':[group['id'] for group in bundles
                               if group.get('artistType','group')!='solo' and not group.get('memberRoster')],
        'catalogMismatch': None if catalog is None else {
            'missingGroupIds': sorted(expected_groups - actual_groups),
            'extraGroupIds': sorted(actual_groups - expected_groups),
            'missingMemberIds': sorted(expected_members - actual_members),
            'extraMemberIds': sorted(actual_members - expected_members)},
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    root = Path(__file__).resolve().parents[1]
    parser.add_argument('--config', type=Path, default=root / 'config')
    parser.add_argument('--catalog', type=Path, default=root / 'public/data/catalog.json')
    parser.add_argument('--output', type=Path)
    parser.add_argument('--candidates', type=Path, default=root / 'public/data/channel-candidates.json')
    args = parser.parse_args()
    bundles = [json.loads(path.read_text(encoding='utf-8'))
               for path in sorted((args.config / 'groups').glob('*.json'))]
    catalog = json.loads(args.catalog.read_text(encoding='utf-8')) if args.catalog.exists() else None
    candidates = json.loads(args.candidates.read_text(encoding='utf-8')).get('candidates',[]) if args.candidates.exists() else []
    report = audit(bundles, catalog, candidates)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'counts': report['counts'], 'publicCounts':report['publicCounts'],'channelVerification': report['channelVerification'],
                      'catalogMismatch': report['catalogMismatch']}, ensure_ascii=True))


if __name__ == '__main__':
    main()
