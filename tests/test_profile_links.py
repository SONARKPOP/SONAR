import unittest
from collectors.profile_links import profile_candidates

class ProfileLinksTests(unittest.TestCase):
    def test_shared_and_watch_links_are_not_artist_candidates(self):
        groups=[{'id':'g','name':'Example Group','aliases':['예시']}]
        rows=''.join(f'<tr><td>Example Group</td><td>YouTube</td><td><a href="{url}">YouTube</a></td></tr>' for url in ['https://www.youtube.com/@ExampleGroup','https://www.youtube.com/@JYPEntertainment','https://www.youtube.com/watch?v=x','https://www.youtube.com/@ExampleGroup'])
        result=profile_candidates('<table>'+rows+'</table>',groups)
        self.assertEqual(len(result),1);self.assertEqual(result[0]['verificationStatus'],'UNVERIFIED')

if __name__=='__main__':unittest.main()
