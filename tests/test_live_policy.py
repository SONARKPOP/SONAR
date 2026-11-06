import unittest
from collectors.live_policy import is_continuous_live

class LivePolicyTests(unittest.TestCase):
    def test_explicit_station_and_continuous_music_only(self):
        for title in ['BIBI STATION','비비 스테이션','24/7 KPOP Music Radio','연속 재생','24시간 음악 스트리밍']:
            self.assertTrue(is_continuous_live(dict(title=title,format='live')))
        for title in ['BIBI Concert Live','오늘 보이는 라디오','생일 기념 팬 라이브']:
            self.assertFalse(is_continuous_live(dict(title=title,format='live')))
        self.assertFalse(is_continuous_live(dict(title='BIBI STATION',format='video')))
