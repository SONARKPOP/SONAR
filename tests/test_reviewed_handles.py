import unittest
from collectors.youtube import expected_channel
from collectors.targeted import pending_sources

class ReviewedHandleTests(unittest.TestCase):
    def test_generic_title_is_accepted_only_with_reviewed_exact_handle_and_pinned_id(self):
        channel={'platformId':'UCCIf8GSzwbAakRsmCRX4TSQ','expectedChannelNames':['2NYNE'],'expectedHandles':['@2NYNEOFFICIAL']}
        self.assertTrue(expected_channel(channel,'OFFICIAL','@2NYNEOFFICIAL'))
        self.assertFalse(expected_channel(channel,'OFFICIAL','@not2nyneofficial'))
        self.assertFalse(expected_channel(channel,'OFFICIAL',''))
        self.assertFalse(expected_channel({**channel,'platformId':None},'OFFICIAL','@2NYNEOFFICIAL'))
    def test_reviewed_handle_change_retries_previously_rejected_identity(self):
        old={'id':'2nyne-official','platformId':'UCCIf8GSzwbAakRsmCRX4TSQ','collectionEnabled':True}
        new={**old,'expectedHandles':['@2NYNEOFFICIAL']}
        self.assertEqual(pending_sources({'channels':[new]},{'channels':[old]}),[new])

