"""Deterministic, coverage-gated PCA/FAMD and exploratory clustering (NumPy only)."""
import argparse
import json
import math
from pathlib import Path
import numpy as np

SEED=42
POLICY={'minRows':8,'minColumnCoverage':.7,'minRowCoverage':.7,'minNumericColumns':2,'minClusterRows':12,'minClusterSize':3,'minSilhouette':.25,'maxCategories':12,'maxCategoryFraction':.5,'maxClusterRows':500}

def number(value):
    return isinstance(value,(int,float)) and not isinstance(value,bool) and math.isfinite(value)

def encode_categories(values):
    levels=sorted(set(values))
    g=np.array([[float(v==level) for level in levels] for v in values])
    p=g.mean(axis=0)
    return (g-p)/np.sqrt(p),levels

def decompose(x):
    x=np.asarray(x,dtype=float)
    u,s,vt=np.linalg.svd(x,full_matrices=False)
    # Fix sign indeterminacy by anchoring each axis's largest absolute coefficient.
    for j in range(len(s)):
        if vt[j,np.argmax(np.abs(vt[j]))]<0:
            vt[j]*=-1;u[:,j]*=-1
    eigen=s*s/len(x)
    return {'scores':u*s,'eigenvalues':eigen,'vectors':vt.T,'loadings':vt.T*np.sqrt(eigen),'contributions':vt.T**2}

def silhouette(dist,labels):
    scores=[]
    for i,label in enumerate(labels):
        same=np.where(labels==label)[0];same=same[same!=i]
        if not len(same): scores.append(0.);continue
        a=dist[i,same].mean()
        b=min(dist[i,labels==other].mean() for other in sorted(set(labels)) if other!=label)
        scores.append((b-a)/max(a,b) if max(a,b)>0 else 0.)
    return float(np.mean(scores))

def kmeans(x,k):
    best=None
    for restart in range(10):
        rng=np.random.default_rng(SEED+restart)
        centers=[x[int(rng.integers(len(x)))]]
        while len(centers)<k:
            d=np.min(np.sum((x[:,None]-np.array(centers))**2,axis=2),axis=1)
            if d.sum()<=1e-12: return None
            centers.append(x[int(rng.choice(len(x),p=d/d.sum()))])
        centers=np.array(centers)
        for _ in range(150):
            labels=np.argmin(np.sum((x[:,None]-centers)**2,axis=2),axis=1)
            if len(set(labels))<k: break
            updated=np.array([x[labels==i].mean(axis=0) for i in range(k)])
            if np.allclose(updated,centers,atol=1e-10,rtol=0): centers=updated;break
            centers=updated
        if len(set(labels))<k: continue
        inertia=float(np.sum((x-centers[labels])**2))
        if best is None or inertia<best[0]: best=(inertia,labels.copy())
    return best

def hierarchy(dist):
    n=len(dist);sizes={i:1 for i in range(n)};active=set(sizes);merges=[]
    distances={(a,b):float(dist[a,b]) for a in range(n) for b in range(a+1,n)}
    def get(a,b):return distances[min(a,b),max(a,b)]
    for next_id in range(n,2*n-1):
        a,b=min(((a,b) for a,b in distances if a in active and b in active),key=lambda pair:(distances[pair],pair))
        distance=get(a,b);size=sizes[a]+sizes[b]
        active.remove(a);active.remove(b)
        for c in active:
            distances[c,next_id]=(sizes[a]*get(a,c)+sizes[b]*get(b,c))/size
        merges.append({'left':a,'right':b,'distance':distance,'size':size})
        sizes[next_id]=size;active.add(next_id)
    return merges

def cluster_data(x):
    x=np.asarray(x,dtype=float);n=len(x)
    if n<12 or n>POLICY['maxClusterRows'] or len(np.unique(x,axis=0))<2:
        return {'status':'insufficient','reason':'Clustering requires 12–500 rows and at least two distinct profiles.','evaluations':[],'hierarchy':[]}
    dist=np.sqrt(np.maximum(0,np.sum((x[:,None]-x[None,:])**2,axis=2)))
    evaluations=[];candidates=[]
    for k in range(2,min(6,n//3)+1):
        fit=kmeans(x,k)
        if fit is None: continue
        inertia,labels=fit;sizes=[int(np.sum(labels==i)) for i in range(k)]
        score=silhouette(dist,labels)
        eligible=min(sizes)>=3 and score>=.25
        evaluations.append({'k':k,'silhouette':score,'inertia':inertia,'sizes':sizes,'eligible':eligible})
        if eligible:candidates.append((score,-k,labels))
    tree=hierarchy(dist)
    if not candidates:return {'status':'insufficient','reason':'No k passed silhouette ≥ .25 and minimum cluster size 3.','evaluations':evaluations,'hierarchy':tree}
    score,negk,labels=max(candidates,key=lambda v:(v[0],v[1]))
    # Stable labels follow first member order; numbers carry no ranking meaning.
    order=sorted(set(labels),key=lambda label:int(np.where(labels==label)[0][0]))
    labels=[order.index(v) for v in labels]
    return {'status':'ready','selectedK':-negk,'labels':labels,'silhouette':score,'evaluations':evaluations,'hierarchy':tree,'linkage':'average Euclidean; leaf indices follow points order'}

def analyze(rows,method):
    exclusions={'rows':[],'columns':[]};result={'status':'insufficient','sampleSize':0,'exclusions':exclusions}
    def fail(reason):result['reason']=reason;return result
    names=sorted({k for r in rows for k in r.get('numeric',{})})
    columns=[]
    for name in names:
        values=[r.get('numeric',{}).get(name) for r in rows];known=[v for v in values if number(v)]
        reason='low coverage' if len(known)<max(8,.7*len(rows)) else 'constant' if np.std(known)<1e-12 else None
        if reason:exclusions['columns'].append({'name':name,'reason':reason,'observed':len(known),'total':len(rows)})
        else:columns.append(name)
    if len(columns)<2:return fail('At least two varying numeric columns with ≥70% coverage and 8 observed rows are required.')
    kept=[]
    for r in rows:
        coverage=sum(number(r.get('numeric',{}).get(k)) for k in columns)/len(columns)
        if coverage<.7:exclusions['rows'].append({'id':r.get('id'),'reason':'numeric coverage below 70%','coverage':coverage})
        else:kept.append(r)
    result['sampleSize']=len(kept)
    if len(kept)<8:return fail('At least 8 sufficiently observed rows are required.')
    blocks=[];variables=[];preprocessing=[]
    for name in columns:
        values=[r.get('numeric',{}).get(name) for r in kept];known=[v for v in values if number(v)];median=float(np.median(known))
        a=np.array([v if number(v) else median for v in values],dtype=float);sd=float(a.std())
        if sd<1e-12:exclusions['columns'].append({'name':name,'reason':'constant after row filtering'});continue
        blocks.append(((a-a.mean())/sd)[:,None]);variables.append({'name':name,'kind':'numeric'})
        preprocessing.append({'name':name,'median':median,'mean':float(a.mean()),'scale':sd,'imputed':len(values)-len(known)})
    if len(blocks)<2:return fail('Fewer than two varying numeric columns remain after filtering.')
    if method=='famd':
        for name in sorted({k for r in kept for k in r.get('categorical',{})}):
            vals=[r.get('categorical',{}).get(name) for r in kept]
            known=[str(v) for v in vals if v is not None and str(v).strip()];levels=sorted(set(known))
            reason='low coverage' if len(known)<.7*len(kept) else 'constant' if len(levels)<2 else 'high cardinality' if len(levels)>min(12,len(kept)*.5) else None
            if reason:exclusions['columns'].append({'name':name,'reason':reason,'kind':'categorical'});continue
            # Missing categorical observations use expected indicators: neutral at the origin.
            probs=np.array([known.count(level)/len(known) for level in levels])
            z=np.array([[(float(str(v)==level)-p)/math.sqrt(p) if v is not None and str(v).strip() else 0. for level,p in zip(levels,probs)] for v in vals])
            z-=z.mean(axis=0)
            blocks.append(z)
            variables.extend({'name':name+'='+level,'source':name,'kind':'category'} for level in levels)
            preprocessing.append({'name':name,'levels':levels,'proportions':probs.tolist(),'imputed':len(vals)-len(known),'missingPolicy':'expected indicators'})
    x=np.column_stack(blocks);fit=decompose(x)
    if np.sum(fit['eigenvalues']>1e-10)<2:return fail('At least two nonzero dimensions are required.')
    eigen=fit['eigenvalues'];clustering=cluster_data(x)
    points=[{'id':r['id'],'name':r.get('name',r['id']),'x':float(fit['scores'][i,0]),'y':float(fit['scores'][i,1]),'cluster':clustering.get('labels',[None]*len(kept))[i]} for i,r in enumerate(kept)]
    for i,var in enumerate(variables):var.update(loadings=fit['loadings'][i,:2].tolist(),coefficients=fit['vectors'][i,:2].tolist(),contributions=fit['contributions'][i,:2].tolist())
    clusters=[]
    if clustering['status']=='ready':
        for label in range(clustering['selectedK']):
            indices=[i for i,p in enumerate(points) if p['cluster']==label]
            numeric=[]
            for col in preprocessing:
                if 'scale' not in col:continue
                vals=[kept[i].get('numeric',{}).get(col['name']) for i in indices];vals=[v for v in vals if number(v)]
                if vals:numeric.append({'name':col['name'],'mean':float(np.mean(vals)),'standardizedDifference':float((np.mean(vals)-col['mean'])/col['scale']),'observed':len(vals)})
            clusters.append({'id':label,'size':len(indices),'members':[points[i]['id'] for i in indices],'features':sorted(numeric,key=lambda v:-abs(v['standardizedDifference']))[:5]})
    clustering['clusters']=clusters
    result.update(status='ready',method=method,points=points,variables=variables,axes=[{'variance':float(v),'explainedVarianceRatio':float(v/eigen.sum())} for v in eigen],preprocessing=preprocessing,clustering=clustering)
    return result

def build_multivariate(payload):
    rows=sorted(payload.get('rows',[]),key=lambda r:str(r.get('id','')))
    return {'schemaVersion':1,'asOf':payload.get('asOf'),'seed':SEED,'policy':POLICY,'analyses':{kind:{method:analyze([r for r in rows if r.get('kind')==kind],method) for method in ('pca','famd')} for kind in ('group','solo')}}

def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--input',required=True);parser.add_argument('--output',required=True);args=parser.parse_args()
    payload=json.loads(Path(args.input).read_text(encoding='utf-8-sig'))
    target=Path(args.output);target.parent.mkdir(parents=True,exist_ok=True)
    target.write_text(json.dumps(build_multivariate(payload),ensure_ascii=False,indent=2,allow_nan=False)+'\n',encoding='utf-8')

if __name__=='__main__':main()
