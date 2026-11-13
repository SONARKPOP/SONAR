"""Reproducible registry audit. Reads local data without API calls or mutations."""
import argparse
import json
import unicodedata
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from .source_policy import public_artist


def normalized_name(value):
    return unicodedata.normalize('NFKC', value).casefold().strip()


def audit(bundles, catalog=None):
    members = [member for group in bundles for member in group.get('members', [])]
    missing_roster = []
    missing_status = []
    missing_channel = []
    statuses = Counter()
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
                   'withRoster': sum(bool(group.get('memberRoster')) for group in bundles),
                   'withMembers': sum(bool(group.get('members')) for group in bundles),
                   'withBirthDate': sum(bool(member.get('birthDate')) for member in members),
                   'withDebutDate': sum(bool(group.get('debutDate')) for group in bundles),
                   'unlinkedRosterEntries': len(missing_roster)},
        'channelVerification': dict(sorted(statuses.items())),
        'unlinkedRoster': missing_roster,
        'missingVerificationStatus': missing_status,
        'withoutDedicatedChannel': missing_channel,
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
    args = parser.parse_args()
    bundles = [json.loads(path.read_text(encoding='utf-8'))
               for path in sorted((args.config / 'groups').glob('*.json'))]
    catalog = json.loads(args.catalog.read_text(encoding='utf-8')) if args.catalog.exists() else None
    report = audit(bundles, catalog)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'counts': report['counts'], 'channelVerification': report['channelVerification'],
                      'catalogMismatch': report['catalogMismatch']}, ensure_ascii=True))


if __name__ == '__main__':
    main()
