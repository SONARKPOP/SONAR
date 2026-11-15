import unittest
from collectors.dump_youtube import normalize_url,channel_metadata,identity_matches
class DumpYoutubeTests(unittest.TestCase):
 def test_only_channel_addresses_are_accepted(self):
  self.assertEqual(normalize_url('http://m.youtube.com/@Artist/videos?x=1'),'https://www.youtube.com/@Artist')
  for u in ['https://youtube.com/watch?v=x','https://youtube.com/playlist?list=x','https://youtube.com.evil.test/@Artist','https://user:password@youtube.com/@Artist']:
   self.assertIsNone(normalize_url(u))
 def test_channel_root_metadata_not_recommended_video_channel_ids(self):
  cid='UC'+'A'*22;other='UC'+'B'*22
  html='{"channelId":"'+other+'","metadata":{"channelMetadataRenderer":{"externalId":"'+cid+'","title":"Artist","description":"Official"}}}'
  self.assertEqual(channel_metadata(html)['channelId'],cid)
  with self.assertRaises(ValueError):channel_metadata('{"channelId":"'+other+'"}')
 def test_fan_and_wrong_artist_are_not_registered(self):
  g={'name':'Artist','aliases':[]}
  self.assertTrue(identity_matches(g,{'name':'Artist Official','description':''}))
  self.assertFalse(identity_matches(g,{'name':'Other','description':'Artist songs'}))
  self.assertFalse(identity_matches(g,{'name':'Artist fan channel','description':''}))
  for title in ['Artist - 주제','ArtistVEVO','Artist - Topic','Artist COMPANY','Artist Fanpage','Artist 팬튜브']:
   self.assertFalse(identity_matches(g,{'name':title,'description':''}))
if __name__=='__main__':unittest.main()
