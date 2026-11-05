"""One hidden key entry: stage priority channels, then merge into actual data."""
import argparse
import getpass
import os
import sys
from .preflight import run
from .youtube import YouTube
from .registry import load_config
from .activate_review import activate
from .publish import ROOT, write
from .export_preview import export

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--prompt-key',action='store_true')
    parser.add_argument('--limit',type=int,default=10,choices=range(1,11))
    args=parser.parse_args()
    try:
        config=load_config()
        print(f"Priority groups: {len(config['collectionGroupIds'])}. Up to {args.limit} recent uploads per official source.")
        print('Title-only member tags; uncertain members remain unclassified. This is not full-video viewing verification.')
        key=os.getenv('YOUTUBE_API_KEY')
        if not key and args.prompt_key:
            if not sys.stdin.isatty():raise ValueError('Run UPDATE-ACTUAL.cmd in an interactive console for hidden key entry.')
            key=getpass.getpass('YouTube API key (hidden, not saved): ').strip()
        if not key:raise ValueError('API key is required; do not paste it into chat.')
        stage,_=run(YouTube(key),limit=args.limit)
        key=None
        result=activate(stage,merge=True)
        write(ROOT/'docs/ACTUAL_DATA_REVIEW.json',result)
        print(f"Actual data updated: {result['videoCount']} videos. Previous actual videos retained; no samples.")
        if (ROOT/'dist/assets').exists():
            export(ROOT.parent/'SONAR-actual-preview.html')
        print('Refresh your local SONAR page to see the update.')
    except (ValueError,RuntimeError,OSError,KeyError) as exc:
        parser.exit(1,f'{exc}\n')
    except KeyboardInterrupt:parser.exit(1,'Cancelled.\n')

if __name__=='__main__':main()
