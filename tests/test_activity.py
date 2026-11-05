import json
import tempfile
import unittest
from pathlib import Path
from collectors.registry import load_config
from collectors.publish import publish
class ActivityTests(unittest.TestCase):
 def test_user_directory_all_entries_registered_without_guessed_sources(self):
  root=Path(__file__).resolve().parents[1]
  listing=json.loads((root/'docs/2020-ONWARD-DIRECTORY.json').read_text(encoding='utf-8'))['items']
  config=load_config();groups={g['id']:g for g in config['groups']}
  self.assertEqual(len(listing),175)
  for item in listing:
   self.assertIn(item['id'],groups)
   self.assertEqual(groups[item['id']]['debutYear'],item['debutYear'])
 def test_only_real_official_uploads_determine_activity(self):
  with tempfile.TemporaryDirectory() as temporary:
   config={'groups':[{'id':'a'},{'id':'empty'}],'members':[],'taxonomy':{},'channels':[{'id':'official','official':True,'groupIds':['a']},{'id':'external','official':False,'groupIds':[]}]}
   def row(id,source,date,demo=False):return {'id':'youtube__'+id,'platform':'youtube','platformId':id,'groupIds':['a'],'channelId':source,'category':'own','title':'hello','publishedAt':date,'demo':demo,'format':'video','tags':[],'subtypes':[]}
   publish([row('real','official','2024-01-01T00:00:00Z'),row('external','external','2026-11-01T00:00:00Z'),row('sample','official','2026-11-02T00:00:00Z',True)],config,output=Path(temporary))
   groups=json.loads((Path(temporary)/'catalog.json').read_text(encoding='utf-8'))['groups']
   self.assertEqual(groups[0]['lastOfficialUploadAt'],'2024-01-01T00:00:00Z')
   self.assertTrue(groups[0]['officialSourceConnected'])
   self.assertIsNone(groups[1]['lastOfficialUploadAt'])
   self.assertFalse(groups[1]['officialSourceConnected'])
