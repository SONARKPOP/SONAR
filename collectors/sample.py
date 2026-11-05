"""Reproducible offline fixture. Never presented as real live/schedule data."""
from datetime import datetime, timedelta, timezone
import json
from .publish import ROOT, publish
from .registry import load_config

def generate():
    config = load_config()
    records = []
    sample_groups = [g for g in config['groups'] if g['id'] in config['sampleGroupIds']]
    kinds = [('music', 'MV'), ('own', '비하인드'), ('external', '예능'), ('shorts', '챌린지'), ('music', '퍼포먼스'), ('own', '브이로그')]
    titles = ['새로운 무대, 새로운 우리 | Performance Film', '무대 뒤 우리의 하루 | Behind the scenes', '이 조합을 기다렸어! | 토크룸', '오늘의 포인트 안무, 같이 해볼까요?', '가장 빛나는 순간 | Stage Mix', '아무것도 안 해도 즐거운 하루 | VLOG']
    for gi, g in enumerate(sample_groups):
        for n in range(18):
            cat, subtype = kinds[n % len(kinds)]
            official = next((c for c in config['channels'] if g['id'] in c['groupIds'] and c['official']), None)
            external = [c for c in config['channels'] if not c['official']]
            channel = external[(n // 6) % len(external)] if cat == 'external' and external else official
            if channel is None:
                continue
            vid = f"demo-{g['id']}-{n:02}"
            group_ids = [g['id']]
            if cat == 'external':
                group_ids.append(sample_groups[(gi + 1) % len(sample_groups)]['id'])
            records.append({'id': f'youtube__{vid}', 'platform': 'youtube', 'platformId': vid, 'demo': True, 'title': f"[샘플] {g['name']} — {titles[n % len(titles)]} EP.{n+1:02}", 'description': 'UI 탐색을 위한 합성 샘플. 실제 업로드가 아닙니다.', 'publishedAt': (datetime(2026, 11, 5, 6, tzinfo=timezone.utc) - timedelta(hours=n*5+gi)).isoformat(), 'groupIds': group_ids, 'memberIds': [m['id'] for m in config['members'] if m['groupId'] == g['id']][:1] if n % 3 == 0 else [], 'channelId': channel['id'], 'channelName': channel['name'], 'category': cat, 'subtypes': [subtype], 'tags': [g['name'], subtype, '샘플'], 'format': 'short' if cat == 'shorts' else 'video', 'thumbnail': '', 'durationLabel': '0:35' if cat == 'shorts' else f'{10+n}:24', 'liveStatus': 'none'})
    music = [('rescene','9XttLI0oH0I','LOVE ATTACK'),('hearts2hearts','kxUA2wwYiME','The Chase'),('kiiikiii','hAEfi_SKTEU','I DO ME')]
    for i,(gid,vid,title) in enumerate(music):
        if gid not in config['sampleGroupIds']:
            continue
        channel=next(c for c in config['channels'] if gid in c['groupIds'] and c['official'])
        records.append({'id':f'youtube__{vid}','platform':'youtube','platformId':vid,'demo':False,'title':f"{next(g['name'] for g in config['groups'] if g['id']==gid)} — {title} MV",'description':'플레이어 동작 확인을 위한 대표 MV 예시. 채널/날짜 메타데이터는 데모용입니다.','publishedAt':f'2026-11-05T0{6-i}:00:00Z','groupIds':[gid],'memberIds':[],'channelId':channel['id'],'channelName':channel['name'],'category':'music','subtypes':['MV'],'tags':['MV','대표 영상 예시'],'format':'video','thumbnail':f'https://i.ytimg.com/vi/{vid}/hqdefault.jpg','durationLabel':'MV','liveStatus':'none'})
    events = [{'id':f'demo-event-{i}','demo':True,'groupIds':[g['id']],'title':f"[예시] {g['name']} 스페셜 스테이지",'startsAt':(datetime(2026,11,7,9,tzinfo=timezone.utc)+timedelta(days=i*3)).isoformat(),'kind':'공연','location':'예시 장소 · 실제 일정 아님','url':''} for i,g in enumerate(sample_groups)]
    publish(records,config,events,demo=True)
    print(f'Generated {len(records)} canonical fixture records and {len(events)} demo schedules.')

if __name__ == '__main__':
    generate()
