import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock
from collectors.source_policy import approved_original
from collectors.youtube import resolve
from collectors.publish import publish


class SourcePolicyTests(unittest.TestCase):
    def test_fan_reupload_and_gossip_sources_are_rejected_before_api(self):
        for kind in ('fan', 'reupload', 'gossip', 'aggregator'):
            source = {'id':'excluded', 'official':False, 'collectionEnabled':True,
                      'publisherReview':{'status':'approved','kind':kind,'evidenceUrl':'https://example.com'}}
            self.assertFalse(approved_original(source))
            api = Mock()
            self.assertEqual(resolve(api,{'channels':[source]}),{})
            api.get.assert_not_called()

    def test_existing_unapproved_record_is_not_republished(self):
        record = {'id':'youtube__abc123DEF45','platform':'youtube','platformId':'abc123DEF45',
                  'channelId':'fan','publishedAt':'2026-11-05T00:00:00Z','groupIds':['a']}
        config = {'groups':[{'id':'a'}],'members':[],'channels':[{'id':'fan','official':False}], 'taxonomy':{}}
        with tempfile.TemporaryDirectory() as tmp:
            publish([record],config,output=tmp)
            self.assertEqual(list((Path(tmp)/'content').glob('*.json')),[])
