"""Export the built UI and current public JSON as a self-contained local snapshot."""
import argparse
import json
from pathlib import Path
from .publish import ROOT

def export(output):
    assets=ROOT/'dist/assets'
    scripts=list(assets.glob('index-*.js'))
    styles=list(assets.glob('index-*.css'))
    if len(scripts)!=1 or len(styles)!=1:
        raise ValueError('Build the project first; expected one JS and one CSS bundle.')
    data={str(p.relative_to(ROOT/'public/data')).replace('\\','/'):json.loads(p.read_text(encoding='utf-8')) for p in (ROOT/'public/data').rglob('*.json')}
    serialized=json.dumps(data,ensure_ascii=False).replace('<','\\u003c')
    shim='''const snapshot=SNAPSHOT_DATA;
globalThis.__SONAR_SNAPSHOT__=snapshot;
const originalFetch=window.fetch.bind(window);
window.fetch=(input,options)=>{const url=new URL(typeof input==='string'?input:input.url,location.href);const path=decodeURIComponent(url.pathname).split('/data/')[1];if(path&&Object.hasOwn(snapshot,path)){return Promise.resolve(new Response(JSON.stringify(snapshot[path]),{status:200,headers:{'Content-Type':'application/json'}}));}return originalFetch(input,options);};'''.replace('SNAPSHOT_DATA',serialized)
    script=scripts[0].read_text(encoding='utf-8').replace('</script','<\\/script')
    css=styles[0].read_text(encoding='utf-8')
    html='<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SONAR · 실제 수집 영상 스냅샷</title><style>'+css+'</style></head><body><div id="root"></div><script>'+shim+'</script><script type="module">'+script+'</script></body></html>'
    output=Path(output)
    output.parent.mkdir(parents=True,exist_ok=True)
    output.write_text(html,encoding='utf-8')
    print(f'Self-contained snapshot: {output}; {len(data)} data files embedded. YouTube media still requires internet.')

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('output',type=Path)
    args=parser.parse_args()
    export(args.output)

if __name__=='__main__':main()
