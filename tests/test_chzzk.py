import unittest

from collectors.chzzk import curated_records, live_records, trusted_url


class ChzzkTests(unittest.TestCase):
    def test_live_tagged_by_reviewed_channel_and_public_only(self):
        cid = 'a' * 32
        source = {'groupIds': ['qwer']}
        item = {'liveId': 12, 'channelId': cid, 'liveTitle': 'QWER live',
                'openDate': '2026-11-08 18:00:00', 'tags': ['QWER', 'KPOP']}
        def get(path, **params):
            if path == 'channels':
                self.assertEqual(params['channelIds'], [cid])
                return {'data': [{'channelId': cid, 'channelName': 'QWER'}]}
            return {'data': [item, {**item, 'liveId': 13, 'adult': True},
                             {**item, 'liveId': 14, 'channelId': 'b' * 32}]}
        video, = live_records({cid: source}, get)
        self.assertEqual(video['sourceUrl'], 'https://chzzk.naver.com/live/' + cid)
        self.assertEqual(video['publishedAt'], '2026-11-08T09:00:00+00:00')
        self.assertEqual(video['groupIds'], ['qwer'])
        self.assertIn('QWER', video['tags'])
        self.assertIn('live', video['contentTabs'])

    def test_reviewed_records_are_deduplicated_and_reject_offsite_urls(self):
        self.assertFalse(trusted_url('chzzk', 'https://chzzk.naver.com.example/video/123'))
        entry = {'platform': 'chzzk', 'externalId': '123', 'groupIds': ['qwer'],
                 'sourceUrl': 'https://chzzk.naver.com/video/123',
                 'evidenceUrl': 'https://chzzk.naver.com/video/123', 'title': 'Performance'}
        video, = curated_records([entry, entry], {'qwer'})
        self.assertEqual(video['id'], 'chzzk__123')
