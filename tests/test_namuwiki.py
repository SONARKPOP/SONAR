import unittest
import urllib.error
from pathlib import Path
from tempfile import TemporaryDirectory
from collectors.namuwiki import NamuwikiClient,collect,extract_candidates

class NamuwikiTests(unittest.TestCase):
 def test_request_spacing_and_key_stays_in_header(self):
  moment=[0.0];requests=[]
  def sleep(seconds):moment[0]+=seconds
  def opener(request,timeout):
   requests.append((moment[0],request))
   class Response:
    def __enter__(self):return self
    def __exit__(self,*args):pass
    def read(self):return b'{"found":true,"title":"Artist","text":"profile"}'
   return Response()
  client=NamuwikiClient('not-a-real-secret',opener=opener,clock=lambda:moment[0],sleep=sleep)
  for i in range(3):client.article('Artist')
  self.assertEqual([round(t,1) for t,_ in requests],[0,2.1,4.2])
  self.assertNotIn('not-a-real-secret',requests[0][1].full_url)
  self.assertEqual(requests[0][1].get_header('Authorization'),'Bearer not-a-real-secret')

 def test_candidates_never_replace_canonical_and_birth_is_only_for_solo(self):
  text='본명: Name\n출생: 2000년 1월 2일\n국적: 대한민국\n데뷔: 2020년 3월 4일\n소속 그룹: Group'
  solo=extract_candidates(text,solo=True)
  self.assertEqual(solo['birthDate'],'2000-01-02')
  self.assertNotIn('birthDate',extract_candidates(text,solo=False))

 def test_missing_key_does_not_request_and_existing_cache_survives(self):
  with TemporaryDirectory() as tmp:
   path=Path(tmp)/'research.json'
   path.write_text('{"items":[{"artistId":"old","candidates":{}}]}',encoding='utf-8')
   result=collect([],path,key='',current=100)
   self.assertEqual(result['status'],'source_unavailable')
   self.assertEqual(result['items'][0]['artistId'],'old')

 def test_cache_is_reused_without_overwriting_existing_member_profile(self):
  class Client:
   calls=0
   def article(self,title):
    self.calls+=1
    return {'found':True,'title':title,'text':'출생: 2000년 1월 2일','source':'dump'}
  client=Client();group={'id':'solo','name':'Artist','gender':'girl','artistType':'solo','members':[],'aliases':[]}
  with TemporaryDirectory() as tmp:
   path=Path(tmp)/'research.json'
   collect([group],path,key='fake',client=client,current=100)
   result=collect([group],path,key='fake',client=client,current=101)
   self.assertEqual(client.calls,1)
   self.assertEqual(result['items'][0]['verificationStatus'],'needs_cross_check')
   self.assertEqual(group['members'],[])

 def test_rate_limit_error_is_not_retried_or_written_as_artist_absence(self):
  calls=[]
  def opener(request,timeout):
   calls.append(request)
   raise urllib.error.HTTPError(request.full_url,429,'limited',{},None)
  client=NamuwikiClient('fake',opener=opener)
  with TemporaryDirectory() as tmp:
   result=collect([{'id':'g','name':'Artist','gender':'girl'}],Path(tmp)/'research.json',key='fake',client=client,current=100)
   self.assertEqual(len(calls),1)
   self.assertEqual(result['status'],'source_unavailable')
   self.assertEqual(result['reason'],'http-429')
   self.assertEqual(result['items'],[])

 def test_http_200_error_envelope_does_not_replace_previous_evidence(self):
  class Client:
   def article(self,title):return {'error':'temporarily unavailable'}
  with TemporaryDirectory() as tmp:
   path=Path(tmp)/'research.json'
   path.write_text('{"items":[{"artistId":"g","checkedAt":"1970-01-01T00:00:00Z","candidates":{"legalName":"Previous"}}]}',encoding='utf-8')
   result=collect([{'id':'g','name':'Artist','gender':'girl'}],path,key='fake',client=Client(),current=10*86400)
   self.assertEqual(result['status'],'source_unavailable')
   self.assertEqual(result['items'][0]['candidates']['legalName'],'Previous')

 def test_six_hour_cooldown_covers_manual_repeated_runs(self):
  class Client:
   calls=0
   def article(self,title):
    self.calls+=1
    return {'found':False,'title':title}
  client=Client();groups=[{'id':id,'name':id,'gender':'girl'} for id in ('a','b')]
  with TemporaryDirectory() as tmp:
   path=Path(tmp)/'research.json'
   collect(groups,path,key='fake',client=client,current=100,limit=1)
   collect(groups,path,key='fake',client=client,current=100+3600,limit=1)
   self.assertEqual(client.calls,1)
   collect(groups,path,key='fake',client=client,current=100+21600,limit=1)
   self.assertEqual(client.calls,2)
