import unittest
from collectors.profile_links import profile_candidates, wikipedia_group_titles

class ProfileLinksTests(unittest.TestCase):
    def test_shared_and_watch_links_are_not_artist_candidates(self):
        groups=[{'id':'g','name':'Example Group','aliases':['예시']}]
        rows=''.join(f'<tr><td>Example Group</td><td>YouTube</td><td><a href="{url}">YouTube</a></td></tr>' for url in ['https://www.youtube.com/@ExampleGroup','https://www.youtube.com/@JYPEntertainment','https://www.youtube.com/watch?v=x','https://www.youtube.com/@ExampleGroup'])
        result=profile_candidates('<table>'+rows+'</table>',groups)
        self.assertEqual(len(result),1);self.assertEqual(result[0]['verificationStatus'],'UNVERIFIED')
    def test_wikipedia_candidates_ignore_reference_and_song_links(self):
        html='<h2>First generation</h2><ul><li><a href="./Early_Group">Early Group</a> (2000–2005)</li></ul><table><tr><td><a href="/wiki/Next_Group">Next Group</a> (since 2024)</td><td><a href="./Song">Song</a></td></tr></table><h2>References</h2><ul><li><a href="./Journalist">Journalist</a> 2025</li></ul>'
        self.assertEqual(wikipedia_group_titles(html),['Next Group','Early Group'])

if __name__=='__main__':unittest.main()
