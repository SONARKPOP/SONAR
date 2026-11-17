"""Conservative, date-aware career affiliations; display choices do not erase history."""
from datetime import date, datetime
from functools import lru_cache
import json
from pathlib import Path

@lru_cache(maxsize=1)
def load_display_policy():
    return json.loads((Path(__file__).resolve().parents[1] / 'config' / 'affiliation-display.json').read_text(encoding='utf-8'))

def affiliation_display_policy(group_id, policy=None):
    return {'visible': True, 'priority': 0, **(policy if policy is not None else load_display_policy()).get('groups', {}).get(group_id, {})}

def _date(value, end=False):
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    value = str(value or '')[:10]
    try:
        if len(value) == 4:
            return date(int(value), 12 if end else 1, 31 if end else 1)
        if len(value) == 7:
            import calendar
            year, month = map(int, value.split('-'))
            return date(year, month, calendar.monthrange(year, month)[1] if end else 1)
        return date.fromisoformat(value)
    except ValueError:
        return None

def career_group_ids(member, published_at, groups=None, policy=None):
    """Known current/former career IDs as of publication. Unknown starts use dated evidence.

    An evidence date establishes only that the career was known by that date.
    Partial start dates use their latest possible day so an affiliation cannot be
    projected backwards. End dates do not erase a person's former career.
    Display policy is deliberately separate from this historical relation.
    """
    published = _date(published_at)
    if published is None:
        return []
    result = []
    for relation in member.get('membershipHistory', member.get('memberships', [])):
        group_id = relation.get('groupId')
        start = _date(relation.get('startDate') or relation.get('joinedAt') or relation.get('asOf') or relation.get('sourceCheckedAt') or relation.get('checkedAt'), end=True)
        if group_id and start is not None and start <= published and group_id not in result:
            result.append(group_id)
    return result

def representative_career_group_ids(member, published_at, groups=None, policy=None):
    policy = policy if policy is not None else load_display_policy()
    person_policy = policy.get('people', {}).get(member.get('id'), {})
    selected = person_policy.get('representativeGroupIds')
    return [gid for gid in career_group_ids(member, published_at, groups, policy)
            if affiliation_display_policy(gid, policy)['visible'] and (selected is None or gid in selected)]
