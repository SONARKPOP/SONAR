"""Held-out synthetic names, separate from the rule-development examples.

This measures deterministic policy behavior, not actual video-viewing accuracy.
"""
import unittest
from collectors.appearance_review import AppearanceResolver,apply_resolution

class HeldOutAppearanceTests(unittest.TestCase):
 def test_unseen_names_and_scripts(self):
  config={'groups':[{'id':'lumen','aliases':['LUMEN']},{'id':'nimbus','aliases':['NIMBUS']}],
   'members':[{'id':'l-rina','groupId':'lumen','aliases':['RINA','리나']},
              {'id':'n-rina','groupId':'nimbus','aliases':['RINA','리나']},
              {'id':'l-aoi','groupId':'lumen','aliases':['アオイ']},
              {'id':'l-bom','groupId':'lumen','aliases':['봄']}]}
  resolver=AppearanceResolver(config);source={'official':False,'groupIds':[]}
  cases=[('LUMEN 리나 인터뷰','l-rina','inferred'),('RINA episode','l-rina','needs_review'),
         ('#アオイ interview','l-aoi','inferred'),('봄 산책','l-bom','needs_review'),
         ('LUMEN 봄 무대','l-bom','inferred'),('[원곡: LUMEN] cover','lumen','mention')]
  for title,identity,state in cases:
   v=apply_resolution({'id':'youtube__heldout','platformId':'heldout','title':title,'groupIds':[],'memberIds':[]},source,config,decisions={},resolver=resolver)
   self.assertTrue(any(e['artistId']==identity and e['state']==state for e in v['appearanceLinks']),title)
   if state in ('needs_review','mention'):self.assertNotIn(identity,v['memberIds']+v['groupIds'])
  self.assertFalse(resolver.matches('봄맞이 배경 RINATO'))

if __name__=='__main__':unittest.main()
