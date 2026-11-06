import unittest
from collectors.broadcast import is_music_broadcast
from collectors.content_tags import apply_tags

class BroadcastTests(unittest.TestCase):
    def test_reviewed_stages_only_and_variety_precedence(self):
        for title in ['[예능연구소] RESCENE FullCam','With - RESCENE [뮤직뱅크/Music Bank] | KBS 261106 방송','[얼빡직캠] RESCENE - With','[MPD직캠] RESCENE']:
            self.assertTrue(is_music_broadcast(dict(title=title,channelId='kbs-kpop')))
        for title in ['뮤직뱅크 핑크캐비닛','Music Bank interview','음악중심 대기실 비하인드','입덕직캠 리액션','리무진서비스 라이브','릴레이댄스']:
            self.assertFalse(is_music_broadcast(dict(title=title,channelId='kbs-kpop')))
        self.assertFalse(is_music_broadcast(dict(title='Music Bank 직캠',channelId='fan')))
        tagged=apply_tags(dict(title='Music Bank RESCENE',channelId='kbs-kpop'),False)
        self.assertTrue(tagged['musicBroadcast']);self.assertIn('음악방송',tagged['tags'])
