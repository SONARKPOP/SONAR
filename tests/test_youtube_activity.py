import unittest
from collectors.activity import calculate_activity, effective_upload, group_snapshot, eligible_group, iso, DAY
from collectors.channel_activity import collect_channel, refresh
from unittest.mock import Mock, patch
from tempfile import TemporaryDirectory
from pathlib import Path

NOW=1804507200
def rows(count,age):return [{'id':str(i),'at':iso(NOW-age)} for i in range(count)]
def calc(values,**kwargs):return calculate_activity(values,NOW,checked_at=iso(NOW),**kwargs)

class ActivityTests(unittest.TestCase):
    def test_public_artist_scope_includes_solo_duo_mixed_and_unknown_debut(self):
        for profile in ({'gender':'girl'}, {'gender':'mixed','artistType':'duo'},
                        {'gender':'girl','artistType':'solo'}, {'gender':'girl','debutYear':1995}):
            self.assertTrue(eligible_group(profile))
        self.assertFalse(eligible_group({'gender':'boy','artistType':'group'}))
        self.assertFalse(eligible_group({'gender':'girl','directoryVisibility':'agency-only'}))

    def test_unknown_reasons_distinguish_channels_from_pending_counts(self):
        group={'id':'g'}
        source={'id':'s','platform':'youtube','groupIds':['g'],'official':True,
                'verification':{'basis':'reviewed'},'verificationStatus':'SUPPORTED'}
        for sources,reason in (([], 'no-dedicated-channel'),
                               ([{**source,'shared':True}], 'no-dedicated-channel'),
                               ([{**source,'verificationStatus':'UNVERIFIED'}], 'channel-review-required'),
                               ([{**source,'collectionEnabled':False}], 'collection-disabled'),
                               ([{**source,'unavailableReason':'channel-not-found'}], 'channel-unavailable'),
                               ([source], 'awaiting-first-scan')):
            snapshot=group_snapshot(group,sources,{},NOW)
            self.assertEqual(snapshot['activity_status'],'UNKNOWN')
            self.assertEqual(snapshot['reason'],reason)

    def test_handle_cache_survives_resolved_id_but_not_a_different_channel(self):
        source={'id':'s','platform':'youtube','groupIds':['g'],'official':True,
                'handle':'@artist','platformId':'UC'+'1'*22,
                'verification':{'basis':'reviewed'},'verificationStatus':'VERIFIED'}
        cache={'s':{'configuredIdentity':'@artist','channelId':source['platformId'],
                    'complete':True,'checkedAt':iso(NOW),'uploads':rows(3,0)}}
        self.assertEqual(group_snapshot({'id':'g'},[source],cache,NOW)['activity_status'],'SURGE')
        self.assertEqual(group_snapshot({'id':'g'},[{**source,'platformId':'UC'+'2'*22}],cache,NOW)['reason'],'awaiting-first-scan')

    def test_new_artist_types_reuse_cache_and_respect_read_budget(self):
        profiles=[{'id':'solo','gender':'girl','artistType':'solo'},
                  {'id':'duo','gender':'mixed','artistType':'duo'}]
        sources=[{'id':p['id'],'platform':'youtube','platformId':'UC'+str(i)*22,
                  'groupIds':[p['id']],'official':True,'verification':{'basis':'reviewed'},
                  'verificationStatus':'VERIFIED'} for i,p in enumerate(profiles,1)]
        config={'groups':profiles,'channels':sources}
        api=Mock();api.budget=None
        def collected(api,source,current):
            return {'configuredIdentity':source['platformId'],'channelId':source['platformId'],
                    'complete':True,'checkedAt':iso(current),'uploads':rows(1,0)}
        with TemporaryDirectory() as tmp, patch('collectors.channel_activity.collect_channel',side_effect=collected) as collect:
            snapshots=refresh(api,config,Path(tmp),NOW)
            self.assertEqual({v['activity_status'] for v in snapshots.values()},{'SAILING'})
            self.assertEqual(collect.call_count,2)
            refresh(api,config,Path(tmp),NOW+60)
            self.assertEqual(collect.call_count,2)
        with TemporaryDirectory() as tmp, patch('collectors.channel_activity.collect_channel') as collect:
            api.budget=Mock()
            api.budget.remaining.return_value=3
            snapshots=refresh(api,config,Path(tmp),NOW)
            collect.assert_not_called()
            self.assertEqual(snapshots['solo']['reason'],'awaiting-first-scan')
    def test_surge_count_boundaries(self):
        for age,threshold in [(DAY,3),(3*DAY,10),(5*DAY,15)]:
            # One fresh upload satisfies the required 48-hour gate.
            with self.subTest(age=age):
                before=rows(threshold-2,age)+[{'id':'fresh','at':iso(NOW)}]
                self.assertNotEqual(calc(before)['activity_status'],'SURGE')
                self.assertEqual(calc(before+[{'id':'extra','at':iso(NOW-age)}])['activity_status'],'SURGE')
    def test_rolling_window_and_48h_gate(self):
        self.assertEqual(calc(rows(3,DAY))['activity_status'],'SURGE')
        self.assertNotEqual(calc(rows(3,DAY+1))['activity_status'],'SURGE')
        self.assertEqual(calc(rows(10,2*DAY))['activity_status'],'SURGE')
        self.assertEqual(calc(rows(10,2*DAY+1))['activity_status'],'SAILING')
        self.assertEqual(calc(rows(10,3*DAY+1))['uploads_3d'],0)
        self.assertEqual(calc(rows(15,5*DAY+1))['uploads_5d'],0)
    def test_age_boundaries(self):
        for age,state in [(3*DAY,'SAILING'),(3*DAY+1,'COASTING'),(90*DAY-1,'COASTING'),(90*DAY,'ANCHORED'),(365*DAY-1,'ANCHORED'),(365*DAY,'LOST SIGNAL')]:
            self.assertEqual(calc(rows(1,age))['activity_status'],state)
    def test_sailing_windows(self):
        self.assertEqual(calc(rows(2,7*DAY))['activity_status'],'SAILING')
        self.assertEqual(calc(rows(1,7*DAY))['activity_status'],'COASTING')
        self.assertEqual(calc(rows(4,14*DAY))['activity_status'],'SAILING')
        self.assertEqual(calc(rows(4,14*DAY+1))['activity_status'],'COASTING')
    def test_unknown_and_deduplication(self):
        for kwargs in [{'complete':False},{'official':False},{'error':'api-failure'}]:self.assertEqual(calc(rows(4,0),**kwargs)['activity_status'],'UNKNOWN')
        self.assertEqual(calc([])['activity_status'],'UNKNOWN')
        self.assertEqual(calc(rows(1,0)*4)['uploads_24h'],1)
        self.assertEqual(calculate_activity(rows(4,0),NOW,checked_at=iso(NOW-25*3600))['activity_status'],'UNKNOWN')
        self.assertEqual(calc([{'id':'future','at':iso(NOW+1)}])['activity_status'],'UNKNOWN')
    def test_upload_types_and_live_reservations(self):
        raw={'id':'v','status':{'privacyStatus':'public'},'snippet':{'publishedAt':iso(NOW-DAY)}}
        self.assertIsNotNone(effective_upload(raw,NOW))
        self.assertIsNone(effective_upload({**raw,'snippet':{**raw['snippet'],'liveBroadcastContent':'upcoming'}},NOW))
        self.assertIsNone(effective_upload({**raw,'liveStreamingDetails':{'scheduledStartTime':iso(NOW+DAY)}},NOW))
        live={**raw,'liveStreamingDetails':{'actualStartTime':iso(NOW-60)}}
        self.assertEqual(effective_upload(live,NOW)['at'],iso(NOW-60))
        self.assertIsNone(effective_upload({**raw,'status':{'privacyStatus':'private'}},NOW))
    def test_shared_channel_and_secondary_failure(self):
        g={'id':'g'};source={'id':'official','official':True,'platform':'youtube','groupIds':['g'],'verification':{'basis':'checked'},'verificationStatus':'VERIFIED'}
        cache={'official':{'complete':True,'checkedAt':iso(NOW),'uploads':rows(4,0)}}
        self.assertEqual(group_snapshot(g,[source],cache,NOW)['activity_status'],'SURGE')
        self.assertEqual(group_snapshot(g,[{**source,'groupIds':['g','other']}],cache,NOW)['activity_status'],'UNKNOWN')
        self.assertEqual(group_snapshot(g,[source,{**source,'id':'missing'}],cache,NOW)['activity_status'],'UNKNOWN')
        unreviewed={key:value for key,value in source.items() if key!='verificationStatus'}
        self.assertEqual(group_snapshot(g,[unreviewed],cache,NOW)['activity_status'],'UNKNOWN')
    def test_pagination_checks_more_than_ten_items(self):
        api=Mock();source={'id':'g-official','platformId':'UC'+'1'*22,'expectedChannelNames':['Group']}
        api.get.side_effect=[{'items':[{'id':source['platformId'],'snippet':{'title':'Group'},'contentDetails':{'relatedPlaylists':{'uploads':'UU1'}}}]},
            {'items':[{'contentDetails':{'videoId':'a','videoPublishedAt':iso(NOW)}}],'nextPageToken':'next'},
            {'items':[{'contentDetails':{'videoId':'b','videoPublishedAt':iso(NOW-20*DAY)}}]}]
        api.videos.side_effect=[[{'id':'a','status':{'privacyStatus':'public'},'snippet':{'channelId':source['platformId'],'publishedAt':iso(NOW)}}],
                                [{'id':'b','status':{'privacyStatus':'public'},'snippet':{'channelId':source['platformId'],'publishedAt':iso(NOW-20*DAY)}}]]
        result=collect_channel(api,source,NOW)
        self.assertTrue(result['complete']);self.assertEqual(len(result['uploads']),1)
        self.assertEqual(api.videos.call_count,2)
        self.assertEqual(api.get.call_args.kwargs['pageToken'],'next')
    def test_api_failure_is_unknown_and_cache_reused(self):
        config={'groups':[{'id':'g','gender':'girl','artistType':'group','debutYear':2024}], 'channels':[{'id':'s','platform':'youtube','platformId':'UC'+'1'*22,'official':True,'groupIds':['g'],'verification':{'basis':'checked'},'verificationStatus':'VERIFIED'}]}
        api=Mock();api.budget=None;api.get.side_effect=RuntimeError('API error')
        with TemporaryDirectory() as tmp:
            self.assertEqual(refresh(api,config,Path(tmp),NOW)['g']['activity_status'],'UNKNOWN')
            refresh(api,config,Path(tmp),NOW+60)
            self.assertEqual(api.get.call_count,1)
    def test_legacy_sources_without_expected_names_still_check_identity(self):
        api=Mock();source={'id':'g-official','name':'Expected Artist','platformId':'UC'+'1'*22}
        api.get.return_value={'items':[{'id':source['platformId'],'snippet':{'title':'Unrelated creator'}}]}
        with self.assertRaisesRegex(ValueError,'channel-identity-changed'):collect_channel(api,source,NOW)
        self.assertEqual(api.get.call_count,1)
    def test_persisted_microsecond_rounding_is_not_future_data(self):
        current=NOW+0.1234567
        data=[{'id':str(i),'at':iso(current)} for i in range(3)]
        self.assertEqual(calculate_activity(data,current,checked_at=iso(current))['activity_status'],'SURGE')

    def test_upload_intervals_and_legacy_snapshot_freshness(self):
        from collectors.activity import RULES, stamp
        from collectors.upload_cadence import upload_interval_hours
        current=stamp('2026-11-07T00:00:00Z')
        for age, hours in [(0, 9.5), (7, 16.5), (15, 24.5), (30, 72), (90, 168),
                           (180, 360), (365, 720), (730, 2160)]:
            self.assertEqual(upload_interval_hours(current-age*DAY,current,RULES),hours)
        self.assertEqual(calculate_activity(rows(1,800*DAY),NOW,checked_at=iso(NOW-89*DAY))['activity_status'],'LOST SIGNAL')
        self.assertEqual(calculate_activity(rows(1,800*DAY),NOW,checked_at=iso(NOW-91*DAY))['activity_status'],'UNKNOWN')

    def test_daily_slots_are_spread_and_not_repeated_at_midnight(self):
        from collectors.activity import RULES, stamp
        from collectors.upload_cadence import scheduled_slot, source_due_slot
        midnight = stamp('2026-11-07T15:00:00Z')
        after = midnight + 25*60
        band = RULES['uploadCadence'][0]
        slots = {scheduled_slot(str(i), band, after) for i in range(60)}
        self.assertEqual(slots, {midnight + offset*60 for offset in range(-5, 26, 5)})
        source = {'id':'sample-channel','handle':'@sample'}
        slot = scheduled_slot(source['id'], band, after)
        checked = {'identity':'@sample','checkedAt':iso(slot)}
        self.assertIsNone(source_due_slot(source, {}, after, RULES, checked, midnight-DAY))
        self.assertEqual(source_due_slot(source, {}, after, RULES, {}, midnight-DAY), slot)

if __name__=='__main__':unittest.main()
