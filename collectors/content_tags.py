"""Broad, non-exclusive content tags. No appearance or whole-group inference."""
import re
from .broadcast import broadcast_context, broadcast_excluded

OWN_LABELS={'behind':'비하인드','daily':'일상·브이로그','variety':'자체 예능','practice':'연습·퍼포먼스','other':'기타·미분류'}
EXTERNAL_LABELS={'song':'노래·퍼포먼스','radio':'라디오','variety':'예능','interview':'인터뷰','ad':'광고·홍보','other':'기타·미분류'}

def broad_kind(text, own):
    rules = [('behind',r'behind|비하인드|making|메이킹'),('daily',r'vlog|브이로그|일상|휴가'),
             ('practice',r'practice|연습|퍼포먼스|performance'),('variety',r'예능|게임|챌린지|challenge')] if own else [
             ('radio',r'라디오|radio'),('ad',r'광고|홍보|commercial|campaign|\bCF\b'),
             ('interview',r'인터뷰|interview'),('variety',r'예능|variety'),
             ('song',r'퍼포먼스|커버|performance|cover|리무진서비스|릴레이댄스')]
    return next((kind for kind,pattern in rules if re.search(pattern,text,re.I)),'other')


TEASER = re.compile(r'\b(?:teaser|trailer|preview|coming soon|concept film|mood film|highlight medley)\b|\ud2f0\uc800|\ud2b8\ub808\uc77c\ub7ec|\ubc1c\ub9e4\s*\uc608\uace0|\ucef4\ubc31\s*\uc608\uace0|\ud558\uc774\ub77c\uc774\ud2b8\s*\uba54\ub4e4\ub9ac', re.I)
RADIO = re.compile(r'\ubc30\uc131\uc7ac\uc758\s*\ud150|\ucf54\ube68\uac04\ubc30\ucd98\uae30|Mhz\s*\ubbc0\ud750\uc988|(?:SBS|MBC|KBS|Arirang)\s*(?:FM|RADIO|\ub77c\ub514\uc624)|\ub77c\ub514\uc624\s*(?:\ub77c\uc774\ube0c|\ubc29\uc1a1|\ucd9c\uc5f0)', re.I)
CAM = re.compile(r'\uc9c1\ucea0|fancam|K-?Choreo|\uc5bc\ube61\ucea0|\ud480\ucea0|face\s*cam|full\s*cam|\uc548\ubc291\uc5f4|\ud56d\uacf5\ucea0|\uc2a4\uce74\uc774\ucea0', re.I)
SEGMENT = re.compile(r'\uc778\ud130\ubdf0|interview|\uc575\ucf5c|\uc559\ucf54\ub974|encore|1\uc704\s*\uc18c\uac10', re.I)
SINGING = re.compile(r'\b(?:cover|vocal\s+live|live\s+(?:cover|vocals?|clip|performance|session))\b|\ub77c\uc774\ube0c\s*(?:\uac00\ucc3d|\ucee4\ubc84|\ud074\ub9bd)|\uac00\ucc3d|\ubcf4\uceec\s*\ub77c\uc774\ube0c|\ucee4\ubc84|\ub9ac\ubb34\uc9c4\s*\uc11c\ube44\uc2a4|leemujin\s*service', re.I)
FULL = re.compile(r'\bofficial\s+(?:m/?v|music video|performance)\b|\bfull\s+(?:version|episode)\b|\ubcf8\ud3b8|\ud480\ubc84\uc804', re.I)
DURATION = re.compile(r'(?:pt)?(?:(\d+)h)?(?:(\d+)m)?(?:(\d+(?:\.\d+)?)s)?', re.I)


def content_tabs(video, official):
    title = video.get('title', '')
    description = video.get('description', '').splitlines()[:2]
    program = video.get('programName') or ''
    context = ' '.join((title, program, *description))
    fmt = video.get('format')
    duration = DURATION.fullmatch(str(video.get('durationLabel', '')))
    h, m, sec = (float(n or 0) for n in duration.groups()) if duration else (0, 0, 0)
    short = fmt == 'short' or video.get('category') == 'shorts'
    clip = not short and fmt != 'live' and 0 < h * 3600 + m * 60 + sec <= 60
    if video.get('externalType') == 'radio' or RADIO.search(' '.join((title, program, video.get('channelName') or ''))):
        return ['radio']
    if TEASER.search(title) or (not FULL.search(title) and any(TEASER.match(line.strip()) for line in description)):
        return ['teaser', 'shorts'] if short else ['teaser']
    show = broadcast_context(video)
    if show and (short or clip) and (not broadcast_excluded(video) or CAM.search(title) or SEGMENT.search(title)):
        return ['broadcast', 'shorts']
    if show and CAM.search(title) and not SEGMENT.search(title) and not broadcast_excluded(video):
        return ['broadcast']
    if show and SEGMENT.search(title):
        return ['broadcast', 'external']
    if show and not broadcast_excluded(video):
        return ['home', 'broadcast']
    if short or clip:
        return ['shorts']
    if SINGING.search(context) or (video.get('externalType') == 'song' and re.search(r'\blive\b|\ub77c\uc774\ube0c|\uac00\ucc3d', context, re.I)):
        return ['home', 'music', 'own'] if official else ['broadcast', 'external']
    if video.get('category') == 'music':
        return ['home', 'music']
    tabs = ['home', *video.get('contentTypes', ['own' if official else 'external'])]
    if fmt == 'live':
        tabs.append('live')
    return tabs

def apply_tags(record, official):
    v={**record}
    if v.get('platform') == 'youtube' and v.get('platformId'):
        v['externalId'] = v['platformId']
        v['sourceUrl'] = 'https://www.youtube.com/watch?v=' + v['platformId']
    types=v.get('contentTypes')
    if types is None:
        types=['own' if official else 'external']
    if not isinstance(types,list) or not types or set(types)-{'own','external'}:
        raise ValueError('contentTypes must contain own and/or external')
    v['contentTypes']=list(dict.fromkeys(types))
    text=' '.join([v.get('title',''),*v.get('subtypes',[]),*v.get('tags',[])])
    labels=[]
    for content_type in types:
        own=content_type=='own'
        field='ownType' if own else 'externalType'
        allowed=OWN_LABELS if own else EXTERNAL_LABELS
        kind=v.get(field) or broad_kind(text,own)
        if kind not in allowed:
            raise ValueError(f'Invalid {field}')
        v[field]=kind
        labels.extend(['자체 콘텐츠' if own else '외부 콘텐츠',allowed[kind]])
    if v.get('format')=='live':
        v['subtypes']=['라이브' if t=='기타' else t for t in v.get('subtypes',[])] or ['라이브']
        v['tags']=['라이브' if t=='기타' else t for t in v.get('tags',[])]
        labels.append('라이브')
    if v.get('format')=='short':
        v['subtypes']=['쇼츠' if t=='기타' else t for t in v.get('subtypes',[])] or ['쇼츠']
        v['tags']=['쇼츠' if t=='기타' else t for t in v.get('tags',[])]
        labels.append('쇼츠')
    v['contentTabs']=content_tabs(v, official)
    v['musicBroadcast']='broadcast' in v['contentTabs']
    if v['musicBroadcast']:
        labels.append('음악방송')
    else:
        v['tags']=[tag for tag in v.get('tags',[]) if tag!='음악방송']
    for key, label in (('radio','라디오'), ('teaser','티저')):
        if key in v['contentTabs']:
            labels = [label] + (['쇼츠'] if 'shorts' in v['contentTabs'] else [])
    v['tags']=list(dict.fromkeys([*v.get('tags',[]),*labels]))
    return v
