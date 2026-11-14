import copy
import unittest
from collectors.activity_comparison import build_comparison
from collectors.activity import iso, DAY

NOW=1804507200


class ComparisonTests(unittest.TestCase):
    def config(self):
        return {'groups':[{'id':'g','name':'Group','youtubeActivity':{
                    'activity_status':'SAILING','checked_at':iso(NOW),'uploads_24h':1,
                    'uploads_3d':1,'uploads_5d':1,'uploads_7d':2,'uploads_14d':3}},
                          {'id':'solo','name':'Solo','relatedMemberIds':['m']}],
                'members':[{'id':'m','groupId':'g'}],
                'channels':[{'id':'own','official':True,'groupIds':['g']},
                            {'id':'solo-own','official':True,'groupIds':['solo']},
                            {'id':'show','official':False,'publisherReview':{
                                'status':'approved','kind':'program','evidenceUrl':'https://publisher.example'}}]}

    def video(self,vid,**extra):
        return {'id':'youtube__'+vid,'platform':'youtube','platformId':vid,'groupIds':['g'],
                'channelId':'show','publishedAt':iso(NOW-DAY),'title':'Guest interview',**extra}

    def test_official_snapshot_is_separate_and_never_reclassified(self):
        config=self.config();before=copy.deepcopy(config)
        result=build_comparison([self.video('own',channelId='own'),self.video('outside')],config,NOW)
        g=result['artists'][0]
        self.assertEqual(g['officialUploads']['activityStatus'],'SAILING')
        self.assertEqual(g['officialUploads']['counts']['uploads_7d'],2)
        self.assertEqual(g['externalAppearances']['counts']['uploads_7d'],1)
        self.assertIsNone(result['artists'][1]['officialUploads']['counts']['uploads_7d'])
        self.assertEqual(config,before)

    def test_credit_confidence_deduplication_and_mentions(self):
        confirmed=self.video('one',appearanceEvidence=[{'groupId':'g','role':'participant',
                         'source':'publisher-credit-line','url':'https://publisher.example/video'}])
        mention=self.video('mention',appearanceEvidence=[{'groupId':'g','role':'mention'}])
        result=build_comparison([confirmed,confirmed,self.video('inferred'),mention,
                                self.video('future',publishedAt=iso(NOW+1)),self.video('demo',demo=True)],self.config(),NOW)
        external=result['artists'][0]['externalAppearances']
        self.assertEqual(external['counts']['uploads_7d'],2)
        self.assertEqual(external['confirmedCounts']['uploads_7d'],1)
        self.assertEqual(external['inferredCounts']['uploads_7d'],1)
        self.assertEqual(external['coverage'],'collected-archive')

    def test_solo_channel_is_not_a_parent_group_guest_appearance(self):
        video=self.video('solo',channelId='solo-own',groupIds=['solo'],
                         individualActivity={'artistId':'solo','groupIds':['g']})
        group=build_comparison([video],self.config(),NOW)['artists'][0]
        self.assertEqual(group['externalAppearances']['counts']['uploads_14d'],0)
        self.assertEqual(group['memberActivities']['counts']['uploads_14d'],1)

    def test_window_edges_publish_time_and_unapproved_sources(self):
        result=build_comparison([self.video('edge',publishedAt=iso(NOW-14*DAY)),
                                self.video('old',publishedAt=iso(NOW-14*DAY-1)),
                                self.video('fan',channelId='fan'),
                                self.video('scheduled',liveStatus='upcoming')],self.config(),NOW)
        self.assertEqual(result['artists'][0]['externalAppearances']['counts']['uploads_14d'],1)

    def test_old_snapshots_are_not_ready_for_comparison_and_source_types_are_separate(self):
        config=self.config()
        config['groups'][0]['youtubeActivity']['checked_at']=iso(NOW-2*DAY)
        config['channels'].append({**config['channels'][-1],'id':'mnet-kpop'})
        result=build_comparison([self.video('radio',externalType='radio'),
                                self.video('stage',channelId='mnet-kpop',title='Group Stage M COUNTDOWN',channelName='Mnet K-POP')],config,NOW)
        group=result['artists'][0]
        self.assertFalse(group['officialUploads']['canCompare'])
        self.assertEqual(group['officialUploads']['activityStatus'],'SAILING')
        self.assertEqual(group['externalAppearances']['byType']['radio'],1)
        self.assertEqual(group['externalAppearances']['byType']['broadcast'],1)
