import json
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch
from collectors.channel_database import export_database

class ChannelDatabaseTests(unittest.TestCase):
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
