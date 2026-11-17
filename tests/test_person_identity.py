import unittest
from collectors.person_identity import resolve_person
from collectors.member_roster import reconcile


class PersonIdentityTests(unittest.TestCase):
    def setUp(self):
        self.member={'id':'stable','groupId':'group','name':'New Stage','formerNames':['Old Stage'],
                     'legalName':'New Legal','legalNameHistory':['Old Legal'], 'birthDate':'2000-01-02','aliases':[]}

    def test_rename_keeps_stable_id(self):
        for name in ['New Stage','Old Stage']:
            result=resolve_person({'name':name,'groupId':'group','birthDate':'2000-01-02','legalName':'Old Legal'},[self.member])
            self.assertEqual(result['memberId'],'stable')

    def test_legal_name_alone_cannot_merge(self):
        self.assertEqual(resolve_person({'name':'Unrelated','legalName':'New Legal','birthDate':'2000-01-02'},[self.member])['decision'],'review')
        self.assertEqual(resolve_person({'name':'New Stage','groupId':'group','legalName':'Conflicting Legal'},[self.member])['decision'],'review')

    def test_shared_profile_page_does_not_join_different_members(self):
        source={'birthDate':{'sourceUrl':'https://agency.example/roster'}}
        self.member['profileSources']=source
        self.assertEqual(resolve_person({'name':'Other Artist','profileSources':source},[self.member])['decision'],'new')

    def test_dob_conflict_and_ambiguous_name_are_reviewed(self):
        self.assertEqual(resolve_person({'name':'New Stage','groupId':'group','birthDate':'2001-01-02'},[self.member])['decision'],'review')
        other={**self.member,'id':'other'}
        self.assertEqual(resolve_person({'name':'New Stage','groupId':'group'},[self.member,other])['decision'],'review')

    def test_roster_integration_no_destructive_merge_or_duplicate_after_rename(self):
        bundle={'id':'group','members':[self.member], 'memberRoster':{'current':[{'name':'Old Stage','birthDate':'2000-01-02'}],
                'evidenceUrl':'https://artist.example/roster','checkedAt':'2026-11-17'}}
        result,report=reconcile([bundle])
        self.assertEqual([m['id'] for m in result[0]['members']],['stable'])
        self.assertEqual(report['review'],[])
        bundle['memberRoster']['current']=[{'name':'Old Stage','birthDate':'1999-01-02'}]
        result,report=reconcile([bundle])
        self.assertEqual(len(result[0]['members']),1)
        self.assertEqual(len(report['review']),1)


if __name__=='__main__': unittest.main()
