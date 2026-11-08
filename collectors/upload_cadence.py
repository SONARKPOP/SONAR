"""Playlist check intervals based on the last confirmed official upload."""
from datetime import datetime
from hashlib import sha256

DAY = 86400
KST_OFFSET = 9 * 3600
SLOT = 5 * 60


def stamp(value):
    try:
        if not isinstance(value,str):return None
        date=datetime.fromisoformat(value.replace('Z','+00:00'))
        return date.timestamp() if date.tzinfo else None
    except (ValueError,TypeError,OverflowError):return None


def upload_band(last, current, rules):
    age = (current - last) / DAY if last is not None else 15
    return next(band for band in rules['uploadCadence'] if age < band.get('beforeDays', float('inf')))


def upload_interval_hours(last, current, rules):
    band = upload_band(last, current, rules)
    # Activity snapshots are refreshed by maintenance. Use the longest gap
    # between daily slots, plus the spread on either side.
    slots = band.get('kstMinutes')
    if not slots:
        return band['days'] * 24
    minutes = sorted(slots)
    following = minutes[1:] + [minutes[0] + 1440]
    return (max(b - a for a, b in zip(minutes, following)) + 30) / 60


def source_last_upload(source, groups, current, channel_last=None):
    dates = [channel_last]
    for gid in source.get('groupIds', []):
        group = groups.get(gid, {})
        dates.extend((stamp(group.get('lastOfficialUploadAt')),
                      stamp((group.get('youtubeActivity') or {}).get('last_upload_at'))))
    return max((value for value in dates if value is not None and value <= current), default=None)


def source_interval_hours(source, groups, current, rules, channel_last=None):
    return upload_interval_hours(source_last_upload(source, groups, current, channel_last), current, rules)


def scheduled_slot(source_id, band, current, *, extra_minutes=()):
    """Return the latest due slot, with one deterministic phase per source."""
    phase = int.from_bytes(sha256(source_id.encode()).digest()[:8], 'big')
    local_now = current + KST_OFFSET
    local_midnight = local_now // DAY * DAY
    if 'kstMinutes' in band:
        times = [minute * 60 + (phase % 7 - 3) * SLOT for minute in band['kstMinutes']]
        times.extend(minute * 60 + (phase % 3 - 1) * SLOT for minute in extra_minutes)
        due = max(local_midnight + offset + ((local_now - local_midnight - offset) // DAY) * DAY
                  for offset in times)
    else:
        period = band['days'] * DAY
        # Spread across every five-minute slot in the interval.
        offset = (phase % (period // SLOT)) * SLOT
        due = offset + (local_now - offset) // period * period
    return due - KST_OFFSET


def source_due_slot(source, groups, current, rules, previous_check, channel_last=None, *, boost=False):
    last = source_last_upload(source, groups, current, channel_last)
    band = upload_band(last, current, rules)
    if last is None:
        band = {'kstMinutes': [10]}
    extra = ()
    if boost and last is not None and current - last < 7 * DAY:
        statuses = {(groups.get(gid, {}).get('youtubeActivity') or {}).get('activity_status')
                    for gid in source.get('groupIds', [])}
        for status in ('SURGE', 'SAILING', 'COASTING'):
            if status in statuses:
                extra = rules['eveningBoostKstMinutes'][status]
                break
    slot = scheduled_slot(source['id'], band, current, extra_minutes=extra)
    checked_at = stamp(previous_check.get('checkedAt'))
    if checked_at is None or previous_check.get('identity') != source_identity(source):
        return slot
    if checked_at < slot:
        return slot
    return None


def source_identity(source):
    return source.get('handle') or source.get('platformId')
