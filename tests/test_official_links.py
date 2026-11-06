import unittest
from collectors.registry import validate_official_links

class OfficialLinksTests(unittest.TestCase):
    def test_reviewed_platform_and_website_urls(self):
        for platform,url in [('berriz','https://link.berriz.in/web/main/IVE'),('weverse','https://weverse.io/h2h'),('x','https://x.com/Hearts2Hearts'),('website','https://example.com')]:
            validate_official_links([{'platform':platform,'url':url,'evidenceUrl':url,'checkedAt':'2026-11-06'}])

    def test_wrong_domains_credentials_and_unreviewed_links_are_rejected(self):
        for url in ['https://x.com.example.com/a','https://user:pass@x.com/a','javascript:alert(1)']:
            with self.assertRaises(ValueError):
                validate_official_links([{'platform':'x','url':url,'evidenceUrl':'https://example.com','checkedAt':'2026-11-06'}])
        with self.assertRaises(ValueError):
            validate_official_links([{'platform':'x','url':'https://x.com/a'}])

