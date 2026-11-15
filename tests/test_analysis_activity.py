import unittest
from collectors.analysis_activity import build_analysis,source_history
from collectors.activity import DAY,iso
NOW=1804507200
class AnalysisTests(unittest.TestCase):
 def config(self):return {'groups':[{'id':'g','name':'G','gender':'girl','supported':True}],'members':[],'channels':[{'id':'own','platform':'youtube','official':True,'groupIds':['g'],'platformId':'UC'+'a'*22,'collectionEnabled':True,'verificationStatus':'SUPPORTED','verification':{'checkedAt':'2026-11-16','evidenceUrl':'https://official.example'}},{'id':'show','official':False,'groupIds':[],'publisherReview':{'status':'approved','kind':'program','evidenceUrl':'https://show.example'}}]}
 def video(self,id,**kwargs):return {'id':'youtube__'+id,'platform':'youtube','platformId':id,'groupIds':['g'],'channelId':'show','publishedAt':iso(NOW-DAY),'format':'video','title':'Guest',**kwargs}
 def test_unknown_not_zero_and_explicit_event_dedup(self):
  videos=[self.video('a',appearanceId='event'),self.video('b',appearanceId='event'),self.video('c')]
  result=build_analysis(videos+videos,self.config(),NOW)['artists'][0]['windows']['30']
  self.assertIsNone(result['official']);self.assertIsNone(result['officialObserved']);self.assertEqual(result['inferred'],3);self.assertEqual(result['linkedAppearanceEvents'],1);self.assertEqual(result['unlinkedAppearanceUploads'],1);self.assertIsNone(result['distinctAppearances'])
 def test_exact_history_requires_coverage_and_current_identity(self):
  source=self.config()['channels'][0];entry={'channelId':source['platformId'],'configuredIdentity':source['platformId'],'complete':True,'checkedAt':iso(NOW),'uploads':[{'id':'v','at':iso(NOW-2*DAY)}]}
  self.assertEqual(source_history(source,entry,NOW,7),1);self.assertIsNone(source_history(source,entry,NOW,30));entry['historyFrom']=iso(NOW-90*DAY)
  self.assertEqual(source_history(source,entry,NOW,90),1);entry['configuredIdentity']='other';self.assertIsNone(source_history(source,entry,NOW,7))
 def test_scheduled_stations_future_and_mentions_are_excluded(self):
  videos=[self.video('normal'),self.video('future',publishedAt=iso(NOW+1)),self.video('scheduled',liveStatus='upcoming'),self.video('mention',appearanceEvidence=[{'groupId':'g','role':'mention'}])]
  row=build_analysis(videos,self.config(),NOW)['artists'][0];self.assertEqual(row['windows']['7']['observedUploads'],1)
 def test_short_and_live_types_are_disjoint_and_kst_day(self):
  row=build_analysis([self.video('short',format='short'),self.video('live',format='live',actualStartTime=iso(NOW-DAY))],self.config(),NOW)['artists'][0]
  self.assertEqual(row['windows']['7']['types']['shorts'],1);self.assertEqual(row['windows']['7']['types']['live'],1);self.assertEqual(sum(r['observedUploads'] for r in row['series']),2)
 def test_zero_and_unknown_rows_are_not_positive(self):
  row=build_analysis([],self.config(),NOW)['artists'][0];self.assertFalse(row['hasPositive90d']);self.assertIsNone(row['windows']['90']['confirmed'])
if __name__=='__main__':unittest.main()
