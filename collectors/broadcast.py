"""Identify music-show stages only from reviewed broadcast source IDs."""
import json
import re
from pathlib import Path

RULES=json.loads((Path(__file__).resolve().parents[1]/'config/broadcast.json').read_text(encoding='utf-8'))
VARIETY=re.compile(RULES['varietyPattern'],re.I)
STAGE=re.compile(RULES['stagePattern'],re.I)

SHOW = re.compile(r'\ubba4\uc9c1\s*\ubc45\ud06c|music\s*bank|\uc74c\uc545\s*\uc911\uc2ec|music\s*core|\uc778\uae30\uac00\uc694|inkigayo|\uc5e0\uce74\uc6b4\ud2b8\ub2e4\uc6b4|m\s*countdown|simply\s*k-?pop|\uc1fc\s*\ucc54\ud53c\uc5b8|show\s*champion|\ub354\s*\uc1fc|\bthe\s*show\b|\uc704\ubb38\uc5f4\ucc28|\ucf00\uc774\ud31d\uc5c5\ucc28\uc1fc|k-?pop\s*up\s*chart\s*show', re.I)
CLIP_CONTEXT = re.compile(r'MPD|K-?Fancam|K-?Choreo|\uc5bc\ube61\s*\uc9c1\ucea0|\uc785\ub355\s*\uc9c1\ucea0|\uc548\ubc291\uc5f4|\ud56d\uacf5\ucea0|\uc2a4\uce74\uc774\ucea0|\uc9c1\ucea0|fancam|\ud480\ucea0|full\s*cam|face\s*cam', re.I)


def broadcast_context(record):
    title = record.get('title','')
    program = record.get('programName') or ''
    first_line = next(iter(record.get('description','').splitlines()), '')
    return record.get('channelId') in RULES['channelIds'] and (
        bool(SHOW.search(' '.join((title, program, first_line)))) or bool(CLIP_CONTEXT.search(title)))


def broadcast_excluded(record):
    return bool(VARIETY.search(record.get('title',''))) and not re.search(r'\uc575\ucf5c|\uc559\ucf54\ub974|encore', record.get('title',''), re.I)


def is_music_broadcast(record):
    return broadcast_context(record) and not broadcast_excluded(record)
