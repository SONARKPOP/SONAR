import unittest
from collectors.broadcast import is_music_broadcast
from collectors.content_tags import apply_tags

class BroadcastTests(unittest.TestCase):
    def test_reviewed_stages_only_and_variety_precedence(self):
        for title in ['[예능연구소] RESCENE FullCam','With - RESCENE [뮤직뱅크/Music Bank] | KBS 261106 방송','[얼빡직캠] RESCENE - With','[MPD직캠] RESCENE']:
            self.assertTrue(is_music_broadcast(dict(title=title,channelId='kbs-kpop')))
        for title in ['뮤직뱅크 핑크캐비닛','Music Bank interview','음악중심 대기실 비하인드','입덕직캠 리액션','리무진서비스 라이브','릴레이댄스','[V+음악중심] EP.7']:
            self.assertFalse(is_music_broadcast(dict(title=title,channelId='kbs-kpop')))
        self.assertFalse(is_music_broadcast(dict(title='Music Bank 직캠',channelId='fan')))
        tagged=apply_tags(dict(title='Music Bank RESCENE',channelId='kbs-kpop'),False)
        self.assertTrue(tagged['musicBroadcast']);self.assertIn('음악방송',tagged['tags'])

    def test_platform_neutral_tab_membership(self):
        cases = [
            ({'title':'[Music Bank] RESCENE'}, ['home','broadcast']),
            ({'title':'[MPD Fancam] RESCENE','channelId':'m2'}, ['broadcast']),
            ({'title':'[Inkigayo] RESCENE','format':'short','channelId':'sbs-kpop'}, ['broadcast','shorts']),
            ({'title':'[Inkigayo] RESCENE interview','channelId':'sbs-kpop'}, ['broadcast','external']),
            ({'title':'Leemujin Service live cover','channelId':'kbs-kpop'}, ['broadcast','external']),
            ({'title':'RESCENE official cover','official':True}, ['home','music','own']),
            ({'title':'RESCENE trailer','format':'short'}, ['teaser','shorts']),
            ({'title':'RESCENE cover','format':'short','externalType':'radio'}, ['radio']),
            ({'title':'Official MV','description':'Watch the teaser below','category':'music'}, ['home','music']),
        ]
        for fields, expected in cases:
            with self.subTest(fields=fields):
                row={'channelId':'kbs-kpop','format':'video','platform':'chzzk',**fields}
                self.assertEqual(apply_tags(row,fields.get('official',False))['contentTabs'], expected)
