"""Review and register a dedicated YouTube source with recorded evidence."""
import argparse
import os
import re
from urllib.parse import urlparse
from .groups import save_bundle, youtube_identity
from .publish import DATA, now, write
from .registry import CONFIG, load_bundles, read
from .source_policy import public_artist, reviewed_dedicated_channel
from .youtube import YouTube
from .channel_registration import register_channel


def export_queue(output=DATA,config_dir=CONFIG):
    bundles,_,_,_=load_bundles(config_dir)
    path=output/'channel-candidates.json'
    candidates={}
    for item in (read(path).get('candidates',[]) if path.exists() else []):
        candidates.setdefault(item['groupId'],[]).append(item)
    queue=[]
    for group in bundles:
        if not group.get('supported',True) or not public_artist(group):
            continue
        dedicated=[source for source in group['channels'] if source.get('official') and
                   source.get('platform')=='youtube' and source.get('groupIds')==[group['id']] and not source.get('shared')]
        unresolved=[source for source in dedicated if not reviewed_dedicated_channel(source,group['id'])]
        if dedicated and not unresolved and not group.get('youtubeCandidates'):
            continue
        found=list(candidates.get(group['id'],[]))
        known={item.get('channelUrl') for item in found}
        found.extend(item for item in group.get('youtubeCandidates',[]) if item.get('channelUrl') not in known)
        stage='needs-verification' if dedicated else 'candidate' if found else 'no-candidate'
        queue.append({'id':group['id'],'name':group['name'],'stage':stage,'candidates':found,
                      'existing':[source.get('platformId') or source.get('handle') for source in dedicated],
                      'sources':[{'id':source['id'],'verificationStatus':source.get('verificationStatus','UNVERIFIED'),
                                  'verification':source.get('verification')} for source in unresolved]})
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
    parser.add_argument('--official-evidence',action='store_true',help='Operator confirms evidence page is artist/agency owned and links to this dedicated channel')
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
    if (args.evidence or args.official_evidence) and (evidence.scheme!='https' or not evidence.hostname or evidence.username or evidence.password):
        parser.error('Official ownership evidence requires a reviewed HTTPS evidence URL.')
    bundles,shared,_,_=load_bundles(CONFIG)
    observed={'channelId':channel['id'],'name':name,'description':snippet.get('description',''),
              'handle':snippet.get('customUrl'),'channelUrl':'https://www.youtube.com/channel/'+channel['id'], 'checkedAt':now()}
    ownership={'kind':'artist-site','groupId':args.group,'channelId':channel['id'],'dedicated':True,
               'evidenceUrl':args.evidence,'checkedAt':observed['checkedAt'][:10]} if args.official_evidence else None
    decision=register_channel(bundle,observed,bundles,[c for b in bundles for c in b['channels']]+shared,ownership,collection_enabled=True)
    if decision['decision']=='approve':bundle['collectionEnabled']=True
    save_bundle(bundle,create=False)
    print('Reviewed source saved in the local registry.' if decision['decision']=='approve' else 'Candidate saved for review: '+decision['reason'])


if __name__=='__main__':
    main()
