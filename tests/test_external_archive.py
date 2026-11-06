import unittest
from unittest.mock import Mock
from collectors.external_archive import scan_uploads
from collectors.youtube import YouTubeHTTPError


class ExternalArchiveTests(unittest.TestCase):
    channel = {'uploadsPlaylistId':'uploads', 'collectionPages':1, 'archivePages':1}

    def test_refresh_and_resume_older_pages(self):
        api = Mock()
        api.get.side_effect = [
            {'items':[{'contentDetails':{'videoId':'recent'}}], 'nextPageToken':'A'},
            {'items':[{'contentDetails':{'videoId':'older'}}], 'nextPageToken':'B'}]
        ids, state = scan_uploads(api,self.channel)
        self.assertEqual(ids,{'recent','older'})
        self.assertEqual(state['nextPageToken'],'B')
        api.get.side_effect = [{'items':[], 'nextPageToken':'A'}, {'items':[]}]
        _, state = scan_uploads(api,self.channel,state)
        self.assertEqual(api.get.call_args.kwargs['pageToken'],'B')
        self.assertTrue(state['completed'])

    def test_stale_cursor_recovers_but_auth_error_is_fatal(self):
        old = {'playlistId':'uploads','nextPageToken':'stale','completed':False}
        api = Mock()
        api.get.side_effect = [{'items':[], 'nextPageToken':'A'}, YouTubeHTTPError('playlistItems',400)]
        _, state = scan_uploads(api,self.channel,old)
        self.assertEqual(state['nextPageToken'],'A')
        api.get.side_effect = [{'items':[], 'nextPageToken':'A'}, YouTubeHTTPError('playlistItems',403)]
        with self.assertRaises(YouTubeHTTPError):
            scan_uploads(api,self.channel,old)
