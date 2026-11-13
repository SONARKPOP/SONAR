import unittest
from collectors.member_roster import reconcile
from collectors.youtube import infer_members


class MemberRosterTests(unittest.TestCase):
    def group(self):
        return {'id': 'a', 'members': [{'id': 'existing', 'groupId': 'a', 'name': 'First', 'aliases': ['ONE']}],
                'memberRoster': {'current': ['one', 'Second'], 'former': ['Former'],
                                 'evidenceUrl': 'https://official.example/profile',
                                 'formerEvidenceUrl': 'https://official.example/history'}}

    def test_ids_history_and_retries(self):
        original = self.group()
        groups, report = reconcile([original])
        self.assertEqual(len(original['members']), 1)
        self.assertEqual(len(report['added']), 2)
        self.assertEqual(groups[0]['members'][0]['id'], 'existing')
        self.assertEqual(groups[0]['members'][-1]['membershipHistory'][0]['status'], 'former')
        again, repeated = reconcile(groups)
        self.assertEqual(groups, again)
        self.assertEqual(repeated['changedGroupIds'], [])
        self.assertEqual(repeated['added'], [])

    def test_unproven_or_ambiguous_names_are_reviewed(self):
        group = self.group()
        group['members'].append({'id': 'duplicate', 'groupId': 'a', 'name': 'Other', 'aliases': ['ONE']})
        group['memberRoster']['formerEvidenceUrl'] = None
        groups, report = reconcile([group])
        self.assertEqual(len(report['review']), 2)
        self.assertEqual(len(groups[0]['members']), 3)

    def test_imported_names_require_group_context_for_tagging(self):
        groups, _ = reconcile([self.group()])
        config = {'members': groups[0]['members']}
        self.assertEqual(infer_members({'title': 'Second interview'}, [], config), [])
        self.assertIn(groups[0]['members'][1]['id'], infer_members({'title': 'Second interview'}, ['a'], config))
