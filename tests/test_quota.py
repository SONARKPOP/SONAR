import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from collectors.quota import QuotaGuard, BudgetExceeded
from collectors.youtube import YouTube

class QuotaTests(unittest.TestCase):
    def test_persistent_rolling_budget_including_repeat_runs(self):
        with tempfile.TemporaryDirectory() as tmp:
            path=Path(tmp)/'state.json'
            q=QuotaGuard(path,search_day=2,search_run=2,clock=lambda:100000)
            q.consume('search');q.consume('search')
            fresh=QuotaGuard(path,search_day=2,search_run=2,clock=lambda:100001)
            with self.assertRaises(BudgetExceeded):fresh.consume('search')
            later=QuotaGuard(path,search_day=2,search_run=2,clock=lambda:200000)
            later.consume('search')
            self.assertEqual(later.remaining('search'),1)

    def test_general_read_and_search_are_separate(self):
        with tempfile.TemporaryDirectory() as tmp:
            q=QuotaGuard(Path(tmp)/'state.json',search_run=1,read_run=2)
            q.consume('search');q.consume('videos');q.consume('playlistItems')
            with self.assertRaises(BudgetExceeded):q.consume('channels')
            self.assertEqual(q.run,{'search':1,'read':2})

    def test_retries_are_charged_before_network_and_stop_at_limit(self):
        with tempfile.TemporaryDirectory() as tmp:
            import urllib.error
            q=QuotaGuard(Path(tmp)/'state.json',search_run=1)
            api=YouTube('not-a-real-key',q)
            with patch('collectors.youtube.urllib.request.urlopen',side_effect=urllib.error.URLError('offline')) as get,patch('collectors.youtube.time.sleep'):
                with self.assertRaises(BudgetExceeded):api.get('search',part='snippet')
                self.assertEqual(get.call_count,1)
            self.assertEqual(len(json.loads(q.path.read_text())['calls']['search']),1)

    def test_discovery_rotation_and_remaining_budget(self):
        with tempfile.TemporaryDirectory() as tmp:
            q=QuotaGuard(Path(tmp)/'state.json',search_run=2)
            self.assertEqual(q.discovery_sources(['a','b','c']),['a','b'])
            q.advance_discovery(2,3)
            self.assertEqual(q.discovery_sources(['a','b','c']),['c','a'])
            q.consume('search');q.consume('search')
            self.assertEqual(q.discovery_sources(['a','b','c']),[])

    def test_invalid_history_is_not_silently_reset(self):
        with tempfile.TemporaryDirectory() as tmp:
            path=Path(tmp)/'state.json';path.write_text('{"calls":{"search":"invalid"}}')
            with self.assertRaises(ValueError):QuotaGuard(path)
