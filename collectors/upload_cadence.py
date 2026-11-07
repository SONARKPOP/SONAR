"""Playlist check intervals based on the last confirmed official upload."""
from calendar import monthrange
from datetime import datetime, timezone


def stamp(value):
    try:
        if not isinstance(value,str):return None
        date=datetime.fromisoformat(value.replace('Z','+00:00'))
        return date.timestamp() if date.tzinfo else None
    except (ValueError,TypeError,OverflowError):return None


def months_after(timestamp, months):
    date = datetime.fromtimestamp(timestamp, timezone.utc)
    year, month = divmod(date.year * 12 + date.month - 1 + months, 12)
    month += 1
    return date.replace(year=year, month=month, day=min(date.day, monthrange(year, month)[1])).timestamp()


def upload_interval_hours(last, current, rules):
    intervals = rules['uploadCadenceHours']
    if last is None:
        return intervals['recent']
    for months, band in ((24, 'legacy'), (6, 'dormant'), (1, 'intermittent')):
        if current >= months_after(last, months):
            return intervals[band]
    return intervals['recent']


def source_interval_hours(source, groups, current, rules, channel_last=None):
    if not source.get('official'):
        return rules['uploadCadenceHours']['recent']
    dates = [channel_last]
    for gid in source.get('groupIds', []):
        group = groups.get(gid, {})
        dates.extend((stamp(group.get('lastOfficialUploadAt')),
                      stamp((group.get('youtubeActivity') or {}).get('last_upload_at'))))
    latest = max((value for value in dates if value is not None and value <= current), default=None)
    return upload_interval_hours(latest, current, rules)


def source_identity(source):
    return source.get('handle') or source.get('platformId')
