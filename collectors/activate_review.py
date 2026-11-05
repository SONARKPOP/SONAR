"""Promote a successful API review snapshot using conservative metadata rules."""
import argparse
import copy
from collections import Counter
from pathlib import Path
from .registry import load_config, read
from .publish import ROOT, DATA, publish, write, now
from .youtube import infer_members, classify, read_overrides

def activate(stage, output=DATA, merge=False):
    stage=Path(stage)
    report=read(stage/'report.json')
    if report.get('status') != 'api-success-review-pending':
        raise ValueError('A successful API snapshot is required.')
    config=copy.deepcopy(load_config())
    previous=read(stage/'data/catalog.json')
    sources={c['id']:c for c in config['channels']}
    for old in previous['channels']:
        source=sources.get(old['id'])
        if not source or (source.get('handle') or '').casefold() != (old.get('handle') or '').casefold():
            raise ValueError('Channel configuration changed; collect another review snapshot.')
        for field in ('platformId','uploadsPlaylistId'):
            if old.get(field):source[field]=old[field]
    records=[]
    edits=[]
    overrides=read_overrides()['videos']
    for path in sorted((stage/'data/content').glob('*.json')):
        record=read(path)
        if record.get('demo'):
            raise ValueError('Cannot promote demo content as actual API data.')
        source=sources.get(record['channelId'])
        if not source or not source['official'] or not source.get('platformId'):
            raise ValueError('Review snapshot contains an unexpected source.')
        before={'memberIds':record['memberIds'],'category':record['category'],'subtypes':record['subtypes']}
        record['groupIds']=list(source['groupIds'])
        snippet={'title':record['title'],'description':record.get('description','')}
        record['memberIds']=infer_members(snippet,set(record['groupIds']),config)
        category,subtype,short=classify(record['title'],record.get('description',''),source['official'])
        record.update(category=category,subtypes=[subtype],tags=[subtype],format='short' if short else 'live' if record.get('actualStartTime') or record.get('liveStatus') in ('live','upcoming','ended') else 'video')
        override=overrides.get(record['platformId'],{})
        if set(override)-{'groupIds','memberIds','category','subtypes','tags','format','externalType','programId','programName','contentTypes','ownType'}:
            raise ValueError('Unsupported editorial override fields.')
        record.update(override)
        record['memberTagging']={'policy':'title-only-v1','source':'manual-override' if 'memberIds' in override else 'title' if record['memberIds'] else 'unclassified','appearanceVerified':False}
        record['metadataReview']={'reviewedAt':now(),'level':'conservative-metadata','fullVideoWatched':False}
        # Importing an old snapshot cannot freshly confirm a live/upcoming status.
        if record.get('liveStatus') in ('live','upcoming'):
            record['liveStatus']='unconfirmed'
        valid_groups={g['id'] for g in config['groups']}
        valid_members={m['id']:m['groupId'] for m in config['members']}
        if set(record['groupIds'])-valid_groups or any(m not in valid_members or valid_members[m] not in record['groupIds'] for m in record['memberIds']):
            raise ValueError('Invalid group/member override.')
        if record['category'] not in config['taxonomy']['categories'] or record['format'] not in config['taxonomy']['formats']:
            raise ValueError('Invalid content classification override.')
        records.append(record)
        after={'memberIds':record['memberIds'],'category':record['category'],'subtypes':record['subtypes']}
        if before!=after:edits.append({'id':record['id'],'before':before,'after':after})
    if len(records)!=report['videoCount'] or len({v['id'] for v in records})!=len(records) or not records:
        raise ValueError('Snapshot count or canonical ID integrity failed.')
    if merge:
        retained={}
        for path in (Path(output)/'content').glob('*.json'):
            old=read(path)
            if not old.get('demo') and old['channelId'] in sources and set(old['groupIds']).issubset({g['id'] for g in config['groups']}):
                old['memberIds']=infer_members({'title':old['title'],'description':old.get('description','')},set(old['groupIds']),config)
                old.update(overrides.get(old['platformId'],{}))
                if old.get('liveStatus') in ('live','upcoming'):old['liveStatus']='unconfirmed'
                retained[old['id']]=old
        retained.update({v['id']:v for v in records})
        records=list(retained.values())
    publish(records,config,output=output,demo=False)
    result={'activatedAt':now(),'sourceCollectedAt':report['checkedAt'],'videoCount':len(records),'byGroup':dict(Counter(g for v in records for g in v['groupIds'])),'memberTaggedVideos':sum(bool(v['memberIds']) for v in records),'unclassifiedMemberVideos':sum(not v['memberIds'] for v in records),'policy':'Title-only or manual member tags; description boilerplate ignored. Full-video appearance not verified.','changes':edits}
    return result

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('stage',type=Path)
    parser.add_argument('--merge',action='store_true',help='Retain older actual videos; never retain demo content.')
    args=parser.parse_args()
    try:
        result=activate(args.stage,merge=args.merge)
        write(ROOT/'docs/ACTUAL_DATA_REVIEW.json',result)
        print(f"Activated {result['videoCount']} actual videos: {result['memberTaggedVideos']} with title member tags; {result['unclassifiedMemberVideos']} unclassified. No API calls made.")
    except (ValueError,OSError,KeyError) as exc:
        parser.exit(1,f'{exc}\n')

if __name__=='__main__':main()
