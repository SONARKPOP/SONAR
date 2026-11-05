"""Validated group bundles: the only source of UI defaults and collection policy."""
import json
import re
from pathlib import Path

CONFIG = Path(__file__).resolve().parents[1] / 'config'
RESERVED = {'con', 'prn', 'aux', 'nul', *(f'com{i}' for i in range(1, 10)), *(f'lpt{i}' for i in range(1, 10))}

def read(path):
    try:
        return json.loads(Path(path).read_text(encoding='utf-8'))
    except (OSError, ValueError) as exc:
        raise ValueError(f'{path}: {exc}') from None

def slug(value, label):
    if not isinstance(value, str) or not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', value) or value in RESERVED:
        raise ValueError(f'{label}: use a safe lowercase ID (letters, digits, hyphens).')

def text(value, label):
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f'{label}: non-empty text required.')

def strings(value, label):
    if not isinstance(value, list):
        raise ValueError(f'{label}: array required.')
    for item in value:
        text(item, label)

def validate(bundles, shared, taxonomy):
    group_ids, member_ids, channel_ids, identities, aliases = set(), set(), set(), set(), {}
    for bundle in bundles:
        if not isinstance(bundle, dict):
            raise ValueError('Each group bundle must be a JSON object.')
        gid = bundle.get('id')
        slug(gid, 'Group ID')
        if gid in group_ids:
            raise ValueError(f'Duplicate group: {gid}')
        group_ids.add(gid)
        text(bundle.get('name'), f'{gid}.name')
        strings(bundle.get('aliases'), f'{gid}.aliases')
        strings(bundle.get('platforms'), f'{gid}.platforms')
        if bundle.get('debutYear') is not None and (type(bundle['debutYear']) is not int or not 1900 <= bundle['debutYear'] <= 2100):
            raise ValueError(f'{gid}.debutYear: year must be an integer or null.')
        if bundle.get('gender') not in ('girl', 'boy', 'mixed'):
            raise ValueError(f'{gid}: invalid gender.')
        if bundle.get('artistType', 'group') not in ('group','duo','solo'):
            raise ValueError(f'{gid}: invalid artistType.')
        if type(bundle.get('ambiguousName', False)) is not bool:
            raise ValueError(f'{gid}: ambiguousName must be boolean.')
        for flag in ('supported', 'defaultSelected', 'collectionEnabled', 'sampleEnabled'):
            if type(bundle.get(flag)) is not bool:
                raise ValueError(f'{gid}.{flag}: boolean required.')
        if not bundle['supported'] and any(bundle[f] for f in ('defaultSelected', 'collectionEnabled', 'sampleEnabled')):
            raise ValueError(f'{gid}: unsupported groups cannot be default, collected, or sampled.')
        for alias in [bundle['name'], *bundle['aliases']]:
            key = ' '.join(alias.casefold().split())
            if key in aliases and aliases[key] != gid:
                raise ValueError(f'Ambiguous group alias: {alias} ({aliases[key]}, {gid})')
            aliases[key] = gid
        if not isinstance(bundle.get('members'), list) or not isinstance(bundle.get('channels'), list):
            raise ValueError(f'{gid}: members and channels must be arrays.')
        for member in bundle['members']:
            if not isinstance(member, dict):
                raise ValueError(f'{gid}: each member must be an object.')
            mid = member.get('id')
            slug(mid, 'Member ID')
            if mid in member_ids:
                raise ValueError(f'Duplicate member: {mid}')
            member_ids.add(mid)
            if member.get('groupId') != gid:
                raise ValueError(f'{mid}: member must link to its owning group {gid}.')
            text(member.get('name'), mid)
            strings(member.get('aliases'), mid)
            if 'ambiguousAliases' in member:
                strings(member['ambiguousAliases'], f'{mid}.ambiguousAliases')
                if set(member['ambiguousAliases']) - set(member['aliases']):
                    raise ValueError(f'{mid}: ambiguous aliases must also appear in aliases.')
    all_channels = [c for b in bundles for c in b['channels']] + shared
    for channel in all_channels:
        if not isinstance(channel, dict):
            raise ValueError('Each channel must be a JSON object.')
        if type(channel.get('collectionPages', 1)) is not int or not 1 <= channel.get('collectionPages', 1) <= 4:
            raise ValueError('Channel collectionPages must be an integer from 1 to 4.')
        programs = channel.get('programs', [])
        if not isinstance(programs, list):
            raise ValueError('Channel programs must be a list.')
        program_ids = set()
        for program in programs:
            slug(program.get('id'), 'Program ID')
            text(program.get('name'), 'Program name')
            if program['id'] in program_ids or program.get('externalType') not in ('song','radio','variety','interview','ad','other'):
                raise ValueError('Duplicate program ID or invalid external type.')
            program_ids.add(program['id'])
            text(program.get('titlePattern'), 'Program title pattern')
            try:
                re.compile(program['titlePattern'])
            except re.error:
                raise ValueError('Invalid program title pattern.') from None
        cid = channel.get('id')
        slug(cid, 'Channel ID')
        if cid in channel_ids:
            raise ValueError(f'Duplicate channel ID: {cid}')
        channel_ids.add(cid)
        text(channel.get('name'), cid)
        text(channel.get('platform'), cid)
        strings(channel.get('groupIds'), cid)
        if set(channel['groupIds']) - group_ids:
            raise ValueError(f'{cid}: unknown group link.')
        if type(channel.get('official')) is not bool or type(channel.get('collectionEnabled')) is not bool:
            raise ValueError(f'{cid}: official and collectionEnabled must be boolean.')
        if channel['official'] and not channel['groupIds']:
            raise ValueError(f'{cid}: official source needs a group link.')
        identity = channel.get('handle') or channel.get('platformId')
        text(identity, f'{cid} source identity')
        if channel['platform'] == 'youtube':
            if channel.get('handle') and not re.fullmatch(r'@[\w.-]{3,30}', channel['handle']):
                raise ValueError(f'{cid}: invalid YouTube handle.')
            if channel.get('platformId') and not re.fullmatch(r'UC[\w-]{22}', channel['platformId']):
                raise ValueError(f'{cid}: invalid YouTube channel ID.')
        elif channel['collectionEnabled']:
            raise ValueError(f'{cid}: collection adapter is only available for YouTube.')
        for field in ('handle', 'platformId'):
            if channel.get(field):
                key = (channel['platform'], field, channel[field].casefold())
                if key in identities:
                    raise ValueError(f'Duplicate source identity: {channel[field]}. Register a shared channel once.')
                identities.add(key)
    for bundle in bundles:
        for channel in bundle['channels']:
            if bundle['id'] not in channel['groupIds']:
                raise ValueError(f"{channel['id']}: must link to owning group {bundle['id']}.")
            if channel['official'] and channel['groupIds'] != [bundle['id']]:
                raise ValueError(f"{channel['id']}: a group official source must belong to that group only. Register shared label channels as external sources.")
        if bundle['collectionEnabled'] and not any(c['collectionEnabled'] and c['platform'] == 'youtube' for c in bundle['channels']):
            raise ValueError(f"{bundle['id']}: enable at least one YouTube source before collection.")
    for key in ('categories', 'subtypes', 'formats'):
        strings(taxonomy.get(key), f'taxonomy.{key}')
    if any(c['official'] for c in shared):
        raise ValueError('Shared channels must be external sources; group official sources belong in their group file.')

def load_bundles(config_dir=CONFIG):
    config_dir = Path(config_dir)
    bundles = []
    for path in sorted((config_dir / 'groups').glob('*.json')):
        bundle = read(path)
        if not isinstance(bundle, dict):
            raise ValueError(f'{path.name}: group must be an object.')
        if path.stem != bundle.get('id'):
            raise ValueError(f'{path.name}: filename must match group ID.')
        bundles.append(bundle)
    settings = read(config_dir / 'settings.json')
    shared = read(config_dir / 'channels.json')
    taxonomy = read(config_dir / 'taxonomy.json')
    if not isinstance(shared, list):
        raise ValueError('channels.json must be an array.')
    validate(bundles, shared, taxonomy)
    if not isinstance(settings, dict) or not isinstance(settings.get('groupOrder'), list):
        raise ValueError('settings.groupOrder must be an array.')
    strings(settings['groupOrder'], 'groupOrder')
    if len(set(settings['groupOrder'])) != len(settings['groupOrder']) or set(settings['groupOrder']) - {b['id'] for b in bundles}:
        raise ValueError('groupOrder contains duplicates or unknown groups.')
    return bundles, shared, taxonomy, settings

def load_config(config_dir=CONFIG):
    bundles, shared, taxonomy, settings = load_bundles(config_dir)
    order = {gid: i for i, gid in enumerate(settings.get('groupOrder', []))}
    bundles.sort(key=lambda b: (order.get(b['id'], len(order)), b['name'].casefold()))
    supported = [b for b in bundles if b['supported']]
    public_fields = ('id', 'name', 'aliases', 'gender', 'platforms')
    channels = []
    for bundle in supported:
        for source in bundle['channels']:
            channels.append({**source, 'collectionEnabled': bundle['collectionEnabled'] and source['collectionEnabled']})
    channels.extend(shared)
    return {
        'schemaVersion': 1,
        'groups': [{**{k:b[k] for k in public_fields}, 'debutYear':b.get('debutYear'), 'artistType':b.get('artistType','group'), 'ambiguousName':b.get('ambiguousName',False)} for b in supported],
        'members': [m for b in supported for m in b['members']],
        'channels': channels,
        'taxonomy': taxonomy,
        'defaultGroupIds': [b['id'] for b in supported if b['defaultSelected']],
        'sampleGroupIds': [b['id'] for b in supported if b['sampleEnabled']],
        'collectionGroupIds': [b['id'] for b in supported if b['collectionEnabled']],
    }
