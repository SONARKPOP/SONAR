import tempfile
import unittest
from pathlib import Path
from collectors.registry import load_config, read
from collectors.publish import publish, write
from collectors.activate_review import activate
from collectors.youtube import normalize

class ActivationTests(unittest.TestCase):
    def test_promotion_reclassifies_members_and_removes_samples(self):
        config=load_config()
        channels=[]
        records=[]
        cases=[('uspeer','USPEER stage','#SIAN #SOEE #SEOYU #DAON #CHAENA #ROA'),('hearts2hearts','#CARMEN #STELLA',''),('rescene','RESCENE With MV Reaction','')]
        for i,(gid,title,description) in enumerate(cases):
            channel=next(c.copy() for c in config['channels'] if c['official'] and c['groupIds']==[gid])
            channel['platformId']='UC'+str(i).zfill(22)
            channels.append(channel)
            record=normalize({'id':f'actual-{i}','snippet':{'title':title,'description':description,'publishedAt':'2026-11-05T00:00:00Z','channelTitle':gid}},channel,config)
            if gid=='uspeer':record['memberIds']=[m['id'] for m in config['members'] if m['groupId']==gid]
            if gid=='rescene':record.update(category='music',subtypes=['MV'])
            records.append(record)
        with tempfile.TemporaryDirectory() as tmp:
            stage=Path(tmp)/'stage';output=Path(tmp)/'public'
            publish(records,{**config,'channels':channels},output=stage/'data')
            write(stage/'report.json',{'status':'api-success-review-pending','videoCount':3,'checkedAt':'2026-11-05T00:00:00Z'})
            sample={**records[0],'id':'youtube__demo-sample','platformId':'demo-sample','demo':True}
            publish([sample],config,output=output,demo=True)
            result=activate(stage,output)
            self.assertEqual(result['memberTaggedVideos'],1)
            self.assertFalse(read(output/'catalog.json')['demo'])
            self.assertFalse((output/'content/youtube__demo-sample.json').exists())
            self.assertEqual(read(output/'content/youtube__actual-0.json')['memberIds'],[])
            self.assertEqual(len(read(output/'content/youtube__actual-1.json')['memberIds']),2)
            reaction=read(output/'content/youtube__actual-2.json')
            self.assertEqual(reaction['category'],'own')
            self.assertEqual(reaction['subtypes'],['리액션'])
            self.assertFalse(reaction['metadataReview']['fullVideoWatched'])
            older={**records[2],'id':'youtube__older-record','platformId':'older-record'}
            publish([older],config,output=output)
            merged=activate(stage,output,merge=True)
            self.assertEqual(merged['videoCount'],4)
            self.assertTrue((output/'content/youtube__older-record.json').exists())

    def test_description_only_does_not_create_member_tag(self):
        config=load_config()
        channel=next(c for c in config['channels'] if c['id']=='rescene-official')
        raw={'id':'test','snippet':{'title':'손댄스 막내즈','description':'#MAY #ZENA #메이 #제나','publishedAt':'2026-11-05T00:00:00Z','channelTitle':'RESCENE'}}
        self.assertEqual(normalize(raw,channel,config)['memberIds'],[])
        raw['snippet']['title']='#MAY #ZENA 손댄스'
        self.assertEqual(len(normalize(raw,channel,config)['memberIds']),2)

if __name__=='__main__':unittest.main()
