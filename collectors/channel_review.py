"""Review and register a dedicated YouTube source with recorded evidence."""
import argparse
import os
import re
from urllib.parse import urlparse
from .groups import save_bundle, youtube_identity
from .publish import DATA, now, write
from .registry import CONFIG, load_bundles, read
from .youtube import YouTube


def export_queue(output=DATA,config_dir=CONFIG):
    bundles,_,_,_=load_bundles(config_dir)
    path=output/'channel-candidates.json'
    candidates={}
    for item in (read(path).get('candidates',[]) if path.exists() else []):
        candidates.setdefault(item['groupId'],[]).append(item)
    queue=[]
    for group in bundles:
        if not group.get('supported',True):
            continue
        dedicated=[source for source in group['channels'] if source.get('official') and
                   source.get('platform')=='youtube' and source.get('groupIds')==[group['id']]]
        if any(source.get('verification',{}).get('evidenceUrl') for source in dedicated):
            continue
        found=candidates.get(group['id'],[])
        stage='needs-source' if dedicated else 'candidate' if found else 'no-candidate'
        queue.append({'id':group['id'],'name':group['name'],'stage':stage,'candidates':found,
                      'existing':[source.get('platformId') or source.get('handle') for source in dedicated]})
    write(output/'channel-review.json',{'updatedAt':now(),'items':queue})
    return queue


def channel_identity(api,source):
    identity=youtube_identity(source)
    params={'id':identity['platformId']} if 'platformId' in identity else {'forHandle':identity['handle']}
    results=api.get('channels',part='snippet,contentDetails',**params).get('items',[])
    if len(results)!=1:
        raise ValueError('The YouTube link did not resolve to one channel.')
    return identity,results[0]


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('group',nargs='?')
    parser.add_argument('source',nargs='?')
    parser.add_argument('--evidence',help='Reviewed official or editorial source URL')
    parser.add_argument('--official-evidence',action='store_true')
    parser.add_argument('--apply',action='store_true')
    args=parser.parse_args()
    if not args.group and not args.source:
        queue=export_queue()
        print(f'{len(queue)} artists need source review.')
        return
    if not (args.group and args.source):
        parser.error('Provide both an artist ID and a YouTube channel URL, handle, or UC ID.')
    bundle_path=CONFIG/'groups'/f'{args.group}.json'
    if not re.fullmatch('[a-z0-9-]+',args.group) or not bundle_path.is_file():
        parser.error('Unknown artist ID.')
    bundle=read(bundle_path)
    identity,channel=channel_identity(YouTube(os.environ.get('YOUTUBE_API_KEY','')),args.source)
    snippet=channel['snippet']
    name=snippet['title']
    print(f"{name} · https://www.youtube.com/channel/{channel['id']}")
    print(snippet.get('description','')[:350])
    if not args.apply:
        return
    evidence=urlparse(args.evidence or '')
    if evidence.scheme!='https' or not evidence.hostname or evidence.username or evidence.password:
        parser.error('--apply requires a reviewed HTTPS evidence URL.')
    if re.search(r'\b(?:fan channel|fan archive|topic)\b',name,re.I):
        parser.error('Fan, archive and Topic channels cannot be registered.')
    existing=[entry for entry in bundle['channels'] if entry.get('platformId')==channel['id'] or
              (identity.get('handle') and entry.get('handle','').casefold()==identity['handle'].casefold())]
    if not existing and any(entry.get('official') for entry in bundle['channels']):
        parser.error('Review existing official sources before adding another one.')
    record=dict(existing[0]) if existing else {'id':args.group+'-official','platform':'youtube',
            'official':True,'groupIds':[args.group],'collectionEnabled':True}
    record.update(identity, platformId=channel['id'],name=name,expectedChannelNames=[name],
        verificationStatus='VERIFIED' if args.official_evidence else 'SUPPORTED',
        verification={'checkedAt':now()[:10],'evidenceUrl':args.evidence,'basis':'Operator reviewed channel identity and dedicated artist ownership.'})
    bundle['channels']=[entry for entry in bundle['channels'] if entry['id']!=record['id']]+[record]
    bundle['collectionEnabled']=True
    save_bundle(bundle,create=False)
    print('Reviewed source saved in the local registry.')


if __name__=='__main__':
    main()
