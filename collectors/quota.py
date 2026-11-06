"""Persistent rolling-24h API limits and round-robin live discovery.

Limits refer to the project budget, not browser visitors or their group filters.
search.list has a separate quota bucket in the current official documentation:
https://developers.google.com/youtube/data/determine_quota_cost
"""
import argparse
import json
import math
import time
from pathlib import Path
from .publish import DATA, write

class BudgetExceeded(RuntimeError):
    pass

class QuotaGuard:
    def __init__(self,path,search_day=80,read_day=8000,search_run=20,read_run=600,clock=time.time):
        self.path=Path(path)
        self.clock=clock
        self.limits={'search':(search_day,search_run),'read':(read_day,read_run)}
        self.run={'search':0,'read':0}
        if self.path.exists():
            self.state=json.loads(self.path.read_text(encoding='utf-8'))
            if not isinstance(self.state,dict) or not isinstance(self.state.get('calls',{}),dict):
                raise ValueError('Invalid quota state; inspect collection-state.json before collecting.')
        else:
            self.state={'schemaVersion':1,'calls':{},'discoveryCursor':0}
        for bucket in self.limits:
            history=self.state.setdefault('calls',{}).setdefault(bucket,[])
            if not isinstance(history,list) or any(not isinstance(x,(int,float)) for x in history):
                raise ValueError('Invalid quota history; refusing to reset usage automatically.')

    def remaining(self,bucket):
        current=self.clock()
        history=self.state['calls'][bucket]
        # Retain future-dated records too: a clock change must not reset the budget.
        self.state['calls'][bucket]=[stamp for stamp in history if stamp>current-86400]
        daily,per_run=self.limits[bucket]
        return max(0,min(daily-len(self.state['calls'][bucket]),per_run-self.run[bucket]))

    def consume(self,resource):
        bucket='search' if resource=='search' else 'read'
        if not self.remaining(bucket):
            raise BudgetExceeded(f'{bucket} API budget reached; previous published data is retained.')
        self.state['calls'][bucket].append(self.clock())
        self.run[bucket]+=1
        # Persist BEFORE network traffic, including retries and failed API calls.
        write(self.path,self.state)

    def discovery_sources(self,sources):
        if not sources:return []
        count=min(len(sources),self.remaining('search'))
        start=int(self.state.get('discoveryCursor',0))%len(sources)
        selected=[sources[(start+i)%len(sources)] for i in range(count)]
        return selected

    def advance_discovery(self,count,total):
        if total:self.state['discoveryCursor']=(int(self.state.get('discoveryCursor',0))+count)%total
        write(self.path,self.state)

def estimate(config,records=90,pages=1):
    channels=[c for c in config['channels'] if c.get('collectionEnabled',True)]
    official=sum(bool(c['official']) for c in channels)
    return {'supportedArtists':len(config['groups']),'collectingArtists':len(config.get('collectionGroupIds',[])),
            'enabledChannels':len(channels),'officialChannels':official,
            'legacySearchCallsPerDay':official*2*4,
            'plannedSearchCallsPerDay':min(official,20)*4,
            'readUnitsPerDayEstimate':4*(sum(c.get('collectionPages', pages) + (c.get('archivePages', 0) if not c.get('official') else 0) for c in channels)+math.ceil(records/50))+72*math.ceil(min(records,50)/50),
            'limits':{'searchRolling24h':80,'readRolling24h':8000,'searchPerRun':20,'readPerRun':600},
            'notes':'Read estimate assumes one batch of live candidates per refresh and cached channel identities; API retries and new upload batches can add calls.'}

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--estimate',action='store_true')
    args=parser.parse_args()
    from .registry import load_config
    print(json.dumps(estimate(load_config(),len(list((DATA/'content').glob('*.json')))),ensure_ascii=False,indent=2))

if __name__=='__main__':main()
