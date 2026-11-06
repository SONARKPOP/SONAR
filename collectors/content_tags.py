"""Broad, non-exclusive content tags. No appearance or whole-group inference."""
import re
from .broadcast import is_music_broadcast

OWN_LABELS={'behind':'비하인드','daily':'일상·브이로그','variety':'자체 예능','practice':'연습·퍼포먼스','other':'기타·미분류'}
EXTERNAL_LABELS={'song':'노래·퍼포먼스','radio':'라디오','variety':'예능','interview':'인터뷰','ad':'광고·홍보','other':'기타·미분류'}

def broad_kind(text, own):
    rules = [('behind',r'behind|비하인드|making|메이킹'),('daily',r'vlog|브이로그|일상|휴가'),
             ('practice',r'practice|연습|퍼포먼스|performance'),('variety',r'예능|게임|챌린지|challenge')] if own else [
             ('radio',r'라디오|radio'),('ad',r'광고|홍보|commercial|campaign|\bCF\b'),
             ('interview',r'인터뷰|interview'),('variety',r'예능|variety'),
             ('song',r'퍼포먼스|커버|performance|cover|리무진서비스|릴레이댄스')]
    return next((kind for kind,pattern in rules if re.search(pattern,text,re.I)),'other')

def apply_tags(record, official):
    v={**record}
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
    v['musicBroadcast']=is_music_broadcast(v)
    if v['musicBroadcast']:
        labels.append('음악방송')
    v['tags']=list(dict.fromkeys([*v.get('tags',[]),*labels]))
    return v
