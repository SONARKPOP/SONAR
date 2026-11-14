import unittest
from collectors.channel_survey import build_survey

CID='UC'+'a'*22

class ChannelSurveyTests(unittest.TestCase):
 def artist(self,id,**extra):
  return {'id':id,'name':id,'gender':'girl','aliases':[],'channels':[],'members':[],**extra}

 def test_pending_and_searched_unresolved_are_distinct_and_absence_requires_evidence(self):
  groups=[self.artist('pending'),self.artist('searched'),self.artist('absent')]
  research={'artists':[{'artistId':'searched','attempts':[{'url':'https://example.org','result':'not-resolved'}]},
   {'artistId':'absent','status':'no_dedicated_channel','attempts':[{'url':'https://example.org','result':'read'}]}]}
  report=build_survey(groups,research)
  self.assertEqual([a['status'] for a in report['artists']],['pending','unresolved','unresolved'])

 def test_verified_requires_reviewed_identity_and_shared_relations_do_not_duplicate(self):
  channel={'id':'source','platform':'youtube','official':True,'groupIds':['g'],'platformId':CID,
   'verificationStatus':'VERIFIED','verification':{'evidenceUrl':'https://official.example','checkedAt':'2026-11-14'}}
  groups=[self.artist('g',channels=[channel],members=[{'id':'person','name':'Person','groupId':'g'}]),self.artist('solo',artistType='solo',relatedMemberIds=['person'])]
  research={'artists':[{'artistId':'g','attempts':[{'result':'read'}],'resolvedChannels':[{'channelId':CID,'channelType':'group_official','url':'https://www.youtube.com/channel/'+CID,'identityChecked':True}]},
   {'artistId':'solo','attempts':[{'result':'read'}],'relationships':[{'channelId':CID,'channelType':'group_shared','url':'https://www.youtube.com/channel/'+CID}]}]}
  report=build_survey(groups,research)
  self.assertEqual(report['artists'][0]['status'],'verified')
  self.assertEqual(report['artists'][1]['status'],'unresolved')
  self.assertEqual(len(report['youtubeChannels']),1)
  self.assertEqual(len(report['artistChannelRelations']),2)
  self.assertEqual(report['artists'][1]['person_id'],'person')
  reversed_report=build_survey(list(reversed(groups)),research)
  self.assertEqual(reversed_report['youtubeChannels'][0]['verification_status'],'VERIFIED')
  self.assertEqual(reversed_report['youtubeChannels'][0]['verification_source'],report['youtubeChannels'][0]['verification_source'])

 def test_solo_reuses_member_identity_and_incomplete_dates_stay_null(self):
  report=build_survey([self.artist('group',members=[{'id':'person','name':'Name','birthDate':'2000-01-01','groupId':'group'}]),
                       self.artist('solo',artistType='solo',relatedMemberIds=['person'],relatedGroupIds=['group'])],{})
  solo=report['artists'][1]
  self.assertEqual(solo['person_id'],'person')
  self.assertEqual(solo['profile']['birth_date'],'2000-01-01')
  self.assertIsNone(solo['profile']['solo_debut_date'])
  self.assertEqual(len(report['persons']),1)

 def test_standalone_solo_uses_existing_artist_id_not_a_new_person_id(self):
  report=build_survey([self.artist('singer',artistType='solo')],{})
  self.assertEqual(report['artists'][0]['person_id'],'singer')
  self.assertEqual(report['persons'][0]['id'],'singer')
