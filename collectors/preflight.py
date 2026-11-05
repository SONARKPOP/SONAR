"""Small, staged API check. Never replaces public sample data."""
import argparse
import copy
import getpass
import os
import sys
from datetime import datetime
from pathlib import Path
from .registry import load_config
from .youtube import YouTube, resolve, normalize, read_overrides
from .publish import ROOT, now, publish, write

def run(api, limit=5, output=None):
    if not 1 <= limit <= 10:
        raise ValueError('Choose 1..10 videos per official channel.')
    if output is not None and Path(output).exists():
        raise ValueError('Choose a new review directory to avoid overwriting a previous run.')
    config = copy.deepcopy(load_config())
    config['channels'] = [c for c in config['channels'] if c['official'] and c['collectionEnabled']]
    if not config['channels']:
        raise ValueError('No enabled official channel. Check group collection settings.')
    enabled = set(config['collectionGroupIds'])
    matching = {**config, 'groups':[g for g in config['groups'] if g['id'] in enabled], 'members':[m for m in config['members'] if m['groupId'] in enabled]}
    lookup = resolve(api, config)
    ids = set()
    counts = {}
    for channel in config['channels']:
        if not channel.get('collectionEnabled',True):
            continue
        result = api.get('playlistItems', part='contentDetails', playlistId=channel['uploadsPlaylistId'], maxResults=limit)
        items = result.get('items', [])
        counts[channel['id']] = len(items)
        ids.update(item['contentDetails']['videoId'] for item in items)
    overrides = read_overrides()
    records = []
    review = []
    for raw in api.videos(ids):
        channel = lookup.get(raw['snippet']['channelId'])
        if not channel or raw.get('status', {}).get('privacyStatus') != 'public':
            continue
        record = normalize(raw, channel, matching, overrides['videos'].get(raw['id']))
        records.append(record)
        review.append({'id':record['id'], 'title':record['title'], 'url':f"https://www.youtube.com/watch?v={record['platformId']}", 'groupIds':record['groupIds'], 'memberIds':record['memberIds'], 'category':record['category'], 'format':record['format'], 'subtypes':record['subtypes'], 'reviewStatus':'pending', 'notes':['멤버 이름 언급이 실제 출연인지 확인', '제목/설명 기반 Shorts 추론 확인']})
    report = {'checkedAt':now(), 'status':'api-success-review-pending', 'publicDataChanged':False, 'limitPerChannel':limit, 'channels':[{'id':c['id'],'handle':c.get('handle'),'platformId':c['platformId'],'groupIds':c['groupIds'],'playlistRows':counts[c['id']],'collectedVideos':sum(v['channelId']==c['id'] for v in records)} for c in config['channels']], 'videoCount':len(records), 'review':review, 'limits':['공식 채널 최근 업로드만 확인. 외부 출연 채널·신규 라이브·예약 검색은 수행하지 않음.', '자동 태그 검수 전이며 전체 수집/배포 성공을 의미하지 않음.']}
    # No staging files are published until all API calls have succeeded.
    output = Path(output) if output else ROOT / 'review' / datetime.now().strftime('%Y%m%d-%H%M%S-%f')
    if output.exists():
        raise ValueError('Choose a new review directory to avoid overwriting a previous run.')
    publish(records, config, output=output / 'data')
    write(output / 'report.json', report)
    lines = ['# SONAR 실제 API 소량 수집 결과', '', f"- 확인: {report['checkedAt']}", f'- 영상 {len(records)}개 / 공식 소스 {len(config["channels"])}개', '- 공개 샘플 데이터는 변경하지 않았습니다.', '- 태그/분류는 검수 대기 상태입니다.', '', '| 채널 | 재생목록 항목 | 수집 성공 |', '| --- | --- | --- |']
    for channel in report['channels']:
        lines.append(f"| {channel['id']} | {channel['playlistRows']} | {channel['collectedVideos']} |")
    lines += ['', '영상별 검수 항목은 report.json의 review를 확인하세요. 수정은 config/overrides.json에 반영한 뒤 재수집합니다. 라이브/외부 채널 확인과 공개 데이터 전환은 별도 단계입니다.', '']
    (output / 'REPORT.md').write_text('\n'.join(lines),encoding='utf-8')
    return output, report

def main(argv=None):
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--prompt-key',action='store_true',help='Read a hidden key from an interactive console; never save it.')
    parser.add_argument('--limit',type=int,default=5,choices=range(1,11))
    parser.add_argument('--output',type=Path)
    args=parser.parse_args(argv)
    try:
        load_config()  # Validate before asking for a key.
        key=os.environ.get('YOUTUBE_API_KEY')
        if not key and args.prompt_key:
            if not sys.stdin.isatty():
                raise ValueError('Use CONNECT-YOUTUBE.cmd in a console. Hidden key entry requires an interactive terminal.')
            key=getpass.getpass('YouTube API key (hidden, not saved): ').strip()
        if not key:
            raise ValueError('API key is not configured. Run CONNECT-YOUTUBE.cmd; do not send the key in chat.')
        output,report=run(YouTube(key),args.limit,args.output)
        key=None
        print(f"API check succeeded: {report['videoCount']} videos. Review files: {output}")
        print('Public sample data was not replaced. Tags still need review.')
    except (ValueError,RuntimeError,OSError) as exc:
        parser.exit(1,f'{exc}\n')
    except KeyboardInterrupt:
        parser.exit(1,'Cancelled.\n')

if __name__=='__main__':main()
