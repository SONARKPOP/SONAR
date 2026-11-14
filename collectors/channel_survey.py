"""Export evidence-led female artist/channel research without changing identities."""
import json
import re
from pathlib import Path
from .source_policy import reviewed_dedicated_channel

CHANNEL_ID=re.compile(r'UC[A-Za-z0-9_-]{22}')
DEDICATED={'group_official','solo_official','member_personal'}


def build_survey(bundles,research):
    targets=[g for g in bundles if g.get('gender')=='girl']
    evidence={item['artistId']:item for item in research.get('artists',[])}
    members={m['id']:m for g in bundles for m in g.get('members',[])}
    persons=dict(members)
    groups={g['id']:g for g in bundles}
    artists=[];channels={};relations=[]
    for group in targets:
        gid=group['id'];item=evidence.get(gid,{})
        person_ids=[mid for mid in group.get('relatedMemberIds',[]) if mid in members]
        person_id=person_ids[0] if group.get('artistType')=='solo' and len(person_ids)==1 else None
        if (group.get('artistType')=='solo' and not person_ids and not group.get('relatedMemberIds')
                and not group.get('relatedGroupIds') and not group.get('previousGroupIds')):
            person_id=gid
            persons.setdefault(gid,{'id':gid,'artistId':gid,'name':group['name'],'aliases':group.get('aliases',[])})
        person=members.get(person_id,{})
        verified_ids={c.get('platformId') for c in group.get('channels',[])
                      if reviewed_dedicated_channel(c,gid) and CHANNEL_ID.fullmatch(c.get('platformId',''))}
        resolved=item.get('resolvedChannels',[])
        verified=any(c.get('channelType') in DEDICATED and c.get('identityChecked') is True
                     and c.get('channelId') in verified_ids for c in resolved)
        status='verified' if verified else 'unresolved' if item.get('attempts') else 'pending'
        if (not verified and item.get('status')=='no_dedicated_channel' and item.get('absenceEvidence')
                and item.get('manuallyReviewed') is True):
            status='no_dedicated_channel'
        artist={'artist_id':gid,'artist_type':group.get('artistType','group'),'name':group['name'],
                'person_id':person_id,'related_person_ids':person_ids,'status':status,
                'last_checked_at':item.get('checkedAt'),'reason':item.get('reason') or (
                    'Dedicated channel identity and ownership evidence reviewed.' if verified else
                    'Search attempted; dedicated ownership or channel identity remains unverified.' if status=='unresolved' else
                    'Not yet searched in this survey.'),
                'attempts':item.get('attempts',[]),'candidates':item.get('candidates',[]),
                'rejected_candidates':item.get('rejectedCandidates',[]),'identity_rejected_sources':item.get('identityRejectedSources',[]),
                'unresolved_addresses':item.get('unresolvedAddresses',[]),
                'profile':{'name_ko':group.get('nameKo') or next((n for n in [group['name'],*group.get('aliases',[])] if re.search('[가-힣]',n)),None),
                    'name_en':group.get('nameEn') or next((n for n in [group['name'],*group.get('aliases',[])] if re.search('[a-zA-Z]',n)),None),
                    'legal_names':person.get('legalNames',{}),'birth_date':person.get('birthDate'),
                    'birth_date_precision':person.get('birthDatePrecision'),'nationalities':person.get('nationalities',[]),
                    'group_debut_date':group.get('debutDate') if group.get('artistType')!='solo' else None,
                    'solo_debut_date':group.get('soloDebutDate',group.get('debutDate')) if group.get('artistType')=='solo' else None,
                    'related_group_debuts':{id:groups.get(id,{}).get('debutDate') for id in dict.fromkeys([*group.get('relatedGroupIds',[]),*group.get('previousGroupIds',[])])},
                    'current_group_ids':group.get('relatedGroupIds',[]),'previous_group_ids':group.get('previousGroupIds',[]),
                    'agency':group.get('agency'),'activity_status':group.get('groupStatus','unknown'),
                    'sources':person.get('profileSources',{})},
                'profile_candidates':item.get('profileCandidates',[]),'profile_infobox_candidates':item.get('profileInfoboxCandidates',[])}
        artists.append(artist)
        sources={c.get('platformId'):c for c in group.get('channels',[])}
        for observed in [*resolved,*item.get('relationships',[])]:
            cid=observed.get('channelId')
            if not isinstance(cid,str) or not CHANNEL_ID.fullmatch(cid):continue
            source=sources.get(cid,{})
            verification=source.get('verification',{})
            channel=channels.setdefault(cid,{'channel_id':cid,'channel_name':observed.get('channelName') or source.get('name'),
                'channel_url':'https://www.youtube.com/channel/'+cid,'youtube_handle':observed.get('handle') or source.get('handle'),
                'verification_status':source.get('verificationStatus','UNVERIFIED'),
                'verification_source':verification.get('sources',[]) or ([verification['evidenceUrl']] if verification.get('evidenceUrl') else observed.get('sources',[])),
                'last_checked_at':observed.get('checkedAt',item.get('checkedAt')),'channel_types':[]})
            if reviewed_dedicated_channel(source,gid):
                channel.update(channel_name=observed.get('channelName') or source.get('name') or channel['channel_name'],
                    youtube_handle=observed.get('handle') or source.get('handle') or channel['youtube_handle'],
                    verification_status=source['verificationStatus'],
                    verification_source=verification.get('sources',[]) or [verification['evidenceUrl']])
            kind=observed.get('channelType','unresolved')
            if kind not in channel['channel_types']:channel['channel_types'].append(kind)
            relation={'artist_id':gid,'person_id':person_id,'channel_id':cid,'channel_type':kind}
            if relation not in relations:relations.append(relation)
    def counts(items):
        return {'total':len(items),**{status:sum(a['status']==status for a in items)
                 for status in ('verified','pending','unresolved','no_dedicated_channel')}}
    return {'schemaVersion':1,'updatedAt':research.get('checkedAt'),'scope':'All registered female groups, units, duos and solo artists; channel ownership and real-world activity remain separate.',
            'summary':{'all':counts(artists),'groups':counts([a for a in artists if a['artist_type']=='group']),
                       'solos':counts([a for a in artists if a['artist_type']=='solo']),
                       'duos':counts([a for a in artists if a['artist_type']=='duo'])},
            'artists':artists,'persons':list(persons.values()),'youtubeChannels':list(channels.values()),
            'artistChannelRelations':relations,'providerFailures':research.get('providerFailures',[]),'providerAccess':research.get('providerAccess',[])}


def export_survey(bundles,config_dir,output):
    from .publish import write
    path=Path(config_dir)/'channel-survey.json'
    research=json.loads(path.read_text(encoding='utf-8')) if path.exists() else {}
    report=build_survey(bundles,research)
    write(Path(output)/'artist-channel-survey.json',report)
    return report
