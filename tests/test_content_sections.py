import unittest
from collectors.content_sections import content_length,duration_seconds,music_type
from collectors.content_tags import apply_tags

class ContentSectionTests(unittest.TestCase):
    def test_boundaries_and_unknown(self):
        for seconds,kind in ((299,'short'),(300,'regular'),(2699,'regular'),(2700,'long')):
            self.assertEqual(content_length({'durationSeconds':seconds}),kind)
        self.assertEqual(content_length({'format':'live','durationSeconds':1}),'live')
        self.assertEqual(content_length({}),'')
        self.assertEqual(duration_seconds({'durationLabel':'1:02:03'}),3723)

    def test_teasers_and_shorts_keep_parent_classification(self):
        own=apply_tags({'title':'자체 예능 다음화 예고','format':'short'},True)
        self.assertEqual(own['teaserType'],'content')
        self.assertEqual(own['contentTabs'],['own','shorts'])
        music=apply_tags({'title':'Title MV Teaser','category':'music'},True)
        self.assertEqual(music['contentTabs'],['music'])
        self.assertEqual(music_type({'title':'MV Behind interview'}),'')
        self.assertEqual(apply_tags(own,True),own)

if __name__=='__main__':unittest.main()
