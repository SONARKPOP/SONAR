import unittest
from collectors.member_metadata import validate_member_metadata


class MemberMetadataTests(unittest.TestCase):
    def profile(self, value, precision):
        return {'birthDate': value, 'birthDatePrecision': precision,
                'profileSources': {'birthDate': {'sourceUrl': 'https://official.example/profile',
                                                'checkedAt': '2026-11-14'}}}

    def test_unknown_and_partial_dates_remain_exact(self):
        for profile in ({}, {'birthDate': None}, self.profile('2000', 'year'),
                        self.profile('2000-02', 'month'), self.profile('2000-02-29', 'day')):
            validate_member_metadata(profile)

    def test_impossible_or_mismatched_dates_are_rejected(self):
        for profile in (self.profile('2001-02-29', 'day'), self.profile('2000', 'day'),
                        self.profile('2000-13', 'month'), {'birthDate': None, 'birthDatePrecision': 'day'}):
            with self.assertRaises(ValueError):
                validate_member_metadata(profile)

    def test_field_source_and_checked_date_are_required(self):
        for profile in ({'birthDate': '2000-01-01', 'birthDatePrecision': 'day'},
                        {**self.profile('2000', 'year'), 'profileSources': {'birthDate': {'sourceUrl': 'https://official.example'}}}):
            with self.assertRaises(ValueError):
                validate_member_metadata(profile)
