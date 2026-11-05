import copy
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from collectors.youtube import YouTube, YouTubeHTTPError, resolve, collect, normalize, expected_channel
from collectors.registry import load_config
from collectors.publish import publish
class SourceHealthTests(unittest.TestCase):
 def test_channel_identity_guard_and_missing_source_isolation(self):
  self.assertTrue(expected_channel({'expectedChannelNames':['NMIXX','엔믹스']},'NMIXX'))
  self.assertFalse(expected_channel({'expectedChannelNames':['NMIXX','엔믹스']},'Some other channel'))
  config={'channels':[{'id':'missing','platformId':'missing','official':True,'collectionEnabled':True},{'id':'okay','platformId':'okay','official':True,'collectionEnabled':True}]}
  api=YouTube('test-not-a-secret')
  with patch.object(api,'get',side_effect=[{'items':[]},{'items':[{'id':'okay','contentDetails':{'relatedPlaylists':{'uploads':'uploads'}}}]}]):
   lookup=resolve(api,config)
  self.assertEqual(list(lookup),['okay'])
  self.assertFalse(config['channels'][0]['collectionEnabled'])
 def test_wrong_identity_is_not_collected(self):
  source={'id':'bad','platformId':'bad','collectionEnabled':True,'expectedChannelNames':['Artist A']}
  api=YouTube('test-not-a-secret')
  with patch.object(api,'get',return_value={'items':[{'id':'bad','snippet':{'title':'Different creator'},'contentDetails':{'relatedPlaylists':{'uploads':'uploads'}}}]}):
   self.assertEqual(resolve(api,{'channels':[source]}),{})
  self.assertEqual(source['unavailableReason'],'channel-name-needs-review')
 def test_title_only_group_matching_and_ambiguous_aliases(self):
  config=load_config();source=next(c for c in config['channels'] if c['id']=='aespa-official')
  raw={'id':'test','snippet':{'title':'Episode 1: Behind the scenes','description':'ILLIT NMIXX PIXY','publishedAt':'2026-11-05T00:00:00Z','channelTitle':'aespa'}}
  self.assertEqual(normalize(raw,source,config)['groupIds'],['aespa'])
  own={**source,'id':'episode-official','groupIds':['episode']}
  self.assertEqual(normalize(raw,own,config)['groupIds'],['episode'])
 def test_playlist_404_preserves_retained_archive_and_auth_errors_still_fail(self):
  config=load_config();source=next(c for c in config['channels'] if c['id']=='aespa-official')
  source.update(platformId='resolved',uploadsPlaylistId='uploads',collectionEnabled=True)
  config={**config,'channels':[source],'collectionGroupIds':['aespa']}
  raw={'id':'old','snippet':{'title':'aespa video','description':'','publishedAt':'2026-10-01T00:00:00Z','channelTitle':'aespa'}}
  video=normalize(raw,source,config)
  for status in (404,403):
   with tempfile.TemporaryDirectory() as tmp:
    local=copy.deepcopy(config);publish([video],local,output=tmp)
    api=YouTube('test-not-a-secret')
    def pages(resource,**kwargs):raise YouTubeHTTPError(resource,status)
    with patch('collectors.youtube.DATA',Path(tmp)),patch('collectors.youtube.read_config',return_value=local),patch('collectors.youtube.resolve',return_value={'resolved':local['channels'][0]}),patch.object(api,'pages',side_effect=pages),patch.object(api,'videos',return_value=[]):
     if status==403:
      with self.assertRaises(YouTubeHTTPError):collect(api)
     else:
      collect(api)
      self.assertTrue((Path(tmp)/'content/youtube__old.json').exists())
      report=json.loads((Path(tmp)/'collection-report.json').read_text(encoding='utf-8'))
      self.assertEqual(report['unavailableSources'][0]['reason'],'uploads-unavailable')
