"""Resolve sourced person observations to stable IDs without destructive merging."""
from .channel_registration import normalized, https_url


def values(person, fields):
    result = set()
    for field in fields:
        value = person.get(field, [])
        if isinstance(value, str): value = [value]
        for item in value or []:
            name = item.get('name') if isinstance(item, dict) else item
            if isinstance(name, str) and normalized(name): result.add(normalized(name))
    return result


def stage_names(person):
    explicit = values(person, ('name', 'stageName', 'formerNames', 'formerStageNames'))
    legal = values(person, ('legalName', 'birthName', 'legalNameHistory'))
    return explicit | (values(person, ('aliases',)) - legal)


def canonical_sources(person):
    sources = set()
    # Shared roster, birthdate and agency pages are not canonical person IDs.
    for field in ('canonicalSourceUrl',):
        if https_url(person.get(field)): sources.add(person[field])
    return sources


def memberships(person):
    return {item['groupId'] for item in person.get('membershipHistory', []) if item.get('groupId')} | ({person['groupId']} if person.get('groupId') else set())


def resolve_person(observed, members):
    """Return a match/review/new decision; caller retains every existing member ID.

    A legal-name overlap is evidence for review only. Renames need a shared canonical
    person source or stage-name history with membership context; known contradictory
    dates or unconnected legal names always require review.
    """
    stage = stage_names(observed)
    legal = values(observed, ('legalName', 'birthName', 'legalNameHistory'))
    found, conflicts = [], []
    for member in members:
        stage_overlap = bool(stage & stage_names(member))
        legal_overlap = bool(legal & values(member, ('legalName', 'birthName', 'legalNameHistory')))
        same_source = bool(canonical_sources(observed) & canonical_sources(member))
        same_id = observed.get('id') == member.get('id') and bool(observed.get('id'))
        if not (stage_overlap or legal_overlap or same_source or same_id): continue
        a, b = observed.get('birthDate'), member.get('birthDate')
        if a and b and a[:min(len(a), len(b))] != b[:min(len(a), len(b))]:
            conflicts.append(member['id']); continue
        other_legal = values(member, ('legalName', 'birthName', 'legalNameHistory'))
        if legal and other_legal and not legal_overlap:
            conflicts.append(member['id']); continue
        if same_id or same_source or (stage_overlap and memberships(observed) & memberships(member)):
            found.append(member['id'])
        else:
            conflicts.append(member['id'])
    if conflicts or len(found) > 1:
        return {'decision': 'review', 'reason': 'conflicting-or-ambiguous-person-identity', 'memberIds': sorted(set(found + conflicts))}
    if found:
        return {'decision': 'match', 'memberId': found[0], 'reason': 'stage-history-or-sourced-person-identity'}
    return {'decision': 'new', 'reason': 'no-existing-person-match'}
