import unittest
from collectors.content_tags import apply_tags

class ContentTagTests(unittest.TestCase):
    def record(self,**extra):
        return {'title':'A video','category':'own','subtypes':['기타'],'tags':[],'format':'video',**extra}

    def test_broad_own_classification_and_nonexclusive_tags(self):
        record=apply_tags(self.record(title='VLOG holiday'),True)
        self.assertEqual(record['ownType'],'daily')
        self.assertIn('자체 콘텐츠',record['tags'])
        record=apply_tags(self.record(contentTypes=['own','external'],ownType='variety',externalType='interview'),True)
        self.assertIn('자체 콘텐츠',record['tags'])
        self.assertIn('외부 콘텐츠',record['tags'])
        self.assertEqual(record['externalType'],'interview')

    def test_live_label_and_no_member_inference(self):
        record=apply_tags(self.record(format='live',memberIds=[]),True)
        self.assertEqual(record['subtypes'],['라이브'])
        self.assertEqual(record['memberIds'],[])
        self.assertIn('라이브',record['tags'])

    def test_short_replaces_generic_subtype_without_inventing_member_tags(self):
        record=apply_tags(self.record(format='short',tags=['기타'],memberIds=[]),True)
        self.assertEqual(record['subtypes'],['쇼츠'])
        self.assertIn('쇼츠',record['tags'])
        self.assertNotIn('기타',record['tags'])
        self.assertEqual(record['memberIds'],[])

    def test_idempotence_and_invalid_editorial_data(self):
        first=apply_tags(self.record(),False)
        self.assertEqual(apply_tags(first,False),first)
        with self.assertRaises(ValueError):apply_tags(self.record(contentTypes=['unknown']),True)
        with self.assertRaises(ValueError):apply_tags(self.record(ownType='unknown'),True)
