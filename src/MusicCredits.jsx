import React, {useMemo, useState} from 'react';
import './MusicCredits.css';

export function musicSongRows(data, query='') {
  const persons=new Map((data?.persons||[]).map(p=>[p.id,p]));
  const recordings=new Map((data?.recordings||[]).map(r=>[r.id,r]));
  const works=new Map((data?.works||[]).map(w=>[w.id,w]));
  const albums=new Map((data?.albums||[]).map(a=>[a.id,a]));
  const needle=query.trim().toLocaleLowerCase();
  return (data?.songs||[]).map(song=>{
    const work=works.get(song.workId);
    const recs=song.recordingIds.map(id=>recordings.get(id)).filter(Boolean);
    const appearances=(data?.tracks||[]).filter(t=>song.recordingIds.includes(t.recordingId));
    const roles={};
    for(const role of ['lyricist','composer','arranger','producer']) {
      const entities=role==='lyricist'||role==='composer'?[work]:recs;
      const roleIds=[...new Set(entities.flatMap(e=>e?.roles?.[role]||[]))];
      roles[role]=roleIds.length?roleIds.map(id=>persons.get(id)?.name||id):null;
    }
    const releases=[...new Set(appearances.map(t=>t.albumId))].map(id=>albums.get(id)).filter(Boolean);
    return {...song,roles,releases,recordings:recs,work};
  }).filter(row=>!needle||[row.title,...Object.values(row.roles).flat(),...row.releases.map(a=>a.title)].filter(Boolean).join(' ').toLocaleLowerCase().includes(needle));
}

export default function MusicCredits({data,catalog}) {
  const [query,setQuery]=useState('');
  const rows=useMemo(()=>musicSongRows(data,query).filter(song=>!catalog||song.artistIds.some(id=>(catalog.groups||catalog.artists||[]).some(a=>a.id===id))),[data,query,catalog]);
  const artists=new Map((catalog?.groups||catalog?.artists||[]).map(a=>[a.id,a.name]));
  const sources=new Map((data?.sources||[]).map(s=>[s.id,s]));
  return <section className="music-credits" aria-label="Music credits">
    <header><h2>음반 · 곡 · 크레딧</h2><p>작품과 녹음 ID를 기준으로 묶어, 같은 곡의 재발매를 중복 집계하지 않습니다.</p></header>
    <div className="music-credits-coverage"><strong>부분 수집 · {data?.artists?.length||0} 아티스트 / {data?.songs?.length||0} 곡</strong><p>{data?.coverage?.note||'아직 수집된 음악 메타데이터가 없습니다.'}</p><p>미수집 항목은 ‘미확인’으로 표시합니다. 이름만으로 작가와 아티스트를 연결하지 않습니다.</p></div>
    <label className="music-credits-search">곡 · 음반 · 참여자 검색<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="곡명 또는 작가명"/></label>
    <p aria-live="polite">{rows.length} 곡</p>
    <div className="music-credits-grid">{rows.map(song=><article key={song.id}>
      <h3>{song.title}</h3>{song.releaseContext&&<p>{song.promotionRole==='title'?'타이틀곡 1차 수집':'타이틀/후속곡 1차 수집'} · {song.releaseContext.title}{song.releaseContext.releaseDate?' · '+song.releaseContext.releaseDate:''}</p>}<p>{song.artistIds.map(id=>artists.get(id)||id).join(', ')}</p>
      <dl>{[['lyricist','작사'],['composer','작곡'],['arranger','편곡'],['producer','프로듀서']].map(([role,label])=><React.Fragment key={role}><dt>{label}</dt><dd>{song.roles[role]?.join(', ')||'미확인'}</dd></React.Fragment>)}</dl>
      <details><summary>수록 음반 {song.releases.length}개 · 녹음 {song.recordings.length}개</summary><ul>{song.releases.map(album=><li key={album.id}>{album.title} · {album.releaseDate||'발매일 미확인'}{album.country?' · '+album.country:''}{!album.tracklistComplete?' · 일부 트랙 수집':''}</li>)}</ul><p>ISRC: {song.recordings.flatMap(r=>r.isrcs||[]).join(', ')||'미확인'} · ISWC: {song.work?.iswcs?.join(', ')||'미확인'}</p></details>
      <footer>{song.sourceIds.map(id=>{const source=sources.get(id);return source&&/^https:\/\/(musicbrainz\.org|namu\.wiki|music\.bugs\.co\.kr)\//.test(source.url)?<a key={id} href={source.url} target="_blank" rel="noreferrer">{source.publisher} · {source.verification==='namuwiki_collected'?'나무위키 1차 수집':source.verification==='retailer_published_credits'?'유통사 게재 크레딧':'공개 메타데이터'} · {source.retrievedAt}</a>:null;})}<span>출처별 수집 자료 · 공식 검증 아님</span></footer>
    </article>)}</div>
    {!rows.length&&<p>조건에 맞는 수집 곡이 없습니다.</p>}
  </section>;
}
