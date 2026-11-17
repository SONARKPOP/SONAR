"""Four-state appearance links and an offline, non-public editing workflow."""
import argparse,json,re
from functools import lru_cache
from datetime import datetime,timezone
from pathlib import Path
from .name_matching import mention_spans,PARTICLES

ROOT=Path(__file__).resolve().parents[1]
DECISIONS=ROOT/'config'/'appearance-decisions.json'
STATES={'confirmed','inferred','needs_review','mention','other-person'}
TOKEN=re.compile(r'[^\W_]+',re.UNICODE)
RISKS=json.loads((ROOT/'config/name-risk.json').read_text(encoding='utf-8'))
EVERYDAY={a.casefold() for a in RISKS['everydayAliases']}
SHARED={a.casefold() for a in RISKS.get('sharedAliases',[])}

def group_ids(member):return {member.get('groupId'),*(h.get('groupId') for h in member.get('membershipHistory',[]))}-{None}
@lru_cache(maxsize=8)
def load_decisions(path=DECISIONS):
 if not Path(path).exists():return {}
 return json.loads(Path(path).read_text(encoding='utf-8')).get('decisions',{})
def decision_key(video_id,kind,artist_id):return f'{video_id}:{kind}:{artist_id}'
def is_mention(title,span):
 start,end=span['start'],span['end']
 before=title[max(0,start-45):start]
 if re.match(r'\s+(?:mentioned|reference)\b',title[end:],re.I):return True
 if re.search(r'(?:원곡(?:자)?\s*[:：]|original(?:ly)?(?: performed)? by\s*|cover of\s*)[^\]\)]*$',before,re.I):return True
 if re.search(r'(?:닮은꼴|리틀|망원동|해방촌|PC방)\s*$',before,re.I):return True
 if re.search(r'[“"「〈]\s*$',before) and re.match(r'\s*[”"」〉]\s*(?:Band|Live|M/?V|cover|라이브)',title[end:],re.I) and re.search(r'\w',before[:-1]):return True
 return bool(re.search(r'(?:곡|노래|커버)\s*$',title[end:end+6]))

class AppearanceResolver:
 def __init__(self,config):
  self.config=config;self.entities={};self.aliases={};self.first={};self.normalized={}
  for kind,rows in [('group',config.get('groups',[])),('person',config.get('members',[]))]:
   for row in rows:
    identity=(kind,row['id']);family=group_ids(row) if kind=='person' else {row['id'],*row.get('relatedGroupIds',[])}
    self.entities[identity]={'row':row,'groups':family}
    for alias in row.get('aliases',[]):
     if not alias.strip():continue
     self.aliases.setdefault(alias,set()).add(identity)
     self.normalized.setdefault(alias.casefold(),set()).add(identity)
     token=TOKEN.search(alias)
     if token:self.first.setdefault(token[0].casefold(),set()).add(alias)
 def matches(self,title):
  aliases=set()
  for token in TOKEN.finditer(title):
   value=token[0].casefold();aliases.update(self.first.get(value,()))
   for suffix in PARTICLES:
    if value.endswith(suffix):aliases.update(self.first.get(value[:-len(suffix)],()))
  result={}
  for alias in aliases:
   spans=mention_spans(title,alias)
   if spans:
    for entity in self.aliases[alias]:result.setdefault(entity,[]).extend(spans)
  return result
 def resolve(self,record,channel,decisions):
  title=record.get('title','');matches=self.matches(title)
  explicit_groups={identity[1] for identity,spans in matches.items() if identity[0]=='group'
                   and self.entities[identity]['row'].get('artistType')!='solo'
                   and not any(is_mention(title,s) for s in spans)
                   and not self.entities[identity]['row'].get('ambiguousName')
                   and any(title[s['start']:s['end']].casefold() not in {a.casefold() for a in self.entities[identity]['row'].get('ambiguousAliases',[])} for s in spans)}
  owners=set(channel.get('groupIds',[])) if channel.get('official') else set()
  for group in self.config.get('groups',[]):
   if group['id'] in owners:owners.update(group.get('relatedGroupIds',[]))
  reviewed=record.get('appearanceEvidence',[])
  links=[]
  for identity,spans in matches.items():
   kind,artist_id=identity;entry=self.entities[identity];row=entry['row'];family=entry['groups']
   spans=list({(s['start'],s['end']):s for s in spans}.values())
   names={s['text'].casefold() for s in spans}
   rivals={other for name in names for other in self.normalized.get(name,())
           if other!=identity and (other[0]==kind=='person' or not self.entities[other]['groups'].intersection(family))}
   shared=bool(names&SHARED)
   common=row.get('ambiguousName') or shared or bool(names&EVERYDAY) or any(a.casefold() in names for a in row.get('ambiguousAliases',[])) or any(len(n)==1 for n in names)
   context=bool(family & (explicit_groups|owners))
   if not context and kind=='person':
    context=any(other!=identity and other[0]=='person' and family.intersection(self.entities[other]['groups']) and not any(is_mention(title,s) for s in other_spans) for other,other_spans in matches.items())
   if common and not rivals and not shared and re.search(r'인터뷰|interview|직캠|fancam|게스트|guest|출연',title,re.I):context=True
   if names&EVERYDAY and not shared and family&owners and not family&explicit_groups and not any(title[max(0,s['start']-1):s['start']]=='#' for s in spans) and not re.search(r'인터뷰|interview|직캠|fancam|게스트|guest|출연',title,re.I):context=False
   from .activity_comparison import confirmed
   prior=next((e for e in reviewed if confirmed(e) and (e.get('memberId')==artist_id if kind=='person' else e.get('groupId')==artist_id)),None)
   if prior:state,reason='confirmed','existing-participation-evidence'
   elif all(is_mention(title,s) for s in spans):state,reason='mention','original-artist-or-comparison'
   elif (common or rivals) and (not context or kind=='person' and any(other[0]=='person' and family.intersection(self.entities[other]['groups']) for other in rivals)):state,reason='needs_review','shared-name' if rivals else 'everyday-name'
   else:state,reason='inferred','group-or-channel-context' if context else 'unambiguous-title-name'
   if kind=='group' and owners and artist_id not in record.get('groupIds',[]) and state=='inferred':
    state,reason='mention','official-owner-reference'
   decision=decisions.get(decision_key(record.get('platformId',record['id']),kind,artist_id))
   if decision:state,reason=decision['state'],decision.get('reason','editorial-decision')
   links.append({'artistType':kind,'artistId':artist_id,'state':state,'reason':reason,'matches':spans,
                 **({'evidenceUrl':decision['evidenceUrl']} if decision and decision.get('evidenceUrl') else {})})
   target_kind=decision.get('targetType','person') if decision else 'person'
   if decision and state=='other-person' and (target_kind,decision.get('targetId')) in self.entities:
    links.append({'artistType':target_kind,'artistId':decision['targetId'],'state':'inferred','reason':'editorial-other-person','matches':spans})
  prefix=str(record.get('platformId',record['id']))+':'
  for key,decision in decisions.items():
   if not key.startswith(prefix):continue
   kind,_,artist_id=key[len(prefix):].partition(':')
   if (kind,artist_id) in self.entities and not any(e['artistType']==kind and e['artistId']==artist_id for e in links):
    links.append({'artistType':kind,'artistId':artist_id,'state':decision['state'],'reason':decision.get('reason','editorial-decision'),'matches':[],**({'evidenceUrl':decision['evidenceUrl']} if decision.get('evidenceUrl') else {})})
  return links

_RESOLVERS=[]
def resolver_for(config):
 for resolver in _RESOLVERS:
  if resolver.config is config:return resolver
 resolver=AppearanceResolver(config);_RESOLVERS.insert(0,resolver);del _RESOLVERS[8:];return resolver

def apply_resolution(record,channel,config,decisions=None,resolver=None):
 decisions=load_decisions() if decisions is None else decisions
 links=(resolver or resolver_for(config)).resolve(record,channel,decisions)
 result={**record,'appearanceLinks':links}
 groups=set(record.get('groupIds',[]));members=set(record.get('memberIds',[]))
 owners=set(channel.get('groupIds',[])) if channel.get('official') else set()
 manual=record.get('memberTagging',{}).get('source')=='manual-override'
 for link in links:
  identity=link['artistId'];positive=link['state'] in ('confirmed','inferred')
  if link['artistType']=='group':
   if positive:groups.add(identity)
   elif identity not in owners and not manual:groups.discard(identity)
  elif positive:
   members.add(identity)
   linked_solo=any(g['id'] in groups and identity in g.get('relatedMemberIds',[]) for g in config.get('groups',[]))
   if not linked_solo and not groups.intersection((resolver or resolver_for(config)).entities[('person',identity)]['groups']):
    member=(resolver or resolver_for(config)).entities[('person',identity)]['row']
    from .affiliation_policy import career_group_ids
    dated=career_group_ids(member,record.get('publishedAt'),config.get('groups',[]))
    primary=member.get('groupId')
    history=member.get('membershipHistory',[])
    primary_relation=next((h for h in history if h.get('groupId')==primary),{})
    future_primary=str(primary_relation.get('startDate') or primary_relation.get('joinedAt') or '')[:10]>str(record.get('publishedAt',''))[:10]
    if primary and not future_primary:groups.add(primary)
    elif dated:groups.add(dated[-1])
    elif not history and primary:groups.add(primary)
  elif not manual:members.discard(identity)
  if link['state']=='confirmed' and link.get('evidenceUrl'):
   evidence={'memberId' if link['artistType']=='person' else 'groupId':identity,'role':'participant','source':'editorial-review','url':link['evidenceUrl']}
   result['appearanceEvidence']=[*result.get('appearanceEvidence',[]),evidence]
 result['groupIds']=sorted(groups);result['memberIds']=sorted(members)
 return result

def review_items(record):
 return [{'key':decision_key(record['platformId'],e['artistType'],e['artistId']),'videoId':record['platformId'],
          'title':record.get('title',''),'channelId':record.get('channelId'),'publishedAt':record.get('publishedAt'),**e}
         for e in record.get('appearanceLinks',[]) if e['state'] in ('needs_review','mention','other-person') or not record.get('groupIds')]

def main():
 parser=argparse.ArgumentParser(description='출연 판별 검토 목록 · 공개 서비스에서 편집하지 않습니다.')
 sub=parser.add_subparsers(dest='command',required=True)
 listing=sub.add_parser('list');listing.add_argument('--file',default=str(ROOT/'public/data/appearance-review.json'));listing.add_argument('--state',default='needs_review')
 decide=sub.add_parser('decide');decide.add_argument('key');decide.add_argument('--state',required=True,choices=sorted(STATES-{'needs_review'}));decide.add_argument('--reason',required=True);decide.add_argument('--evidence-url');decide.add_argument('--target-id');decide.add_argument('--target-type',choices=['person','group'],default='person');decide.add_argument('--decisions',default=str(DECISIONS))
 args=parser.parse_args()
 if args.command=='list':
  data=json.loads(Path(args.file).read_text(encoding='utf-8'));print(json.dumps([r for r in data.get('items',[]) if r['state']==args.state],ensure_ascii=False,indent=2));return
 if args.state=='confirmed' and not (args.evidence_url or '').startswith('https://'):parser.error('출연 확인에는 실제 근거 HTTPS URL이 필요합니다.')
 if args.state=='other-person':
  from .registry import load_config
  config=load_config();known={r['id'] for r in config['members' if args.target_type=='person' else 'groups']}
  if args.target_id not in known:parser.error('다른 인물/그룹 처리에는 등록된 대상 ID가 필요합니다.')
 from .publish import write
 data=load_decisions(args.decisions);data[args.key]={'state':args.state,'reason':args.reason,'checkedAt':datetime.now(timezone.utc).isoformat(),**({'evidenceUrl':args.evidence_url} if args.evidence_url else {}),**({'targetId':args.target_id,'targetType':args.target_type} if args.target_id else {})}
 write(args.decisions,{'decisions':data});print('검토 결과 저장. python -m collectors.groups sync 로 반영하세요.')

if __name__=='__main__':main()
