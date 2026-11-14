"""Export the public artist channel census and unresolved reviews."""
import json
import re
from pathlib import Path
from .registry import CONFIG, load_bundles
from .publish import DATA, ROOT, write, now
from .source_policy import public_artist, reviewed_dedicated_channel

def export_database(config_dir=CONFIG, output=DATA, report_dir=None):
    bundles,_,_,_=load_bundles(config_dir)
    bundles=[bundle for bundle in bundles if bundle.get('supported',True) and public_artist(bundle)]
    cache_path=Path(output)/'channel-activity.json'
    observed=json.loads(cache_path.read_text(encoding='utf-8')).get('channels',{}) if cache_path.exists() else {}
    catalog_path=Path(output)/'catalog.json'
    resolved={c['id']:c for c in json.loads(catalog_path.read_text(encoding='utf-8')).get('channels',[])} if catalog_path.exists() else {}
    groups=[];channels=[];pending=[]
    for bundle in bundles:
        aliases=bundle.get('aliases',[])
        group={'group_id':bundle['id'],'name_ko':bundle.get('nameKo') or next((v for v in aliases if re.search('[가-힣]',v)),None),
               'name_en':bundle.get('nameEn') or next((v for v in [bundle['name'],*aliases] if re.search('[a-zA-Z]',v)),None),
               'display_name':bundle['name'],'aliases':aliases,'debut_year':bundle.get('debutYear'),'debut_date':bundle.get('debutDate'),'debut_date_sources':bundle.get('debutDateSources',[]),
               'group_status':bundle.get('groupStatus','unknown'),'group_status_sources':bundle.get('groupStatusSources',[]),
               'previous_group_ids':bundle.get('previousGroupIds',[]),'search_status':bundle.get('channelSearchStatus','UNVERIFIED')}
        groups.append(group)
        dedicated=[c for c in bundle['channels'] if c.get('official') and c.get('groupIds')==[bundle['id']] and c.get('platform')=='youtube' and not c.get('shared')]
        for index,channel in enumerate(dedicated):
            evidence=channel.get('verification',{});cid=channel.get('platformId')
            current=observed.get(channel['id'],{})
            identity=channel.get('platformId') or channel.get('handle')
            if not cid and current.get('configuredIdentity')==identity:cid=current.get('channelId')
            prior=resolved.get(channel['id'],{})
            if not cid and channel.get('handle') and prior.get('handle')==channel['handle']:cid=prior.get('platformId')
            handle=channel.get('handle') or next(iter(channel.get('expectedHandles',[])),None)
            previous_handle=handle
            if current.get('channelId')==cid and not current.get('error') and current.get('handle'):
                handle=current['handle']
            status=channel.get('verificationStatus','UNVERIFIED')
            if status in ('VERIFIED','SUPPORTED') and not reviewed_dedicated_channel(channel,bundle['id']):
                status='UNVERIFIED'
            channels.append({'channel_id':cid,'source_id':channel['id'],'group_id':bundle['id'],
                'channel_url':f'https://www.youtube.com/channel/{cid}' if cid else (f'https://www.youtube.com/{handle}' if handle else None),
                'handle':handle,'historical_urls':list(dict.fromkeys([*channel.get('historicalUrls',[]),*(['https://www.youtube.com/'+previous_handle] if previous_handle and previous_handle.casefold()!=str(handle).casefold() else [])])),'verification_status':status,
                'verification_source_url':evidence.get('evidenceUrl'),'verification_sources':evidence.get('sources',[]),
                'verification_basis':evidence.get('basis'),'verified_at':evidence.get('checkedAt'),'is_primary':channel.get('isPrimary',index==0)})
        if not dedicated or any(not reviewed_dedicated_channel(c,bundle['id']) for c in dedicated):
            pending.append({'group_id':bundle['id'],'name':bundle['name'],'status':group['search_status'],
                'reason':bundle.get('channelSearchReason','Official-channel verification is incomplete; absence is not established.'),
                'search_terms':[name+' official YouTube' for name in dict.fromkeys([bundle['name'],*aliases])],
                'sources':bundle.get('channelSearchSources',[])})
    verified_ids={c['group_id'] for c in channels if c['verification_status'] in ('VERIFIED','SUPPORTED') and c['channel_url']}
    summary={'totalArtists':len(groups),'totalGirlGroups':sum(b.get('gender')=='girl' and b.get('artistType','group')=='group' for b in bundles),
        'groupsWithOfficialChannelUrl':len(verified_ids),
        'unverifiedGroups':sum(v['status']!='NOT FOUND' and v['group_id'] not in verified_ids for v in pending),
        'notFoundGroups':sum(v['status']=='NOT FOUND' and v['group_id'] not in verified_ids for v in pending),
        'partiallyReviewedGroups':sum(v['group_id'] in verified_ids for v in pending),
        'reviewQueueArtists':len(pending),
        'exactDebutDateMissing':sum(not g['debut_date'] for g in groups),'realWorldStatusUnknown':sum(g['group_status']=='unknown' for g in groups)}
    report={'updatedAt':now(),'scope':'Registered public female and mixed groups, duos and solo artists with dedicated artist-channel review; incomplete registry, not an exhaustive census.','summary':summary,
            'groups':groups,'youtubeChannels':channels,'reviewQueue':pending}
    write(Path(output)/'girl-group-database.json',report)
    if report_dir:
        write(Path(report_dir)/'OFFICIAL-CHANNEL-CENSUS.json',report)
        lines=['# SONAR official-channel census','',json.dumps(summary,ensure_ascii=False,indent=2),'',
               'Only reviewed dedicated artist channels qualify. Unknown debut dates and real-world status remain null/unknown. NOT FOUND is used only after a documented search, never inferred from an empty registry.','',
               '## Channels','', '| Artist | Channel | Verification | Checked | Source |','| --- | --- | --- | --- | --- |']
        names={g['group_id']:g['display_name'] for g in groups}
        for c in channels:lines.append(f"| {names[c['group_id']]} | {c['channel_url']} | {c['verification_status']} | {c['verified_at']} | {c['verification_source_url']} |")
        lines+=['','## Pending verification','']+[f"- {v['name']} — {v['status']}: {v['reason']}" for v in pending]
        (Path(report_dir)/'OFFICIAL-CHANNEL-CENSUS.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
    print(json.dumps(summary));return report

if __name__=='__main__':
    from .channel_review import export_queue
    export_database(report_dir=ROOT/'docs')
    export_queue()
