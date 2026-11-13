"""Validate sourced optional member dates without filling unknown facts."""
import re
from datetime import date
from urllib.parse import urlparse


def validate_member_metadata(member):
    value = member.get('birthDate')
    precision = member.get('birthDatePrecision')
    if value is None:
        if precision is not None:
            raise ValueError('Unknown birth date cannot have a precision.')
        return
    patterns = {'year': r'\d{4}', 'month': r'\d{4}-\d{2}', 'day': r'\d{4}-\d{2}-\d{2}'}
    if precision not in patterns or not isinstance(value, str) or not re.fullmatch(patterns[precision], value):
        raise ValueError('Member birth date must match its stated precision.')
    try:
        date.fromisoformat(value + {'year': '-01-01', 'month': '-01', 'day': ''}[precision])
    except ValueError:
        raise ValueError('Invalid member birth date.') from None
    sources = member.get('profileSources', {})
    source = sources.get('birthDate') if isinstance(sources, dict) else None
    if not isinstance(source, dict):
        raise ValueError('Member birth date requires a field-specific source.')
    source_url = source.get('sourceUrl')
    if not isinstance(source_url, str):
        raise ValueError('Member birth date source requires a URL.')
    url = urlparse(source_url)
    if url.scheme != 'https' or not url.hostname or url.username or url.password:
        raise ValueError('Member birth date source must use public HTTPS.')
    try:
        date.fromisoformat(source['checkedAt'])
    except (KeyError, TypeError, ValueError):
        raise ValueError('Member birth date source requires its checked date.') from None
