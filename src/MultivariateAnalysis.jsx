import React,{useState} from 'react';
import './multivariate.css';

const labels = {meanAge:'평균 나이',medianAge:'중앙 나이',yearsSinceDebut:'데뷔 후 연수',currentMembers:'현재 멤버 수',foreignNationalityShare:'외국 국적 비율',uploads30d:'30일 업로드',shortsShare:'쇼츠 비율',liveShare:'라이브 비율',musicShare:'음악 비율',creditDiversity:'크레딧 다양성',selfCreditShare:'자체 참여 비율'};
const label = name => labels[name] || name;
const colors = ['#60a5fa','#fb7185','#4ade80','#c084fc','#facc15','#2dd4bf'];
const pct = n => `${(n * 100).toFixed(1)}%`;

export default function MultivariateAnalysis({ data }) {
  const [kind, setKind] = useState('group');
  const [method, setMethod] = useState('pca');
  const [selected, setSelected] = useState(null);
  const result = data?.analyses?.[kind]?.[method];
  const points = result?.points || [];
  const extent = key => Math.max(1, ...points.map(p => Math.abs(p[key]))) * 1.12;
  const ex = extent('x'), ey = extent('y');
  const current = points.find(p => p.id === selected);
  const ranked = [...(result?.variables || [])].sort((a,b) => (b.contributions[0]+b.contributions[1])-(a.contributions[0]+a.contributions[1])).slice(0,8);
  const ready = result?.status === 'ready';
  const chooseKind = value => { setKind(value); setSelected(null); };
  return <section className="multivariate-panel" aria-label="다변량 탐색 분석">
    <h2>프로필의 공통점과 차이</h2>
    <p>나이·활동·구성·크레딧의 관측 특성을 함께 살펴봅니다. 인기도 순위나 우열을 나타내지 않으며, 군집 번호에는 순서가 없습니다.</p>
    <div className="mv-controls">
      <label>대상 <select value={kind} onChange={e => chooseKind(e.target.value)}><option value="group">그룹</option><option value="solo">솔로</option></select></label>
      <label>방법 <select value={method} onChange={e => setMethod(e.target.value)}><option value="pca">PCA · 수치 특성</option><option value="famd">FAMD · 수치와 범주</option></select></label>
    </div>
    <p className="mv-note">{data?.asOf ? `기준 ${data.asOf.slice(0,10)} · ` : ''}그룹과 솔로는 각각 계산합니다. 가까운 점은 포함된 특성이 비슷하다는 뜻입니다.</p>
    {!ready ? <p role="status">{!data ? '분석 데이터가 아직 준비되지 않았습니다.' : '분석에 필요한 관측 자료가 충분하지 않습니다.'} {result?.reason}<br />관측 행 {result?.sampleSize || 0}개</p> : <>
      <p>분석 대상 {result.sampleSize}개 · 축 1 {pct(result.axes[0].explainedVarianceRatio)} · 축 2 {pct(result.axes[1].explainedVarianceRatio)} 설명 · 나머지 차이는 이 평면에 보이지 않습니다.</p>
      <svg className="mv-scatter" viewBox="0 0 720 420" role="img" aria-label={`${kind === 'group' ? '그룹' : '솔로'} ${method.toUpperCase()} 산점도. 아래 대상 목록으로도 선택할 수 있습니다.`}>
        <line x1="50" x2="690" y1="200" y2="200" /><line x1="370" x2="370" y1="20" y2="380" />
        <text x="640" y="410">축 1</text><text x="12" y="22">축 2</text>
        {points.map(p => <g key={p.id} className="mv-point" role="button" tabIndex="0" aria-label={`${p.name}, ${p.cluster === null ? '군집 미지정' : `군집 ${p.cluster+1}`}`} onClick={() => setSelected(p.id)} onKeyDown={e => {if (e.key === 'Enter' || e.key === ' ') {e.preventDefault();setSelected(p.id);}}}>
          <title>{p.name} · {p.x.toFixed(2)}, {p.y.toFixed(2)}</title>
          <circle cx={370+p.x/ex*310} cy={200-p.y/ey*175} r={selected === p.id ? 7 : 4} fill={p.cluster === null ? '#94a3b8' : colors[p.cluster%colors.length]} stroke={selected === p.id ? 'white' : 'none'} />
        </g>)}
      </svg>
      <div className="mv-columns"><div><h3>축을 만드는 특성</h3><table><thead><tr><th>변수</th><th>축 1 기여</th><th>축 2 기여</th><th>축 1 적재량</th></tr></thead><tbody>{ranked.map(v => <tr key={v.name}><td>{label(v.name)}</td><td>{pct(v.contributions[0])}</td><td>{pct(v.contributions[1])}</td><td>{v.loadings[0].toFixed(2)}</td></tr>)}</tbody></table><p className="mv-note">기여도는 축마다 합계 100%입니다. 범주형 변수는 범주별로 표시합니다. 축의 양·음 방향은 좋고 나쁨을 의미하지 않습니다.</p></div>
      <div><h3>대상 선택</h3><label>아티스트 <select value={current?.id || ''} onChange={e => setSelected(e.target.value)}><option value="">선택하세요</option>{points.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>{current && <p><strong>{current.name}</strong> · 축 1 {current.x.toFixed(2)} · 축 2 {current.y.toFixed(2)} · {current.cluster === null ? '군집 미지정' : `군집 ${current.cluster+1}`}</p>}</div></div>
      <h3>탐색적 군집</h3>
      <p className="mv-note">표시된 두 축이 아닌 전체 전처리 특성에서 K-means를 계산합니다. 최소 12개 대상·군집당 3개·실루엣 0.25 이상일 때만 군집을 제안합니다.</p>
      {result.clustering.status !== 'ready' ? <p>신뢰할 만한 군집을 제안할 자료가 부족합니다. {result.clustering.reason}</p> : <><p>{result.clustering.selectedK}개 군집 · 실루엣 {result.clustering.silhouette.toFixed(3)}</p><div className="mv-clusters">{result.clustering.clusters.map(c => <details key={c.id}><summary><span style={{color:colors[c.id%colors.length]}}>●</span> 군집 {c.id+1} · {c.size}개</summary><ul>{c.features.map(f => <li key={f.name}>{label(f.name)} 평균 {f.mean.toFixed(2)} · 전체 대비 {f.standardizedDifference >= 0 ? '+' : ''}{f.standardizedDifference.toFixed(2)} 표준편차 (관측 {f.observed})</li>)}</ul><p>{c.members.map(id => points.find(p => p.id===id)?.name || id).join(' · ')}</p></details>)}</div></>}
      <details><summary>군집 수 평가와 계층 분석</summary><p>평균 연결법·유클리드 거리 계층 {result.clustering.hierarchy?.length || 0}회 병합. 선택한 군집은 K-means 결과입니다.</p><table><thead><tr><th>k</th><th>실루엣</th><th>군집 크기</th><th>조건 충족</th></tr></thead><tbody>{result.clustering.evaluations.map(e => <tr key={e.k}><td>{e.k}</td><td>{e.silhouette.toFixed(3)}</td><td>{e.sizes.join(' / ')}</td><td>{e.eligible ? '예' : '아니오'}</td></tr>)}</tbody></table>{result.clustering.hierarchy?.length > 0 && <><h4>계층 분석 · 마지막 10개 병합</h4><p className="mv-note">원점 번호 0부터 {points.length-1}까지는 아래 대상 순서이며, 병합 번호는 {points.length}부터 시작합니다. 거리가 커질수록 서로 다른 특성을 가진 묶음이 합쳐집니다.</p><table><thead><tr><th>병합 번호</th><th>왼쪽</th><th>오른쪽</th><th>거리</th><th>대상 수</th></tr></thead><tbody>{result.clustering.hierarchy.slice(-10).map((merge,i) => <tr key={i}><td>{points.length+Math.max(0,result.clustering.hierarchy.length-10)+i}</td><td>{points[merge.left]?.name || `병합 ${merge.left}`}</td><td>{points[merge.right]?.name || `병합 ${merge.right}`}</td><td>{merge.distance.toFixed(3)}</td><td>{merge.size}</td></tr>)}</tbody></table></>}</details>
    </>}
    {result && <details><summary>관측 범위와 제외 내역</summary><p>수치 열 관측률 70%·관측 8개 이상, 행 관측률 70%를 요구합니다. 남은 수치 결측은 중앙값으로 보완하며, 결측을 0으로 해석하지 않습니다. FAMD는 드문 범주의 영향을 빈도 가중치로 조정합니다.</p><p>제외 변수: {result.exclusions.columns.map(c => `${label(c.name)} (${c.reason})`).join(' · ') || '없음'}</p><p>제외 대상: {result.exclusions.rows.map(r => r.id).join(' · ') || '없음'}</p>{result.preprocessing?.filter(p => p.imputed).map(p => <p key={p.name}>{label(p.name)}: 결측 보완 {p.imputed}개</p>)}</details>}
  </section>;
}
