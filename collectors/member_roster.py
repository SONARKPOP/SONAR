"""Connect reviewed roster names to stable member records without guessing profiles."""
import argparse
import copy
import hashlib
from pathlib import Path
from urllib.parse import urlparse
from .completeness import normalized_name
from .registry import CONFIG, load_bundles, validate
from .publish import write


def reconcile(bundles):
    result = copy.deepcopy(bundles)
    used_ids = {member['id'] for group in result for member in group['members']}
    added, review, changed = [], [], []
    for group in result:
        original = copy.deepcopy(group)
        roster = group.get('memberRoster', {})
        for section in ('current', 'former'):
            source = roster.get('formerEvidenceUrl' if section == 'former' else 'evidenceUrl')
            parsed = urlparse(source or '')
            for name in roster.get(section, []):
                matches = [member for member in group['members'] if normalized_name(name) in
                           {normalized_name(value) for value in [member['name'], *member['aliases']]}]
                if len(matches) > 1 or parsed.scheme != 'https' or not parsed.hostname or parsed.username or parsed.password:
                    review.append({'groupId': group['id'], 'name': name,
                                   'reason': 'ambiguous-identity' if len(matches) > 1 else 'missing-source'})
                    continue
                if matches:
                    member = matches[0]
                else:
                    digest = hashlib.sha256(normalized_name(name).encode('utf-8')).hexdigest()[:12]
                    mid = group['id'] + '-member-' + digest
                    if mid in used_ids:
                        review.append({'groupId': group['id'], 'name': name, 'reason': 'id-conflict'})
                        continue
                    member = {'id': mid, 'groupId': group['id'], 'name': name, 'aliases': [name],
                              'taggingPolicy': 'explicit-group-context'}
                    used_ids.add(mid)
                    group['members'].append(member)
                    added.append({'groupId': group['id'], 'memberId': mid, 'name': name})
                evidence = {'groupId': group['id'],
                            'status': 'last-known' if section == 'current' and roster.get('lineup') == 'last' else section,
                            'sourceUrl': source, 'sourceCheckedAt': roster.get('formerCheckedAt' if section == 'former' else 'checkedAt'),
                            'startDate': None, 'endDate': None}
                history = member.setdefault('membershipHistory', [])
                if evidence not in history:
                    history.append(evidence)
        if group != original:
            changed.append(group['id'])
    return result, {'added': added, 'review': review, 'changedGroupIds': changed}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--config', type=Path, default=CONFIG)
    parser.add_argument('--apply', action='store_true')
    parser.add_argument('--report', type=Path)
    args = parser.parse_args()
    bundles, shared, taxonomy, _ = load_bundles(args.config)
    updated, report = reconcile(bundles)
    validate(updated, shared, taxonomy)
    if args.apply:
        for bundle in updated:
            if bundle['id'] in report['changedGroupIds']:
                write(args.config / 'groups' / (bundle['id'] + '.json'), bundle)
    if args.report:
        write(args.report, report)
    print({'applied': args.apply, 'addedMembers': len(report['added']),
           'changedGroups': len(report['changedGroupIds']), 'needsReview': len(report['review'])})


if __name__ == '__main__':
    main()
