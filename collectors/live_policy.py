"""Exclude clearly labelled continuous music stations, not ordinary artist lives."""
import json
import re
from pathlib import Path
POLICY=json.loads((Path(__file__).resolve().parents[1]/'config/live-policy.json').read_text(encoding='utf-8'))
CONTINUOUS=re.compile(POLICY['continuousTitlePattern'],re.I)

def is_continuous_live(video):
    return (video.get('format')=='live' or video.get('liveStatus')=='live') and bool(CONTINUOUS.search(video.get('title','')))
