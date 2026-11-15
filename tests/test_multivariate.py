import unittest
try:
    import numpy as np
except ImportError:
    raise unittest.SkipTest("Optional analysis dependencies not installed")
from collectors.multivariate import decompose, encode_categories, build_multivariate, cluster_data

class MultivariateTests(unittest.TestCase):
    def test_covariance_and_contributions(self):
        x=np.array([[-2.,-1.],[-1.,2.],[1.,-2.],[2.,1.]])
        out=decompose(x)
        self.assertTrue(np.allclose(out['eigenvalues'],np.linalg.eigvalsh(x.T@x/len(x))[::-1]))
        self.assertTrue(np.allclose(np.sum(out['contributions'],axis=0),1))
        self.assertTrue(np.allclose(out['scores'].T@out['scores']/len(x),np.diag(out['eigenvalues'])))
    def test_unbalanced_category_weight(self):
        z,levels=encode_categories(['a']*9+['b'])
        self.assertTrue(np.allclose(z.mean(axis=0),0))
        self.assertAlmostEqual(float(np.mean(z[:,0]**2)),.1)
        self.assertAlmostEqual(float(np.mean(z[:,1]**2)),.9)
        self.assertEqual(levels,['a','b'])
    def test_missing_never_becomes_observed_zero_and_reproducible(self):
        rows=[{'id':str(i),'name':str(i),'kind':'group','numeric':{'a':i,'b':i*i,'empty':None},'categorical':{'status':'a' if i<6 else 'b'}} for i in range(12)]
        rows.append({'id':'missing','kind':'group','numeric':{'a':None,'b':None}})
        payload={'asOf':'2026-11-15T00:00:00Z','rows':rows}
        a=build_multivariate(payload)
        self.assertEqual(a,build_multivariate(payload))
        result=a['analyses']['group']['pca']
        self.assertEqual(result['status'],'ready')
        self.assertIn('missing',[r['id'] for r in result['exclusions']['rows']])
        self.assertIn('empty',[r['name'] for r in result['exclusions']['columns']])
        self.assertEqual(a['analyses']['solo']['famd']['status'],'insufficient')
    def test_cluster_evaluation_and_no_forced_clusters(self):
        x=np.array([[i*.01,0] for i in range(6)]+[[10+i*.01,10] for i in range(6)])
        c=cluster_data(x)
        self.assertEqual(c['status'],'ready')
        self.assertEqual(c['selectedK'],2)
        self.assertGreater(c['evaluations'][0]['silhouette'],.9)
        self.assertEqual(len(c['hierarchy']),11)
        self.assertEqual(cluster_data(np.zeros((12,2)))['status'],'insufficient')
        self.assertEqual(cluster_data(x[:5])['status'],'insufficient')

    def test_low_numeric_coverage_does_not_turn_category_only_data_into_famd(self):
        rows=[{'id':str(i),'kind':'group','numeric':{'missing':None},'categorical':{'status':'a' if i<5 else 'b'}} for i in range(10)]
        result=build_multivariate({'rows':rows})['analyses']['group']['famd']
        self.assertEqual(result['status'],'insufficient')
        self.assertNotIn('points',result)

    def test_median_imputation_is_reported_and_all_axes_reconcile(self):
        rows=[{'id':str(i),'kind':'group','numeric':{'a':i,'b':i*i,'c':None if i<2 else i+3,'d':i%4},'categorical':{'unique':str(i),'status':'a' if i<8 else 'b'}} for i in range(12)]
        result=build_multivariate({'rows':rows})['analyses']['group']['famd']
        self.assertEqual(result['status'],'ready')
        c=next(p for p in result['preprocessing'] if p['name']=='c')
        self.assertEqual(c['imputed'],2)
        self.assertEqual(c['median'],9.5)
        self.assertAlmostEqual(sum(a['explainedVarianceRatio'] for a in result['axes']),1.)
        self.assertIn('unique',[c['name'] for c in result['exclusions']['columns']])
        for j in (0,1):self.assertAlmostEqual(sum(v['contributions'][j] for v in result['variables']),1.)
        self.assertTrue(all(np.isfinite(p['x']) and np.isfinite(p['y']) for p in result['points']))
