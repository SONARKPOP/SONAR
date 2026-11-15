import importlib.util
import sqlite3
import unittest
import zlib
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch
from collectors.dump_sqlite import SQLiteDocuments

@unittest.skipUnless(importlib.util.find_spec('apsw'),'optional dump requirements not installed')
class RemoteSQLiteTests(unittest.TestCase):
 def test_indexed_document_read_and_cache_without_full_download(self):
  with TemporaryDirectory() as tmp:
   path=Path(tmp)/'fixture.sqlite';db=sqlite3.connect(path)
   db.execute('CREATE TABLE docs(title TEXT,md BLOB,last_modified TEXT)')
   db.execute('CREATE UNIQUE INDEX ix_title ON docs(title)')
   db.execute('INSERT INTO docs VALUES (?,?,?)',('그룹',zlib.compress('공개 문서'.encode()),'2026-01-01'));db.commit();db.close()
   payload=path.read_bytes();calls=[]
   def opener(request,timeout):
    start,end=map(int,request.get_header('Range').removeprefix('bytes=').split('-'));calls.append((start,end))
    class Response:
     status=206
     headers={'Content-Range':f'bytes {start}-{end}/{len(payload)}'}
     def __enter__(self):return self
     def __exit__(self,*args):pass
     def read(self,limit):return payload[start:end+1]
    return Response()
   source={'sourceUrl':'https://example.org/fixture','sizeBytes':len(payload)}
   with patch('urllib.request.urlopen',side_effect=opener):
    provider=SQLiteDocuments(source,Path(tmp)/'cache',1024**2)
    self.assertEqual(provider.get('그룹'),'공개 문서')
    count=len(calls);self.assertEqual(provider.get('그룹'),'공개 문서');self.assertEqual(len(calls),count)
    self.assertIsNone(provider.get('없는 문서'))
    provider.close()
 def test_different_dump_cannot_reuse_page_cache(self):
  with TemporaryDirectory() as tmp:
   provider=SQLiteDocuments({'sourceUrl':'https://example.org/old','sizeBytes':100},tmp,100)
   with self.assertRaises(ValueError):SQLiteDocuments({'sourceUrl':'https://example.org/new','sizeBytes':100},tmp,100)
   provider.close()
