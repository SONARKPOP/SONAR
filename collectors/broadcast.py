"""Identify music-show stages only from reviewed broadcast source IDs."""
import json
import re
from pathlib import Path

RULES=json.loads((Path(__file__).resolve().parents[1]/'config/broadcast.json').read_text(encoding='utf-8'))
VARIETY=re.compile(RULES['varietyPattern'],re.I)
STAGE=re.compile(RULES['stagePattern'],re.I)

def is_music_broadcast(record):
    title=record.get('title','')
    return record.get('channelId') in RULES['channelIds'] and not VARIETY.search(title) and bool(STAGE.search(title))
