import json
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch
from collectors.channel_database import export_database
from collectors.channel_review import export_queue

class ChannelDatabaseTests(unittest.TestCase):
    def test_census_keeps_public_profiles_even_when_activity_is_excluded(self):
        profiles=[{'id':'agency','name':'Agency Only','aliases':[],'gender':'girl',
                   'directoryVisibility':'agency-only','channels':[]},
                  {'id':'solo','name':'Solo','aliases':[],'gender':'girl','artistType':'solo','channels':[]},
                  {'id':'boy','name':'Boy Group','aliases':[],'gender':'boy','channels':[]}]
        with TemporaryDirectory() as tmp,patch('collectors.channel_database.load_bundles',return_value=(profiles,[],{},{})):
            result=export_database(output=Path(tmp))
            self.assertEqual(result['summary']['totalArtists'],2)
            self.assertEqual({group['group_id'] for group in result['groups']},{'agency','solo'})
    def test_evidence_metadata_does_not_promote_unreviewed_channel(self):
        source={'id':'s','official':True,'platform':'youtube','groupIds':['g'],'handle':'@artist',
                'verification':{'checkedAt':'2026-11-14','evidenceUrl':'https://official.example/artist'}}
        group={'id':'g','name':'Artist','aliases':[],'gender':'girl','channels':[source]}
        with TemporaryDirectory() as tmp,patch('collectors.channel_database.load_bundles',return_value=([group],[],{},{})),patch('collectors.channel_review.load_bundles',return_value=([group],[],{},{})):
            output=Path(tmp)
            report=export_database(output=output)
            self.assertEqual(report['youtubeChannels'][0]['verification_status'],'UNVERIFIED')
            self.assertEqual(report['summary']['groupsWithOfficialChannelUrl'],0)
            self.assertEqual(len(report['reviewQueue']),1)
            self.assertEqual(export_queue(output=output)[0]['stage'],'needs-verification')
            source['verificationStatus']='SUPPORTED'
            self.assertEqual(export_database(output=output)['summary']['groupsWithOfficialChannelUrl'],1)
            self.assertEqual(export_queue(output=output),[])
            secondary={**source,'id':'secondary','handle':'@second','verificationStatus':'UNVERIFIED'}
            group['channels'].append(secondary)
            mixed=export_database(output=output)
            self.assertEqual(mixed['summary']['groupsWithOfficialChannelUrl'],1)
            self.assertEqual(mixed['summary']['unverifiedGroups'],0)
            self.assertEqual(mixed['summary']['partiallyReviewedGroups'],1)
            self.assertEqual(export_queue(output=output)[0]['sources'][0]['id'],'secondary')
            group['channels'].pop()
            source['verification'].pop('checkedAt')
            self.assertEqual(export_database(output=output)['youtubeChannels'][0]['verification_status'],'UNVERIFIED')
            self.assertEqual(len(export_queue(output=output)),1)
    def test_resolved_ids_and_changed_handles_preserve_provenance(self):
        cid='UC'+'a'*22
        group={'id':'g','name':'Group','aliases':['그룹'],'gender':'girl','artistType':'group','debutYear':2001,'channels':[{'id':'g-official','official':True,'platform':'youtube','groupIds':['g'],'handle':'@old','verification':{'checkedAt':'2026-11-07','evidenceUrl':'https://example.org/official'}}]}
        with TemporaryDirectory() as tmp,patch('collectors.channel_database.load_bundles',return_value=([group],[],{},{})):
            output=Path(tmp)
            (output/'channel-activity.json').write_text(json.dumps({'channels':{'g-official':{'configuredIdentity':'@old','channelId':cid,'handle':'@new','error':None}}}),encoding='utf-8')
            report=export_database(output=output)
            source=report['youtubeChannels'][0]
            self.assertEqual(source['channel_id'],cid);self.assertEqual(source['handle'],'@new')
            self.assertIn('https://www.youtube.com/@old',source['historical_urls'])
            self.assertIsNone(report['groups'][0]['debut_date'])
            self.assertEqual(report['groups'][0]['group_status'],'unknown')

if __name__=='__main__':unittest.main()
