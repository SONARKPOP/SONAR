import unittest
from collectors.completeness import audit


class CompletenessTests(unittest.TestCase):
    def test_aliases_former_members_and_catalog_scope(self):
        groups = [{'id': 'a', 'supported': True,
                   'members': [{'id': 'a-one', 'name': 'One', 'aliases': ['ONE NAME']}],
                   'memberRoster': {'current': ['one name'], 'former': ['Two']},
                   'channels': [{'id': 'a-channel', 'platform': 'youtube', 'official': True,
                                 'groupIds': ['a']}]},
                  {'id': 'hidden', 'supported': False, 'members': [{'id': 'hidden-one', 'name': 'Other'}]}]
        report = audit(groups, {'groups': [{'id': 'a'}], 'members': []})
        self.assertEqual(report['counts']['unlinkedRosterEntries'], 1)
        self.assertEqual(report['unlinkedRoster'][0]['section'], 'former')
        self.assertEqual(report['channelVerification'], {'MISSING': 1})
        self.assertEqual(report['catalogMismatch']['missingMemberIds'], ['a-one'])
        self.assertEqual(report['catalogMismatch']['missingGroupIds'], [])
