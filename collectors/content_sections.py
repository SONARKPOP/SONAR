"""Shared hierarchy metadata. Does not infer appearances or assign missing durations."""
import json,re
from pathlib import Path
RULES=json.loads((Path(__file__).resolve().parents[1]/'config/content-hierarchy.json').read_text(encoding='utf-8-sig'))
PATTERNS={key:re.compile(RULES[key],re.I) for key in ('teaserPattern','musicTeaserPattern','coverPattern','dancePattern','mvPattern','musicRelatedPattern','broadcastTeaserVarietyPattern')}
def duration_seconds(video):
 seconds=video.get('durationSeconds')
 if isinstance(seconds,(int,float)) and not isinstance(seconds,bool) and seconds>=0:return seconds
 raw=str(video.get('durationLabel') or video.get('duration') or '')
 colon=re.fullmatch(r'(?:(\d+):)?(\d{1,2}):(\d{2})',raw)
 if colon:return int(colon[1] or 0)*3600+int(colon[2])*60+int(colon[3])
 iso=re.fullmatch(r'(?:PT)?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?',raw,re.I)
 return sum(float(n or 0)*weight for n,weight in zip(iso.groups(),(3600,60,1))) if iso and any(iso.groups()) else None

def teaser_type(video):
 text=' '.join([video.get('title',''),*video.get('subtypes',[])])
 if not PATTERNS['teaserPattern'].search(text) and 'teaser' not in video.get('contentTabs',[]) and not video.get('teaserType'):return ''
 return 'music' if not PATTERNS['musicRelatedPattern'].search(text) and (PATTERNS['musicTeaserPattern'].search(text) or video.get('category')=='music') else 'content'

def music_type(video):
 text=' '.join([video.get('title',''),*video.get('subtypes',[])]);kind=teaser_type(video)
 if kind:return 'teaser' if kind=='music' else ''
 if PATTERNS['musicRelatedPattern'].search(text):return ''
 for pattern,kind in [('dancePattern','dance'),('coverPattern','cover'),('mvPattern','mv')]:
  if PATTERNS[pattern].search(text):return kind
 return ''

def content_length(video):
 if video.get('format')=='live':return 'live'
 if teaser_type(video):return 'teaser'
 seconds=duration_seconds(video)
 return '' if seconds is None else 'long' if seconds>=RULES['longSeconds'] else 'regular' if seconds>=RULES['regularSeconds'] else 'short'
