"""Optional, rate-limited dump research. Never promotes uncorroborated facts."""
import argparse
import json
import os
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import date
from pathlib import Path
from .activity import iso,stamp
from .publish import DATA,write
from .registry import load_bundles

BASE='https://api.tan-kim.com/namuwiki'
REQUEST_INTERVAL=2.1
CACHE_SECONDS=7*86400
RUN_INTERVAL=6*3600

class SourceUnavailable(RuntimeError):
    pass

class NamuwikiClient:
    def __init__(self,key,opener=urllib.request.urlopen,clock=time.monotonic,sleep=time.sleep):
        self._key=key;self.opener=opener;self.clock=clock;self.sleep=sleep;self.last_request=None

    def article(self,title):
        if not self._key:raise SourceUnavailable('missing-secret')
        if self.last_request is not None:
            self.sleep(max(0,REQUEST_INTERVAL-(self.clock()-self.last_request)))
        self.last_request=self.clock()
        url=BASE+'/article/'+urllib.parse.quote(title,safe='')+'?plain_text=true'
        request=urllib.request.Request(url,headers={'Authorization':'Bearer '+self._key,'User-Agent':'SONARProfileResearch/1.0'})
        try:
            with self.opener(request,timeout=20) as response:return json.load(response)
        except urllib.error.HTTPError as exc:
            raise SourceUnavailable('http-'+str(exc.code)) from None
        except (OSError,ValueError):raise SourceUnavailable('network-or-invalid-response') from None


def extract_candidates(text,solo):
    """Conservative labelled lines only; prose and group-member birthdays are ignored."""
    labels={'본명':'legalName','국적':'nationalitiesText','데뷔':'debutDateText','소속 그룹':'membershipText','소속사':'agencyText'}
    if solo:labels['출생']='birthDateText'
    values={}
    for label,key in labels.items():
        match=re.search(r'(?m)^\s*'+re.escape(label)+r'\s*[:：]\s*([^\n]{1,180})',text)
        if match:values[key]=match.group(1).strip()
    for field in ('birthDateText','debutDateText'):
        match=re.search(r'(?<!\d)(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일',values.get(field,''))
        if not match:continue
        try:value=date(*map(int,match.groups())).isoformat()
        except ValueError:continue
        values['birthDate' if field=='birthDateText' else 'soloDebutDate' if solo else 'groupDebutDate']=value
    return values


def collect(bundles,path,key,client=None,current=None,limit=12,evidence=()):
    current=time.time() if current is None else current
    path=Path(path)
    state=json.loads(path.read_text(encoding='utf-8')) if path.exists() else {'items':[],'cursor':0}
    state.update(updatedAt=iso(current),provider='namuwiki-search-mcp',sourceBase=BASE,
                 sourceLicense='CC BY-SA 2.0 KR (provider attribution)',canonicalWrites=False,requestsThisRun=0)
    if not key:
        state.update(status='source_unavailable',reason='missing-secret');write(path,state);return state
    last_attempt=stamp(state.get('lastAttemptAt'))
    if last_attempt is not None and 0<=current-last_attempt<RUN_INTERVAL:
        state['cacheReused']=True;write(path,state);return state
    state.update(lastAttemptAt=iso(current),cacheReused=False)
    client=client or NamuwikiClient(key)
    cached={item['artistId']:item for item in state['items']}
    members={m['id']:m for g in bundles for m in g.get('members',[])}
    independent={entry['artistId']:entry for entry in evidence}
    targets=[g for g in bundles if g.get('gender')=='girl']
    # Missing profiles first, then circulate across equally incomplete profiles.
    missing=lambda g:int(not g.get('debutDate'))+sum(not m.get('birthDate') for m in g.get('members',[]))+int(g.get('artistType')=='solo' and not g.get('relatedMemberIds'))
    targets.sort(key=lambda g:(-missing(g),g['id']))
    start=state.get('cursor',0)%max(1,len(targets));targets=targets[start:]+targets[:start]
    attempted=0;advanced=0;state.update(status='available',reason=None)
    for group in targets:
        previous=cached.get(group['id'],{})
        checked=stamp(previous.get('checkedAt'))
        if checked is not None and 0<=current-checked<CACHE_SECONDS:continue
        title=group.get('nameKo') or next((name for name in [group['name'],*group.get('aliases',[])] if re.search('[가-힣]',name)),group['name'])
        attempted+=1
        try:data=client.article(title)
        except SourceUnavailable as exc:
            state.update(status='source_unavailable',reason=str(exc));break
        if (not isinstance(data,dict) or type(data.get('found')) is not bool or data.get('error')
                or (data['found'] and (not isinstance(data.get('text'),str) or not isinstance(data.get('title'),str)))):
            state.update(status='source_unavailable',reason='invalid-response-shape');break
        values=extract_candidates(data.get('text','') if isinstance(data.get('text'),str) else '',group.get('artistType')=='solo') if data.get('found') else {}
        people=[members[mid] for mid in group.get('relatedMemberIds',[]) if mid in members]
        person=people[0] if len(people)==1 else {}
        canonical={'birthDate':person.get('birthDate'),'soloDebutDate':group.get('soloDebutDate',group.get('debutDate')) if group.get('artistType')=='solo' else None,
                   'groupDebutDate':group.get('debutDate') if group.get('artistType')!='solo' else None}
        comparisons={field:{'existingValue':canonical[field],'candidateValue':value,
                       'status':('matches_existing' if canonical[field]==value else 'conflict') if canonical[field] else 'needs_cross_check'}
                     for field,value in values.items() if field in canonical}
        independent_births=[];independent_sources=[]
        for entry in independent.get(group['id'],{}).get('profileCandidates',[]):
            for value in entry.get('fields',{}).get('P569',[]):
                if isinstance(value,dict) and value.get('precision')==11 and re.fullmatch(r'\+\d{4}-\d{2}-\d{2}T.*',value.get('time','')):
                    independent_births.append(value['time'][1:11]);independent_sources.append(entry['sourceUrl'])
        for entry in independent.get(group['id'],{}).get('profileInfoboxCandidates',[]):
            match=re.search(r'\{\{Birth date(?: and age)?\|(\d{4})\|(\d{1,2})\|(\d{1,2})',entry.get('fields',{}).get('birth_date',''),re.I)
            if match:
                try:independent_births.append(date(*map(int,match.groups())).isoformat());independent_sources.append(entry['sourceUrl'])
                except ValueError:pass
        if 'birthDate' in comparisons and independent_births:
            comparison=comparisons['birthDate']
            comparison['independentValues']=sorted(set(independent_births))
            if comparison['status']!='conflict':
                comparison['status']='corroborated_secondary' if set(independent_births)=={comparison['candidateValue']} else 'conflict'
        cross_sources=[link['url'] for link in group.get('officialLinks',[]) if link.get('platform')=='website']
        cross_sources += [source['sourceUrl'] for source in person.get('profileSources',{}).values() if isinstance(source,dict) and source.get('sourceUrl')]
        cached[group['id']]={'artistId':group['id'],'relatedPersonIds':group.get('relatedMemberIds',[]),'title':data.get('title',title),
            'found':bool(data.get('found')),'checkedAt':iso(current),'dataSource':data.get('source','dump-or-unknown'),
            'sourceUrl':'https://namu.wiki/w/'+urllib.parse.quote(data.get('title') or title,safe=''),
            'verificationStatus':'needs_cross_check','candidates':values,'comparisons':comparisons,'crossCheckSources':list(dict.fromkeys(cross_sources+independent_sources)),
            'reason':'Dump candidate only; verify artist identity, dates and current membership against independent/current official sources. Not found does not imply artist/channel absence.'}
        advanced+=1
        if attempted>=max(1,min(limit,30)):break
    state.update(items=list(cached.values()),cursor=(start+advanced)%max(1,len(targets)),requestsThisRun=attempted)
    write(path,state);return state

def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--limit',type=int,default=12);args=parser.parse_args()
    bundles,*_=load_bundles()
    survey=Path(__file__).resolve().parents[1]/'config/channel-survey.json'
    evidence=json.loads(survey.read_text(encoding='utf-8')).get('artists',[]) if survey.exists() else []
    result=collect(bundles,DATA/'namuwiki-research.json',os.environ.get('NAMUWIKI_API_KEY',''),limit=args.limit,evidence=evidence)
    print('Namuwiki:',result['status'],'requests:',result.get('requestsThisRun',0),'reason:',result.get('reason') or 'none')

if __name__=='__main__':main()
