"""Read-only HTTP-range VFS for the public 2026 snapshot. No full DB download."""
import hashlib
import json
import sqlite3
import threading
import urllib.request
import zlib
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

class SQLiteDocuments:
 def __init__(self,source,cache,budget):
  import apsw
  self.source=source;self.cache=Path(cache);self.cache.mkdir(parents=True,exist_ok=True)
  identity={key:source[key] for key in ('sourceUrl','sizeBytes','providerMd5') if key in source}
  marker=self.cache/'source.json'
  if marker.exists() and json.loads(marker.read_text(encoding='utf-8'))!=identity:raise ValueError('SQLite cache belongs to a different dump')
  marker.write_text(json.dumps(identity),encoding='utf-8')
  self.pages=self.cache/'pages';self.pages.mkdir(exist_ok=True)
  self.budget=budget;self.bytes=0;self.lock=threading.RLock();self.local=threading.local();self.errors={}
  self.db=sqlite3.connect(self.cache/'documents.sqlite',check_same_thread=False)
  self.db.execute('CREATE TABLE IF NOT EXISTS docs(title TEXT PRIMARY KEY, md BLOB, modified TEXT)');self.db.commit()
  owner=self
  class RemoteFile:
   def xRead(self,amount,offset):
    result=b''
    while len(result)<amount:
     position=offset+len(result);start=position//65536*65536
     data=owner.block(start);piece=data[position-start:position-start+amount-len(result)]
     if not piece:raise OSError('Unexpected SQLite page boundary')
     result+=piece
    return result
   def xFileSize(self):return source['sizeBytes']
   def xClose(self):pass
   def xLock(self,level):pass
   def xUnlock(self,level):pass
   def xCheckReservedLock(self):return False
   def xFileControl(self,op,pointer):return False
   def xSectorSize(self):return 4096
   def xDeviceCharacteristics(self):return apsw.SQLITE_IOCAP_IMMUTABLE
  class RemoteVFS(apsw.VFS):
   def __init__(self,name):super().__init__(name,base='')
   def xOpen(self,name,flags):return RemoteFile()
   def xAccess(self,name,flags):return False
  self.name='sonar-'+hashlib.sha256(source['sourceUrl'].encode()).hexdigest()[:16]
  self.vfs=RemoteVFS(self.name);self.apsw=apsw
 def block(self,start):
  path=self.pages/str(start)
  if path.exists():return path.read_bytes()
  end=min(self.source['sizeBytes'],start+65536)
  with self.lock:
   if self.bytes+end-start>self.budget:raise OSError('range-byte-budget-reached; resume checkpoint')
   self.bytes+=end-start
  req=urllib.request.Request(self.source['sourceUrl']+'?sonar_block='+str(start),headers={'Range':f'bytes={start}-{end-1}'})
  with urllib.request.urlopen(req,timeout=30) as response:
   if response.status!=206 or response.headers.get('Content-Range')!=f"bytes {start}-{end-1}/{self.source['sizeBytes']}":raise OSError('Invalid SQLite range response')
   data=response.read(end-start+1)
  if len(data)!=end-start:raise OSError('Short SQLite range response')
  temporary=path.with_suffix('.'+str(threading.get_ident()));temporary.write_bytes(data);temporary.replace(path)
  return data
 def remote(self,title):
  if not hasattr(self.local,'db'):
   self.local.db=self.apsw.Connection('snapshot.sqlite',flags=self.apsw.SQLITE_OPEN_READONLY,vfs=self.name)
  row=self.local.db.execute('SELECT md,last_modified FROM docs WHERE title=?',(title,)).fetchone()
  return (title,*row) if row else (title,None,None)
 def prefetch(self,titles):
  with self.lock:
   if titles and self.db.execute('SELECT 1 FROM docs WHERE title=?',(titles[0],)).fetchone():return
   wanted=[title for title in titles if title not in self.errors and not self.db.execute('SELECT 1 FROM docs WHERE title=?',(title,)).fetchone()][:32]
  if not wanted:return
  print('SQLite batch:',len(wanted),'downloaded bytes:',self.bytes,flush=True)
  with ThreadPoolExecutor(max_workers=16) as executor:
   futures={executor.submit(self.remote,title):title for title in wanted}
   for future,title in futures.items():
    try:
     row=future.result()
     with self.lock:self.db.execute('INSERT OR REPLACE INTO docs VALUES (?,?,?)',row);self.db.commit()
    except Exception as exc:self.errors[title]=str(exc)
 def get(self,title):
  with self.lock:row=self.db.execute('SELECT md FROM docs WHERE title=?',(title,)).fetchone()
  if row is None:
   self.prefetch([title])
   if title in self.errors:raise OSError(self.errors[title])
   with self.lock:row=self.db.execute('SELECT md FROM docs WHERE title=?',(title,)).fetchone()
  if row is None:raise OSError('Document query did not produce a result')
  if row[0] is None:return None
  text=zlib.decompressobj().decompress(row[0],20*1024**2+1)
  if len(text)>20*1024**2:raise ValueError('Document exceeds decompression bound')
  return text.decode('utf-8')
 def close(self):
  self.db.close()
  if hasattr(self.local,'db'):self.local.db.close()
  self.vfs.unregister()
