"""Bounded per-tab previews and shared month indexes."""
import re
from datetime import datetime, timedelta, timezone
from .live_policy import is_continuous_live

LIMITS = {'home':24, 'music':12, 'broadcast':18, 'own':18, 'external':18, 'live':12, 'shorts':18}
DAYS = 30
KST = timezone(timedelta(hours=9))
SHORT_DURATION = re.compile(r'(?:pt)?(?:(\d+)h)?(?:(\d+)m)?(?:(\d+(?:\.\d+)?)s)?', re.I)


def stamp(item):
    try:
        value = datetime.fromisoformat(item['publishedAt'].replace('Z', '+00:00'))
        return value.replace(tzinfo=value.tzinfo or timezone.utc)
    except (KeyError, AttributeError, ValueError):
        return None


def tabs(item):
    if is_continuous_live(item):
        return ()
    if item.get('musicBroadcast'):
        return ('broadcast',)
    fmt, category = item.get('format'), item.get('category')
    duration = SHORT_DURATION.fullmatch(str(item.get('durationLabel','')))
    h,m,s = (float(value or 0) for value in duration.groups()) if duration else (0,0,0)
    if fmt == 'short' or category == 'shorts' or (fmt != 'live' and 0 < h*3600+m*60+s <= 60):
        return ('shorts',)
    types = set(item.get('contentTypes', [])) | {category}
    return tuple(tab for tab in LIMITS if tab == 'home' or tab in types or (tab == 'live' and fmt == 'live'))


def build_indexes(ordered, group_indexes, output, write, summary, discovery_groups, current):
    cutoff = current - timedelta(days=DAYS)
    by_tab = {tab:[] for tab in LIMITS}
    months = {}
    metadata = {}
    for video in ordered:
        date = stamp(video)
        if not date:
            continue
        item = summary(video)
        keys = tabs(item)
        metadata[item['id']] = (date,keys)
        months.setdefault(date.astimezone(KST).strftime('%Y-%m'),[]).append(item)
        if cutoff <= date <= current:
            for tab in keys:
                by_tab[tab].append(item)
    for tab, items in by_tab.items():
        counts, selected = {}, []
        cap = 3 if tab == 'shorts' else 4
        for item in items:
            groups = discovery_groups(item)
            if groups and all(counts.get(group,0)>=cap for group in groups):
                continue
            selected.append(item)
            for group in groups:
                counts[group] = counts.get(group,0)+1
            if len(selected) == 144:
                break
        write(output/'browse'/f'{tab}.json',{'items':selected})
    group_tabs = {}
    expected = set()
    for gid, items in group_indexes.items():
        previews = {tab:[] for tab in LIMITS}
        totals = {tab:0 for tab in LIMITS}
        for item in items:
            date,keys = metadata.get(item['id'],(None,()))
            for tab in keys:
                totals[tab] += 1
                rows = previews[tab]
                if len(rows)<6 and (len(rows)<3 or cutoff<=date<=current):
                    rows.append(item)
        group_tabs[gid] = {tab:totals[tab] for tab in LIMITS if totals[tab]}
        for tab, rows in previews.items():
            if rows:
                path = output/'browse'/'groups'/tab/f'{gid}.json'
                expected.add(path)
                write(path,{'items':rows})
    for month, items in months.items():
        path = output/'browse'/'months'/f'{month}.json'
        expected.add(path)
        write(path,{'items':items})
    for pattern in ('groups/*/*.json','months/*.json'):
        for path in (output/'browse').glob(pattern):
            if path not in expected:
                path.unlink()
    return {'days':DAYS,'limits':LIMITS,'months':sorted(months,reverse=True),'groupTabs':group_tabs}
