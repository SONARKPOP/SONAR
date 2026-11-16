"""Evidence-first music catalog. Offline build by default; optional MB cache refresh."""
import argparse
import hashlib
import json
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
ROLES = ('lyricist', 'composer', 'arranger', 'producer')

class MusicBrainzClient:
    """One request per second, persistent cache, meaningful contact configured by operator."""
    def __init__(self, cache_dir, user_agent):
        if not user_agent or '(' not in user_agent:
            raise ValueError('Configure a contact-bearing MUSICBRAINZ_USER_AGENT')
        self.cache_dir=Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.user_agent=user_agent
        self.last_request=0

    def get(self, entity, mbid, includes='', refresh=False):
        import uuid
        if entity not in ('release','recording','work','artist'):
            raise ValueError('Unsupported MusicBrainz entity')
        uuid.UUID(mbid)
        from urllib.parse import urlencode
        url=f'https://musicbrainz.org/ws/2/{entity}/{mbid}?'+urlencode({'fmt':'json','inc':includes})
        path=self.cache_dir/(hashlib.sha256(url.encode()).hexdigest()+'.json')
        if path.exists() and not refresh:
            return json.loads(path.read_text(encoding='utf-8'))['payload']
        time.sleep(max(0,1.05-(time.monotonic()-self.last_request)))
        self.last_request=time.monotonic()
        with urlopen(Request(url,headers={'User-Agent':self.user_agent,'Accept':'application/json'}),timeout=30) as response:
            payload=json.load(response)
        path.write_text(json.dumps({'url':url,'retrievedAt':datetime.now(timezone.utc).isoformat(),'payload':payload},ensure_ascii=False),encoding='utf-8')
        return payload


def build_catalog(seed, registry_ids):
    """Validate curated evidence; never link people by name or merge songs by title."""
    for artist in seed.get('artists',[]):
        if artist['artistId'] not in registry_ids:
            raise ValueError('Unknown registry artist: '+artist['artistId'])
    sources={row['id'] for row in seed.get('sources',[])}
    if len(sources)!=len(seed.get('sources',[])):
        raise ValueError('Duplicate source ID')
    tables={key:seed.get(key,[]) for key in ('albums','tracks','recordings','works','persons','songs')}
    for rows in tables.values():
        for row in rows:
            if not row.get('sourceIds') or any(s not in sources for s in row['sourceIds']):
                raise ValueError('Missing or unknown evidence source')
            if any(a not in registry_ids for a in row.get('artistIds',[])):
                raise ValueError('Unknown entity artist')
    indexes={}
    for key,rows in tables.items():
        indexes[key]={row['id']:row for row in rows}
        if len(indexes[key])!=len(rows):
            raise ValueError('Duplicate '+key+' ID')
    for track in tables['tracks']:
        if track['albumId'] not in indexes['albums'] or track['recordingId'] not in indexes['recordings']:
            raise ValueError('Dangling track relation')
    for recording in tables['recordings']:
        if recording.get('workId') and recording['workId'] not in indexes['works']:
            raise ValueError('Dangling work relation')
    for song in tables['songs']:
        if song.get('workId') and song['workId'] not in indexes['works']:
            raise ValueError('Dangling song work')
        if any(r not in indexes['recordings'] for r in song['recordingIds']):
            raise ValueError('Dangling song recording')
    for row in tables['works']+tables['recordings']:
        allowed=('lyricist','composer') if row['id'] in indexes['works'] else ('arranger','producer')
        for role,people in row.get('roles',{}).items():
            if role not in allowed or (people is not None and (not isinstance(people,list) or len(people)!=len(set(people)))):
                raise ValueError('Invalid role layer or duplicate contributor')
            if role not in ROLES or (people is not None and any(p not in indexes['persons'] for p in people)):
                raise ValueError('Invalid person-role relation')
    return {'schemaVersion':1,'generatedAt':datetime.now(timezone.utc).isoformat(),
            'coverage':seed['coverage'],'sources':seed['sources'],'artists':seed['artists'],
            **tables,'review':seed.get('review',[])}


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--refresh-cache',action='store_true',help='Fetch curated MB release records; no automatic identity promotion')
    args=parser.parse_args()
    seed=json.loads((ROOT/'config/music-credits.json').read_text(encoding='utf-8-sig'))
    if args.refresh_cache:
        import os
        ua=os.environ.get('MUSICBRAINZ_USER_AGENT')
        if not ua:
            parser.error('MUSICBRAINZ_USER_AGENT with operator contact is required for network refresh')
        client=MusicBrainzClient(ROOT/'work/musicbrainz-cache',ua)
        for album in seed['albums']:
            if not album.get('externalIds',{}).get('musicbrainzRelease'):
                continue
            payload=client.get('release',album['externalIds']['musicbrainzRelease'],'recordings+artist-credits',refresh=True)
            expected={a['externalIds']['musicbrainzArtist'] for a in seed['artists'] if a['artistId'] in album['artistIds']}
            actual={a['artist']['id'] for a in payload.get('artist-credit',[]) if isinstance(a,dict) and 'artist' in a}
            if not expected.issubset(actual):
                raise ValueError('Release artist identity mismatch; cached for review only')
    registry={json.loads(p.read_text(encoding='utf-8-sig'))['id'] for p in (ROOT/'config/groups').glob('*.json')}
    result=build_catalog(seed,registry)
    (ROOT/'public/data/music-credits.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

if __name__=='__main__':
    main()
