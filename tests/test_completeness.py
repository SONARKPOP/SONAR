import unittest
from collectors.completeness import audit


class CompletenessTests(unittest.TestCase):
    def test_candidates_review_and_public_scope_use_separate_counts(self):
        def group(gid,gender='girl',channel=None):
            return {'id':gid,'supported':True,'gender':gender,'members':[],'channels':[channel] if channel else []}
        source={'id':'a-channel','official':True,'platform':'youtube','groupIds':['a'],
                'verification':{'checkedAt':'2026-11-14','evidenceUrl':'https://official.example/artist'}}
        groups=[group('a',channel=source),group('b'),group('c'),group('d','boy')]
        report=audit(groups,candidates=[{'groupId':'b'},{'groupId':'outside'}])
        self.assertEqual(report['counts']['withRegisteredDedicatedChannel'],1)
        self.assertEqual(report['counts']['withReviewedDedicatedChannel'],0)
        self.assertEqual(report['counts']['candidateOnlyProfiles'],1)
        self.assertEqual(report['counts']['withoutChannelOrCandidate'],2)
        self.assertEqual(report['publicCounts']['profiles'],3)
        self.assertEqual(report['publicCounts']['withoutChannelOrCandidate'],1)
        source['verificationStatus']='VERIFIED'
        self.assertEqual(audit(groups)['counts']['withReviewedDedicatedChannel'],1)
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
