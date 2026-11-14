"""Comparison inputs: official snapshots and observed outside-channel appearances."""
from urllib.parse import urlparse
from .activity import WINDOWS, DAY, iso, stamp
from .source_policy import approved_original
from .live_policy import is_continuous_live
from .broadcast import is_music_broadcast

CONFIRMED_SOURCES={'publisher-credit-line','publisher-program-title','editorial-review','manual-review'}


def empty_counts():
    return dict.fromkeys(WINDOWS,0)


def evidence_for(evidence, group, members):
    return (evidence.get('groupId')==group['id'] or
            members.get(evidence.get('memberId'),{}).get('groupId')==group['id'] or
            evidence.get('memberId') in group.get('relatedMemberIds',[]))


def confirmed(evidence):
    if evidence.get('role')!='participant' or evidence.get('source') not in CONFIRMED_SOURCES:
        return False
    try:
        url=urlparse(evidence.get('url',''))
        return url.scheme=='https' and bool(url.hostname) and not url.username and not url.password
    except (TypeError,ValueError,AttributeError):
        return False


def build_comparison(videos, config, current):
    sources={source['id']:source for source in config['channels']}
    members={member['id']:member for member in config.get('members',[])}
    groups={group['id']:group for group in config['groups']}
    rows={}
    for group in config['groups']:
        snapshot=group.get('youtubeActivity') or {}
        status=snapshot.get('activity_status','UNKNOWN')
        checked=stamp(snapshot.get('checked_at'))
        valid_until=stamp(snapshot.get('valid_until'))
        rows[group['id']]={'artistId':group['id'],'name':group.get('name',group['id']),
            'officialUploads':{'activityStatus':status,'counts':{
                key:snapshot.get(key) if status!='UNKNOWN' else None for key in WINDOWS},
                'checkedAt':snapshot.get('checked_at'),'lastUploadAt':snapshot.get('last_upload_at'),
                'reason':snapshot.get('reason') or ('not-collected' if not snapshot else None),
                'canCompare':status!='UNKNOWN' and checked is not None and 0<=current-checked<=DAY
                             and (valid_until is None or current<=valid_until)},
            'externalAppearances':{'coverage':'collected-archive','dateBasis':'publishedAt',
                'counts':empty_counts(),'confirmedCounts':empty_counts(),'inferredCounts':empty_counts(),
                'byType':{'broadcast':0,'radio':0,'external':0}},
            'memberActivities':{'coverage':'collected-archive','counts':empty_counts()}}
    seen=set()
    outside_ids=set()
    for video in videos:
        if video.get('demo') or video.get('platform')!='youtube' or video.get('liveStatus')=='upcoming' or is_continuous_live(video):
            continue
        source=sources.get(video.get('channelId'),{})
        published=stamp(video.get('publishedAt'))
        identity=video.get('platformId') or video.get('id')
        if not identity or identity in seen or not approved_original(source) or published is None:
            continue
        seen.add(identity)
        age=current-published
        if age<0 or age>14*DAY:
            continue
        activity=video.get('individualActivity') or {}
        related_ids=set(video.get('groupIds',[])) | set(activity.get('groupIds',[]))
        for gid in related_ids & groups.keys():
            if source.get('official') and gid in source.get('groupIds',[]):
                continue
            group=groups[gid]
            evidence=[item for item in video.get('appearanceEvidence',[]) if evidence_for(item,group,members)]
            if evidence and all(item.get('role') in ('mention','original-artist','cover-target') for item in evidence):
                continue
            individual=gid in activity.get('groupIds',[]) and gid!=activity.get('artistId')
            if individual:
                bucket=rows[gid]['memberActivities']
            else:
                bucket=rows[gid]['externalAppearances']
                outside_ids.add(identity)
                confidence='confirmedCounts' if any(confirmed(item) for item in evidence) else 'inferredCounts'
                if is_music_broadcast(video):
                    kind='broadcast'
                elif video.get('externalType')=='radio' or 'radio' in video.get('contentTabs',[]):
                    kind='radio'
                else:
                    kind='external'
                bucket['byType'][kind]+=1
            for key,seconds in WINDOWS.items():
                if age<=seconds:
                    bucket['counts'][key]+=1
                    if not individual:
                        bucket[confidence][key]+=1
    return {'schemaVersion':1,'platform':'youtube','generatedAt':iso(current),'windowDays':14,'windowStart':iso(current-14*DAY),
            'uniqueExternalVideos':len(outside_ids),'artists':list(rows.values())}
