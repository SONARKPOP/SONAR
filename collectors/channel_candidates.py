"""Daily bounded Wikipedia/Wikidata discovery. Candidates never enter live registry."""
import argparse
import json
import re
import time
import urllib.parse
import urllib.request
from .publish import DATA, write, now
from .registry import load_config
from .activity import eligible_group, stamp
from .profile_links import profile_candidates, wikipedia_group_titles, INDEX_URL

def fetch(url):
    request=urllib.request.Request(url,headers={'User-Agent':'SONARChannelReview/1.0 (https://github.com/SONARKPOP/SONAR)'})
    with urllib.request.urlopen(request,timeout=20) as response:
        return response.read().decode('utf-8') if url==INDEX_URL else json.load(response)

def discover(config,output=DATA,fetcher=fetch,current=None):
    current=time.time() if current is None else current
    path=output/'channel-candidates.json'
    state=json.loads(path.read_text(encoding='utf-8')) if path.exists() else {'candidates':[],'cursor':0,'newArtistCandidates':[]}
    if state.get('generatorVersion')==2 and current-(stamp(state.get('lastAttemptAt') or state.get('updatedAt')) or 0)<86400:return state
    state['lastAttemptAt']=now()
    groups=[g for g in config['groups'] if eligible_group(g)]
    start=state.get('cursor',0)%max(1,len(groups));selected=(groups+groups)[start:start+15]
    titles={next((a for a in [g.get('nameEn'),g['name'],*g['aliases']] if a and a.isascii()),g['name']):g['id'] for g in selected}
    try:
        endpoint='https://en.wikipedia.org/w/api.php?'+urllib.parse.urlencode({'action':'query','format':'json','prop':'pageprops','redirects':1,'titles':'|'.join(titles)})
        pages=fetcher(endpoint).get('query',{}).get('pages',{}).values()
        qids={p.get('pageprops',{}).get('wikibase_item'):p.get('title') for p in pages if p.get('pageprops',{}).get('wikibase_item')}
        candidates={(v['groupId'],v['channelUrl']):v for v in state['candidates']}
        if qids:
            entities=fetcher('https://www.wikidata.org/w/api.php?'+urllib.parse.urlencode({'action':'wbgetentities','format':'json','props':'claims','ids':'|'.join(qids)})).get('entities',{})
            for qid,entity in entities.items():
                for claim in entity.get('claims',{}).get('P2397',[]):
                    cid=claim.get('mainsnak',{}).get('datavalue',{}).get('value','')
                    if not re.fullmatch(r'UC[\w-]{22}',cid):continue
                    gid=titles.get(qids[qid])
                    if gid:candidates[(gid,cid)]={'groupId':gid,'channelId':cid,'channelUrl':'https://www.youtube.com/channel/'+cid,'verificationStatus':'UNVERIFIED','sourceUrl':'https://www.wikidata.org/wiki/'+qid,'foundAt':now(),'reason':'Wikidata P2397 candidate; dedicated-channel and official-source review required.'}
        html=fetcher('https://en.wikipedia.org/w/api.php?'+urllib.parse.urlencode({'action':'parse','format':'json','page':'List of South Korean girl groups','prop':'text'})).get('parse',{}).get('text',{}).get('*','')
        known={a.casefold() for g in groups for a in [g['name'],*g['aliases']]}
        state.update(generatorVersion=2,candidates=list(candidates.values()),newArtistCandidates=[{'title':title,'sourceUrl':'https://en.wikipedia.org/wiki/List_of_South_Korean_girl_groups','verificationStatus':'UNVERIFIED','reason':'Group-bearing list/table entry; nationality, group type and debut date require review.'} for title in wikipedia_group_titles(html) if title.casefold() not in known],cursor=(start+len(selected))%max(1,len(groups)),updatedAt=now(),error=None)
    except (OSError,ValueError,KeyError) as exc:
        state['error']=type(exc).__name__;state['lastAttemptAt']=now()
    # Independent provider failure must not discard successful discovery.
    try:
        html=fetcher(INDEX_URL)
        if isinstance(html,str):
            found=profile_candidates(html,groups)
            merged={(v['groupId'],v['channelUrl']):v for v in state['candidates']}
            merged.update({(v['groupId'],v['channelUrl']):v for v in found})
            state['candidates']=list(merged.values())
    except (OSError,ValueError):state['profileIndexError']='unavailable'
    write(path,state);return state

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.parse_args()
    discover(load_config())
