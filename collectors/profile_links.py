"""Extract profile-index channel candidates; shared publishers stay excluded."""
from html.parser import HTMLParser
from urllib.parse import urlparse, unquote
import re

INDEX_URL='https://kpopdiscover.com/ja/official-links/'

class ProfileTable(HTMLParser):
    def __init__(self):super().__init__();self.rows=[];self.row=None;self.cell=None;self.anchor=None
    def handle_starttag(self,tag,attrs):
        attrs=dict(attrs)
        if tag=='tr':self.row=[]
        elif tag in ('td','th') and self.row is not None:self.cell={'text':'','links':[]}
        elif tag=='a' and self.cell is not None:self.anchor=attrs.get('href')
    def handle_data(self,data):
        if self.cell is not None:self.cell['text']+=data
    def handle_endtag(self,tag):
        if tag=='a' and self.cell is not None and self.anchor:self.cell['links'].append(self.anchor);self.anchor=None
        elif tag in ('td','th') and self.cell is not None:self.row.append(self.cell);self.cell=None
        elif tag=='tr' and self.row is not None:self.rows.append(self.row);self.row=None

def profile_candidates(html,groups,shared_urls=()):
    parser=ProfileTable();parser.feed(html)
    normalize=lambda value:re.sub(r'[^\w]','',value.casefold())
    names={normalize(name):g['id'] for g in groups for name in [g['name'],*g['aliases']]}
    denied={u.rstrip('/').casefold() for u in shared_urls}
    candidates=[]
    for row in parser.rows:
        if len(row)<3 or row[1]['text'].strip().casefold()!='youtube':continue
        gid=names.get(normalize(row[0]['text'].strip()))
        if not gid:continue
        for link in row[2]['links']:
            url=urlparse(link);path=unquote(url.path).rstrip('/')
            if url.hostname not in ('youtube.com','www.youtube.com') or link.rstrip('/').casefold() in denied:continue
            if re.search(r'1thek|vevo|smtown|jypentertainment|hybelabels|stone.?music|genie.?music|pledis|fantagio|tsent|dspmedia',path,re.I):continue
            if not re.fullmatch(r'/(?:@[^/]+|channel/UC[\w-]{22}|user/[^/]+|c/[^/]+)',path):continue
            candidates.append({'groupId':gid,'channelUrl':'https://www.youtube.com'+path,'verificationStatus':'UNVERIFIED','sourceUrl':INDEX_URL,'reason':'Organized K-pop profile index link; direct artist identity and official-source confirmation still required.'})
    return list({(v['groupId'],v['channelUrl']):v for v in candidates}.values())

def wikipedia_group_titles(html):
    """Use group-bearing table/list cells, not every song/reference link."""
    parser=ProfileTable();parser.feed(html);titles=[]
    for row in parser.rows:
        if not row or not row[0]['links'] or not re.search(r'(?:since|[12][0-9]{3})',row[0]['text']):continue
        path=unquote(urlparse(row[0]['links'][0]).path)
        if path.startswith('/wiki/'):titles.append(path[6:].replace('_',' '))
        elif path.startswith('./'):titles.append(path[2:].replace('_',' '))
    # The article's small/early groups are bullet lists with explicit years.
    class Bullets(HTMLParser):
        def __init__(self):super().__init__();self.active=False;self.heading=None;self.label='';self.text='';self.href=None;self.depth=0
        def handle_starttag(self,tag,attrs):
            if tag in ('h2','h3'):self.heading=tag;self.label=''
            if tag=='li' and self.active:self.depth+=1;self.text='';self.href=None
            if tag=='a' and self.depth and self.href is None:self.href=dict(attrs).get('href')
        def handle_data(self,data):
            if self.heading:self.label+=data
            if self.depth:self.text+=data
        def handle_endtag(self,tag):
            if tag==self.heading:
                self.active=('generation' in self.label.casefold() if tag=='h2' else 'other girl groups' in self.label.casefold());self.heading=None
            if tag=='li' and self.depth:
                if self.href and re.search(r'[12][0-9]{3}',self.text):
                    path=unquote(urlparse(self.href).path)
                    if path.startswith('/wiki/'):titles.append(path[6:].replace('_',' '))
                    elif path.startswith('./'):titles.append(path[2:].replace('_',' '))
                self.depth-=1
    bullets=Bullets();bullets.feed(html)
    return list(dict.fromkeys(titles))
