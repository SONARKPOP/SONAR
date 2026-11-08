"""Register groups without editing React or the collector. Run --help for commands."""
import argparse
from pathlib import Path
from urllib.parse import urlparse, unquote
from .registry import CONFIG, load_bundles, load_config, read, validate, slug
from .publish import DATA, write, publish

def youtube_identity(value):
    if value.startswith('@'):
        return {'handle':value}
    if value.startswith('UC') and '/' not in value:
        return {'platformId':value}
    parsed = urlparse(value)
    if parsed.scheme != 'https' or parsed.hostname not in ('youtube.com', 'www.youtube.com'):
        raise ValueError('Use a YouTube @handle, UC channel ID or https://www.youtube.com/@handle URL.')
    path = unquote(parsed.path).strip('/').split('/')
    if len(path) == 1 and path[0].startswith('@'):
        return {'handle':path[0]}
    if len(path) == 2 and path[0] == 'channel':
        return {'platformId':path[1]}
    raise ValueError('Use a channel URL, not a video, playlist or /c/ URL.')

def save_bundle(bundle, config_dir=CONFIG, create=True):
    config_dir = Path(config_dir)
    slug(bundle.get('id'), 'Group ID')
    bundles, shared, taxonomy, _ = load_bundles(config_dir)
    existing = [b for b in bundles if b['id'] == bundle['id']]
    if create and existing:
        raise ValueError(f"Group already exists: {bundle['id']}. Edit its file or use set.")
    if not create and not existing:
        raise ValueError(f"Unknown group: {bundle['id']}")
    candidates = [b for b in bundles if b['id'] != bundle['id']] + [bundle]
    validate(candidates, shared, taxonomy)
    write(config_dir / 'groups' / f"{bundle['id']}.json", bundle)

def sync_catalog(config_dir=CONFIG, output=DATA):
    """Re-index retained content without API calls or refreshing live freshness."""
    from .youtube import ambiguous_artist_links, prune_stale_attribution
    from .source_policy import public_artist_scope, scope_video
    output = Path(output)
    attribution_config = load_config(config_dir)
    config = public_artist_scope(attribution_config)
    groups = {g['id'] for g in config['groups']}
    members = {m['id'] for m in config['members']}
    channels = {c['id']:c for c in config['channels']}
    overrides_path = Path(config_dir) / 'overrides.json'
    overrides = read(overrides_path).get('videos', {}) if overrides_path.exists() else {}
    ambiguous_links = ambiguous_artist_links(attribution_config)

    def clean(record):
        channel = channels.get(record['channelId'])
        if channel:
            record = prune_stale_attribution(record, channel, attribution_config, overrides.get(record.get('platformId')), ambiguous_links)
            return scope_video(record, groups, members)
        return record
    records = []
    for path in (output / 'content').glob('*.json'):
        record = clean(read(path))
        if record['groupIds'] and record['channelId'] in channels:
            records.append(record)
    previous = read(output / 'catalog.json') if (output / 'catalog.json').exists() else {'demo':True}
    # Preserve resolved channel IDs from a previous collection for lightweight live updates.
    old_channels = {c['id']:c for c in previous.get('channels', [])}
    for channel in config['channels']:
        old = old_channels.get(channel['id'], {})
        if (channel.get('handle') and old.get('handle') == channel['handle']) or (channel.get('platformId') and old.get('platformId') == channel['platformId']):
            for key in ('platformId', 'uploadsPlaylistId'):
                if old.get(key) and not channel.get(key):channel[key] = old[key]
            # A UI-only rebuild must not turn a failed identity check into an
            # apparently verified official link. Full collection retries it.
            if old.get('unavailableReason'):
                channel.update(collectionEnabled=False, unavailableReason=old['unavailableReason'])
                if old.get('observedChannelName'):channel['observedChannelName']=old['observedChannelName']
    index = read(output / 'latest.json') if (output / 'latest.json').exists() else {'events':[]}
    events = []
    for event in index.get('events', []):
        event = {**event, 'groupIds':[g for g in event['groupIds'] if g in groups]}
        if event['groupIds']:events.append(event)
    live = read(output / 'live.json') if (output / 'live.json').exists() else {'updatedAt':None, 'items':[]}
    official = {c['id'] for c in config['channels'] if c['official'] and c['collectionEnabled']}
    live['items'] = [v for v in live.get('items', []) if v['channelId'] in official and set(v['groupIds']) & groups]
    from .live_policy import is_continuous_live
    streams={v['id']:v for v in map(clean, [*live['items'],*live.get('stations',[])])
             if v['channelId'] in official and set(v['groupIds']) & groups}
    live['items']=[v for v in streams.values() if not is_continuous_live(v)]
    live['stations']=[v for v in streams.values() if is_continuous_live(v)]
    candidates = read(output / 'live-candidates.json') if (output / 'live-candidates.json').exists() else {'ids':[]}
    retained = {v['platformId'] for v in records if v['channelId'] in official}
    candidates['ids'] = [i for i in candidates['ids'] if i in retained]
    publish(records, config, events, output=output, demo=previous.get('demo', False))
    write(output / 'live.json', live)
    write(output / 'live-candidates.json', candidates)
    return config

def boolean(value):
    if value not in ('true', 'false'):
        raise argparse.ArgumentTypeError('Use true or false.')
    return value == 'true'

def new_bundle(gid, name, aliases, source, gender='girl', artist_type='group'):
    slug(gid, 'Group ID')
    return {'id':gid, 'name':name, 'aliases':list(dict.fromkeys([name, *aliases])), 'gender':gender, 'artistType':artist_type, 'platforms':['youtube'], 'supported':True, 'defaultSelected':False, 'collectionEnabled':False, 'sampleEnabled':False, 'members':[], 'channels':[{'id':gid+'-official','platform':'youtube','name':name,'official':True,'groupIds':[gid],'collectionEnabled':True, **youtube_identity(source)}]}

def wizard(config_dir=CONFIG, output=DATA):
    print('SONAR 그룹 등록 · 공식 채널을 확인한 뒤 입력하세요. API 키는 입력하지 않습니다.')
    gid = input('그룹 ID (영문 소문자/숫자/하이픈): ').strip()
    name = input('표시할 그룹 이름: ').strip()
    aliases = [a.strip() for a in input('검색 별칭 (쉼표로 구분, 예: 한글명,영문명): ').split(',') if a.strip()]
    source = input('공식 YouTube 채널 주소 또는 @핸들: ').strip()
    bundle = new_bundle(gid, name, aliases, source)
    bundles, shared, taxonomy, _ = load_bundles(config_dir)
    validate([*bundles, bundle], shared, taxonomy)
    print(f"\n{name} ({gid}) · {source}\n지원 목록에 추가 / 기본 선택·수집·샘플 생성은 꺼짐")
    if input('이 설정으로 등록할까요? [y/N]: ').strip().lower() != 'y':
        print('등록을 취소했습니다. 파일을 변경하지 않았습니다.')
        return
    save_bundle(bundle, config_dir)
    config = sync_catalog(config_dir, output)
    print(f"등록 완료: {len(config['groups'])}개 그룹. 브라우저를 새로고침하면 그룹 추가 검색에 나타납니다.")

def main(argv=None, config_dir=CONFIG, output=DATA):
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest='command', required=True)
    sub.add_parser('validate')
    sub.add_parser('list')
    sub.add_parser('sync')
    sub.add_parser('wizard')
    add = sub.add_parser('add')
    add.add_argument('--id', required=True)
    add.add_argument('--name', required=True)
    add.add_argument('--alias', action='append', default=[])
    add.add_argument('--youtube', required=True)
    add.add_argument('--gender', choices=['girl','boy','mixed'], default='girl')
    add.add_argument('--artist-type', choices=['group','duo','solo'], default='group')
    imported = sub.add_parser('import')
    imported.add_argument('file', type=Path)
    edit = sub.add_parser('set')
    edit.add_argument('id')
    for flag in ('supported', 'default-selected', 'collect', 'sample'):
        edit.add_argument('--' + flag, type=boolean)
    args = parser.parse_args(argv)
    try:
        if args.command == 'wizard':
            wizard(config_dir, output)
            return
        if args.command == 'validate':
            config = load_config(config_dir)
        elif args.command == 'list':
            bundles, _, _, _ = load_bundles(config_dir)
            for b in bundles:
                print(f"{b['id']:18} {b['name']:16} supported={b['supported']} default={b['defaultSelected']} collect={b['collectionEnabled']} sample={b['sampleEnabled']}")
            return
        elif args.command in ('add', 'import'):
            if args.command == 'import':
                bundle = read(args.file)
            else:
                bundle = new_bundle(args.id, args.name, args.alias, args.youtube, args.gender, args.artist_type)
            save_bundle(bundle, config_dir)
            config = sync_catalog(config_dir, output)
        elif args.command == 'set':
            slug(args.id, 'Group ID')
            bundle = read(Path(config_dir) / 'groups' / f'{args.id}.json')
            fields = {'supported':'supported', 'default_selected':'defaultSelected', 'collect':'collectionEnabled', 'sample':'sampleEnabled'}
            if all(getattr(args, key) is None for key in fields):
                raise ValueError('Choose at least one setting to change.')
            for key, field in fields.items():
                if getattr(args, key) is not None:bundle[field] = getattr(args, key)
            save_bundle(bundle, config_dir, create=False)
            config = sync_catalog(config_dir, output)
        else:
            config = sync_catalog(config_dir, output)
        print(f"Registry OK: {len(config['groups'])} supported groups; {len(config['defaultGroupIds'])} defaults; {len(config['collectionGroupIds'])} collecting. No YouTube API calls made.")
    except (ValueError, KeyError, TypeError, EOFError) as exc:
        parser.exit(1, f'{exc}\n')

if __name__ == '__main__':main()
