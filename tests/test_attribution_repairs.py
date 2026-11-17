import unittest
import json
import tempfile
from pathlib import Path
from collectors.youtube import read_config, normalize, prune_stale_attribution
from collectors.publish import publish


class AttributionRepairTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.config=read_config()
        cls.channel=next(c for c in cls.config['channels'] if c['id']=='its-live')

    def video(self,title):
        return normalize({'id':'test-video','snippet':{'title':title,'description':'','publishedAt':'2026-11-17T00:00:00Z','channelTitle':'Test'}},self.channel,self.config)

    def test_fromis_chaeyoung_does_not_become_twice_solo(self):
        for title in ['프로미스나인 채영 인터뷰','fromis_9 LEE CHAEYOUNG(이채영) Stay This Way','fromis_9 지원&채영의 밴드라이브']:
            v=self.video(title)
            self.assertNotIn('twice',v['groupIds']);self.assertNotIn('chaeyoung',v['groupIds'])
            self.assertIn('person-3a73f1cd0bfce652',v['memberIds'])
        self.assertIn('tw-chaeyoung',self.video('TWICE CHAEYOUNG interview')['memberIds'])

    def test_hyojung_and_chaeryeong_particles_are_member_tags(self):
        self.assertIn('person-6775f1fd651e6b2d',self.video('오마이걸 효정의 볼륨을 높여요')['memberIds'])
        self.assertIn('itzy-member-608992372543',self.video('ITZY 채령이 왔어요')['memberIds'])

    def test_description_credit_does_not_override_the_group_context(self):
        raw={'id':'credit-video','snippet':{'title':'프로미스나인 이채영 인터뷰','description':'출연: 채영','publishedAt':'2026-11-17T00:00:00Z','channelTitle':'Test'}}
        v=normalize(raw,self.channel,self.config)
        self.assertNotIn('twice',v['groupIds']);self.assertNotIn('chaeyoung',v['groupIds'])

    def test_baekah_song_title_is_not_csr(self):
        for title in ['백아 - 첫사랑','첫사랑(백아) cover','백아의 첫사랑 라이브']:
            self.assertNotIn('csr',self.video(title)['groupIds'])
        self.assertIn('csr',self.video('첫사랑 CSR interview')['groupIds'])

    def test_former_groups_are_search_metadata_not_participation(self):
        v=self.video('메이딘 MADEIN 마시로 interview')
        self.assertIn('kep1er',v.get('careerGroupIds',[]))
        self.assertNotIn('kep1er',v['groupIds'])

    def test_retained_tags_are_repaired_without_losing_editorial_override(self):
        v=self.video('프로미스나인 채영 인터뷰')
        stale={**v,'groupIds':['fromis9','chaeyoung','twice'],'memberIds':['tw-chaeyoung']}
        fixed=prune_stale_attribution(stale,self.channel,self.config)
        self.assertEqual(fixed['groupIds'],['fromis9'])
        self.assertIn('person-3a73f1cd0bfce652',fixed['memberIds'])
        reviewed=prune_stale_attribution(stale,self.channel,self.config,{'groupIds':['twice'],'memberIds':['tw-chaeyoung']})
        self.assertEqual(reviewed['memberIds'],['tw-chaeyoung'])

    def test_publish_migrates_former_affiliation_without_counting_it_as_a_guest(self):
        v=self.video('메이딘 마시로 인터뷰');v.pop('careerGroupIds',None)
        config={**self.config,'groups':[g for g in self.config['groups'] if g['id'] in ('madein','kep1er')],
                'members':[m for m in self.config['members'] if m['id']=='kep1er-member-71cb89e49c1d'],
                'channels':[self.channel]}
        with tempfile.TemporaryDirectory() as tmp:
            publish([v],config,output=tmp)
            record=json.loads((Path(tmp)/'content'/f"{v['id']}.json").read_text(encoding='utf-8'))
            self.assertIn('kep1er',record['careerGroupIds']);self.assertNotIn('kep1er',record['groupIds'])
            index=json.loads((Path(tmp)/'groups/kep1er.json').read_text(encoding='utf-8'))
            self.assertEqual(len(index['items']),1)
            all_index=json.loads((Path(tmp)/'browse/all.json').read_text(encoding='utf-8'))
            self.assertEqual(len(all_index['items']),1)

if __name__=='__main__':unittest.main()
