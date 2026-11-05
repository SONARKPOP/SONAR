import copy
import json
import shutil
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from collectors.registry import CONFIG, load_config, load_bundles, validate, read
from collectors.groups import main, new_bundle, save_bundle, sync_catalog, youtube_identity, wizard
from collectors.publish import publish, write

class RegistryTests(unittest.TestCase):
    def setUp(self):
        self.temporary=tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root=Path(self.temporary.name)
        self.config=self.root/'config'
        self.data=self.root/'data'
        shutil.copytree(CONFIG,self.config)

    def draft(self):
        return new_bundle('test-crew','Test Crew',['테스트크루'],'https://www.youtube.com/@test_crew')

    def test_solo_category_survives_public_catalog_and_invalid_type_is_rejected(self):
        bundle=new_bundle('test-solo','Test Solo',[],'@test_solo','girl','solo')
        save_bundle(bundle,self.config)
        self.assertEqual(next(g for g in load_config(self.config)['groups'] if g['id']=='test-solo')['artistType'],'solo')
        bundle['artistType']='invalid'
        with self.assertRaises(ValueError):save_bundle(bundle,self.config,create=False)

    def test_register_and_set_populate_catalog_without_changing_frontend(self):
        publish([],load_config(self.config),output=self.data,demo=True)
        main(['add','--id','test-crew','--name','Test Crew','--alias','테스트크루','--youtube','@test_crew'],self.config,self.data)
        catalog=read(self.data/'catalog.json')
        self.assertIn('test-crew',[g['id'] for g in catalog['groups']])
        self.assertNotIn('test-crew',catalog['defaultGroupIds'])
        self.assertNotIn('test-crew',catalog['collectionGroupIds'])
        self.assertTrue((self.data/'groups/test-crew.json').exists())
        main(['set','test-crew','--default-selected','true'],self.config,self.data)
        catalog=read(self.data/'catalog.json')
        self.assertIn('test-crew',catalog['defaultGroupIds'])
        self.assertNotIn('test-crew',catalog['collectionGroupIds'])
        main(['set','test-crew','--collect','true'],self.config,self.data)
        self.assertIn('test-crew',read(self.data/'catalog.json')['collectionGroupIds'])

    def test_duplicate_group_does_not_overwrite(self):
        bundle=self.draft()
        save_bundle(bundle,self.config)
        with self.assertRaises(ValueError):save_bundle({**bundle,'name':'Wrong'},self.config)
        self.assertEqual(read(self.config/'groups/test-crew.json')['name'],'Test Crew')

    def test_duplicate_channel_handle_rejected_before_file_write(self):
        bundle=self.draft()
        bundle['channels'][0]['handle']='@RESCENE_official'
        with self.assertRaisesRegex(ValueError,'Duplicate source'):save_bundle(bundle,self.config)
        self.assertFalse((self.config/'groups/test-crew.json').exists())

    def test_duplicate_channel_id_and_group_alias_rejected(self):
        bundle=self.draft()
        bundle['channels'][0]['id']='rescene-official'
        with self.assertRaisesRegex(ValueError,'Duplicate channel'):save_bundle(bundle,self.config)
        bundle=self.draft()
        bundle['aliases']=['리센느']
        with self.assertRaisesRegex(ValueError,'Ambiguous group alias'):save_bundle(bundle,self.config)

    def test_member_wrong_owner_and_duplicates_rejected(self):
        bundle=self.draft()
        bundle['members']=[{'id':'test-member','groupId':'uspeer','name':'Member','aliases':['Member']}]
        with self.assertRaisesRegex(ValueError,'owning group'):save_bundle(bundle,self.config)
        bundle['members'][0]['groupId']='test-crew'
        bundle['members'].append(copy.deepcopy(bundle['members'][0]))
        with self.assertRaisesRegex(ValueError,'Duplicate member'):save_bundle(bundle,self.config)

    def test_invalid_id_required_fields_and_flags(self):
        for gid in ('../escape','con','Bad ID'):
            with self.assertRaises(ValueError):new_bundle(gid,'Test',[],'@test_crew')
        for field,value in (('name',''),('aliases',None),('supported','true'),('members',None)):
            bundle=self.draft();bundle[field]=value
            with self.subTest(field=field),self.assertRaises(ValueError):save_bundle(bundle,self.config)

    def test_unsupported_cannot_be_default_or_collected(self):
        bundle=self.draft();bundle['supported']=False;bundle['defaultSelected']=True
        with self.assertRaises(ValueError):save_bundle(bundle,self.config)

    def test_platform_expansion_can_be_registered_but_cannot_collect_yet(self):
        bundle=self.draft()
        bundle['channels'][0].update(platform='instagram',handle='test_crew',collectionEnabled=False)
        save_bundle(bundle,self.config)
        bundle['channels'][0]['collectionEnabled']=True
        with self.assertRaisesRegex(ValueError,'only available for YouTube'):save_bundle(bundle,self.config,create=False)

    def test_filename_must_match_id(self):
        write(self.config/'groups/wrong-file.json',self.draft())
        with self.assertRaisesRegex(ValueError,'filename'):load_config(self.config)

    def test_handle_urls_and_video_url_rejection(self):
        self.assertEqual(youtube_identity('https://www.youtube.com/@test_crew'),{'handle':'@test_crew'})
        for value in ('https://evil.example/@test_crew','https://www.youtube.com/watch?v=abc','https://www.youtube.com/playlist?list=abc'):
            with self.assertRaises(ValueError):youtube_identity(value)

    def test_sync_preserves_content_and_live_confirmation_time(self):
        config=load_config(self.config)
        v={'id':'youtube__fixture','platform':'youtube','platformId':'fixture','publishedAt':'2026-11-05T00:00:00Z','groupIds':['rescene','uspeer'],'memberIds':[],'channelId':'rescene-official','liveStatus':'live','actualStartTime':'2026-11-05T00:00:00Z'}
        publish([v],config,output=self.data)
        old=read(self.data/'live.json');old['updatedAt']='2020-01-01T00:00:00Z';write(self.data/'live.json',old)
        save_bundle(self.draft(),self.config)
        sync_catalog(self.config,self.data)
        self.assertEqual(read(self.data/'content/youtube__fixture.json')['groupIds'],['rescene','uspeer'])
        self.assertEqual(read(self.data/'live.json')['updatedAt'],'2020-01-01T00:00:00Z')

    def test_unsupported_group_is_removed_from_indexes(self):
        config=load_config(self.config)
        publish([],config,output=self.data)
        bundle=read(self.config/'groups/rescene.json')
        bundle.update(supported=False,defaultSelected=False,collectionEnabled=False,sampleEnabled=False)
        save_bundle(bundle,self.config,create=False)
        sync_catalog(self.config,self.data)
        self.assertFalse((self.data/'groups/rescene.json').exists())
        self.assertNotIn('rescene',[g['id'] for g in read(self.data/'catalog.json')['groups']])

    def test_wizard_cancel_does_not_write(self):
        with patch('builtins.input',side_effect=['test-crew','Test Crew','테스트크루','@test_crew','n']):
            wizard(self.config,self.data)
        self.assertFalse((self.config/'groups/test-crew.json').exists())

    def test_invalid_display_order_blocks_registration_before_write(self):
        write(self.config/'settings.json',{'groupOrder':['unknown']})
        with self.assertRaisesRegex(ValueError,'unknown groups'):save_bundle(self.draft(),self.config)
        self.assertFalse((self.config/'groups/test-crew.json').exists())

if __name__=='__main__':unittest.main()
