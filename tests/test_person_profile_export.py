import copy
import unittest
from unittest.mock import patch
from collectors.registry import load_config

class PersonProfileExportTests(unittest.TestCase):
 def test_solo_profile_and_separate_debut_date_are_public_without_changing_ids(self):
  group={'id':'solo','name':'Artist','aliases':[],'gender':'girl','platforms':['youtube'],'artistType':'solo',
   'supported':True,'defaultSelected':False,'sampleEnabled':False,'collectionEnabled':False,'members':[],'channels':[],
   'soloDebutDate':'2020-01-02','personProfile':{'legalNames':{'ja':'公式名'},'nationalities':['JP']}}
  old=copy.deepcopy(group)
  with patch('collectors.registry.load_bundles',return_value=([group],[],{},{})):
   result=load_config()['groups'][0]
  self.assertEqual(result['personProfile']['legalNames']['ja'],'公式名')
  self.assertEqual(result['soloDebutDate'],'2020-01-02')
  self.assertEqual(result['id'],'solo')
  self.assertEqual(group,old)
