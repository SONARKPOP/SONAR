import copy
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch
from collectors.channel_registration import evaluate_channel, register_channel
from collectors.channel_candidates import register_candidates
from collectors.publish import write
from collectors.registry import slug


class RegistrationTests(unittest.TestCase):
    def setUp(self):
        self.group = {'id':'artist','name':'Artist','aliases':[], 'channels':[]}
        self.observed = {'channelId':'UC'+'A'*22,'name':'Artist Official','handle':'@Artist',
                         'checkedAt':'2026-11-17T01:00:00Z','description':'', 'channelUrl':'https://www.youtube.com/@Artist'}

    def test_exact_name_handle_without_crosslink(self):
        decision=register_channel(self.group,self.observed,[self.group])
        self.assertEqual(decision['decision'],'approve')
        source=self.group['channels'][0]
        slug(source['id'],'Channel ID')
        self.assertEqual(source['handle'],'@Artist')
        self.assertEqual(source['verificationStatus'],'SUPPORTED')
        self.assertEqual(source['verification']['checkedAt'],'2026-11-17')
        self.assertFalse(source['collectionEnabled'])

    def test_title_alone_and_substring_do_not_approve(self):
        for observed in [{**self.observed,'handle':None},{**self.observed,'name':'Other Artist','handle':'@OtherArtist'}]:
            self.assertEqual(evaluate_channel(self.group,observed)['decision'],'review')

    def test_reregistration_preserves_source_id_and_secondary_evidence(self):
        self.group['channels']=[{'id':'stable-source','platform':'youtube','official':True,'groupIds':['artist'],
            'platformId':self.observed['channelId'],'collectionEnabled':False,
            'verification':{'evidenceUrl':'https://secondary.example/profile','sources':['https://primary.example/profile']}}]
        register_channel(self.group,self.observed,sources=self.group['channels'])
        self.assertEqual(self.group['channels'][0]['id'],'stable-source')
        self.assertIn('https://secondary.example/profile',self.group['channels'][0]['verification']['sources'])
        self.assertIn('https://primary.example/profile',self.group['channels'][0]['verification']['sources'])

    def test_primary_ownership_suffices_without_title_handle_match(self):
        observed={**self.observed,'name':'Personal Studio','handle':'@PersonalStudio'}
        proof={'kind':'agency-site','groupId':'artist','channelId':observed['channelId'],'dedicated':True,
               'evidenceUrl':'https://agency.example/artist','checkedAt':'2026-11-17'}
        self.assertEqual(evaluate_channel(self.group,observed,ownership=proof)['reason'],'official-owned-link')
        self.assertEqual(evaluate_channel(self.group,observed,ownership={'evidenceUrl':proof['evidenceUrl']})['decision'],'review')

    def test_collision_fan_shared_and_old_id_conflicts(self):
        self.assertEqual(evaluate_channel(self.group,self.observed,[self.group,{**self.group,'id':'namesake'}])['reason'],'artist-name-collision')
        for name in ['Artist fan channel','Artist - Topic','Artist Entertainment','Artist 팬튜브']:
            self.assertEqual(evaluate_channel(self.group,{**self.observed,'name':name})['decision'],'review')
        source={'id':'old','official':True,'platform':'youtube','groupIds':['artist'],'handle':'@Artist','platformId':'UC'+'B'*22}
        self.assertEqual(evaluate_channel(self.group,self.observed,sources=[source])['reason'],'existing-handle-channel-id-conflict')
        source['handle']='@OldHandle'
        self.assertEqual(evaluate_channel(self.group,self.observed,sources=[source])['reason'],'existing-artist-channel-id-conflict')
        source['platformId']=self.observed['channelId'];source['shared']=True
        self.assertEqual(evaluate_channel(self.group,self.observed,sources=[source])['decision'],'review')

    def test_date_missing_remains_queued_and_no_new_checked_date(self):
        self.observed.pop('checkedAt')
        register_channel(self.group,self.observed)
        register_channel(self.group,self.observed)
        self.assertEqual(len(self.group['youtubeCandidates']),1)
        self.assertIsNone(self.group['youtubeCandidates'][0]['checkedAt'])
        self.assertEqual(self.group['channels'],[])

    def test_candidate_command_path_registers_actual_metadata_and_queues_rest(self):
        with TemporaryDirectory() as tmp:
            output=Path(tmp)
            write(output/'channel-candidates.json',{'candidates':[{'groupId':'artist','channelUrl':self.observed['channelUrl']},
                                                                 {'groupId':'artist','channelUrl':'https://www.youtube.com/@Unknown'}]})
            with patch('collectors.registry.load_bundles',return_value=([self.group],[],{},{})), patch('collectors.registry.validate'), patch('collectors.groups.save_bundle') as save:
                result=register_candidates(output,output,metadata={self.observed['channelUrl']:self.observed},apply=True)
            self.assertEqual(result['summary'],{'reviewed':2,'approved':1,'unresolved':1})
            self.assertEqual(len(self.group['channels']),1)
            self.assertEqual(self.group['youtubeCandidates'][0]['channelUrl'],'https://www.youtube.com/@Unknown')
            save.assert_called_once()


if __name__=='__main__': unittest.main()
