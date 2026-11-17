import unittest
from collectors.affiliation_policy import career_group_ids, representative_career_group_ids

class AffiliationPolicyTests(unittest.TestCase):
    def test_no_future_affiliation_or_unknown_start_on_old_video(self):
        member = {'membershipHistory': [
            {'groupId': 'kep1er', 'startDate': '2022-01-03', 'endDate': '2024-07-15'},
            {'groupId': 'madein', 'startDate': '2024-09-03'},
            {'groupId': 'unknown', 'startDate': None}]}
        self.assertEqual(career_group_ids(member, '2023-02-01T00:00:00Z'), ['kep1er'])
        self.assertEqual(career_group_ids(member, '2025-01-01'), ['kep1er', 'madein'])
        self.assertEqual(career_group_ids(member, None), [])

    def test_unknown_start_uses_evidence_without_backdating(self):
        member = {'membershipHistory': [{'groupId': 'madein', 'startDate': None, 'asOf': '2026-08-29', 'sourceCheckedAt': '2026-11-16'}]}
        self.assertEqual(career_group_ids(member, '2025-01-01'), [])
        self.assertEqual(career_group_ids(member, '2026-09-01'), ['madein'])

    def test_imprecise_date_is_conservative(self):
        member = {'membershipHistory': [{'groupId': 'group', 'startDate': '2024'}]}
        self.assertEqual(career_group_ids(member, '2024-02-01'), [])
        self.assertEqual(career_group_ids(member, '2024-12-31'), ['group'])

    def test_manual_visibility_never_erases_history(self):
        member = {'membershipHistory': [{'groupId': 'refund-sisters', 'startDate': '2020-01-01'}]}
        self.assertEqual(career_group_ids(member, '2026-01-01'), ['refund-sisters'])
        self.assertEqual(representative_career_group_ids(member, '2026-01-01'), [])

if __name__ == '__main__':
    unittest.main()
