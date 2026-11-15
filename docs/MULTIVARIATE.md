# Reproducible multivariate exploration

Run `python -m pip install -r requirements-analysis.txt`, then:

```
python -m collectors.multivariate --input public/data/analysis-features.json --output public/data/multivariate.json
```

The input is schemaVersion 1, `asOf` ISO timestamp, and `rows` containing `id`, `name`, `kind` (`group` or `solo`), `numeric`, `categorical`, and optional source `coverage`. Only measured numeric values enter the analysis; JSON null, booleans, strings, NaN and infinity are missing. Source construction must enforce source-specific coverage before emitting a measured value. No runtime clock or generated example data enters the published result. Rows are sorted by ID and groups/solo artists are fitted separately. Seed 42 and policy thresholds are included in output. Identical input and NumPy environment produce identical JSON; different BLAS/NumPy versions can differ at floating-point precision, particularly tied eigenvalues.

## Eligibility and missing observations

Numeric columns need at least eight observed rows, 70% observed coverage, and nonzero variance. At least two numeric columns must survive. Rows need 70% observed coverage across eligible numeric columns; eight rows must survive. Remaining numeric gaps use the retained cohort's median, explicitly reported with count, mean, and scale. Constant columns after row filtering are removed. Zero is an observed value only when actually supplied as a finite number. Excluded columns and rows carry reasons. Insufficient cohorts return a status and explanation, never fabricated coordinates or clusters.

FAMD categories independently need 70% observed coverage, 2–12 distinct levels, and level count at most half the cohort size. Identifiers and high-cardinality labels therefore cannot become dominant proxies. Missing category values use expected category indicators, hence zero centered coordinates; their counts are reported. No artificial 'unknown' category is treated as an observed characteristic.

## PCA and FAMD mathematics

For PCA each numeric column is centered and divided by its population standard deviation (denominator n). SVD `X = U S Vᵀ` gives scores `U S`, eigenvalues `S²/n`, explained proportions `eigenvalue / sum(eigenvalues)`, coefficients `V`, loadings `V sqrt(eigenvalue)`, and per-axis column contributions `V²`. Axis signs are fixed so the largest absolute coefficient is positive. Axes describe variation, never merit, popularity or rank. Correlated age measures can double-count age; this is descriptive exploration, not causal inference.

For FAMD/PCAmix-style mixed analysis, concatenate standardized numeric columns and centered indicator columns `(indicator - p)/sqrt(p)`, where p is the observed category proportion. Do **not** standardize dummy variables again: for an imbalanced binary variable their variances are `1-p`, and this frequency weighting is essential. An observed categorical variable with q levels contributes q-1 total inertia, as in the standard mixed-data formulation; it is not arbitrarily rescaled to unit total block inertia. Category-level loadings are transformed-column loadings, not numeric correlations or aggregated variable eta-squared. Contributions shown in the interface are per transformed category. The decomposition and clustering use all eligible columns, while only the first two axes are plotted.

Primary references verified for the implementation:

- [PCAmixdata authors' reference manual, recod and PCAmix](https://chavent.r-universe.dev/PCAmixdata/doc/manual.html): standardized quantitative data concatenated with centered indicators divided by square-root category frequency.
- [Chavent et al., Multivariate Analysis of Mixed Data: The R Package PCAmixdata](https://arxiv.org/abs/1411.4911): mixed-data methods and links to PCA/MCA.

This is an explicitly documented NumPy implementation, not a claim of byte-for-byte equivalence with every FactoMineR missing-data convention.

## Clustering and evaluation

K-means uses the full preprocessed feature space, squared Euclidean objective, k-means++ initialization, ten deterministic restarts (seeds 42–51), up to 150 updates, and lowest-inertia restart per k. Explore k=2 through min(6, floor(n/3)). A proposed k requires every cluster to contain at least three rows and mean silhouette ≥0.25. Choose the highest eligible silhouette; ties prefer smaller k. Silhouette uses actual Euclidean pairwise distances, excludes self in within-cluster means and assigns singleton score zero. Reject identical profiles. Clustering is suppressed below 12 or above 500 rows to bound pairwise computation. A failed threshold means no recommended partition; silhouette is an internal exploratory measure, not proof of natural or stable populations.

Average-linkage agglomeration uses the same full-space Euclidean distances and emits n-1 merges with `left`, `right`, `distance`, `size`; leaves 0…n-1 follow `points` order, and subsequent merge IDs start at n. This hierarchy is an independently computed companion to K-means; it is not mislabeled as K-means linkage. Cluster numbers follow first retained member and carry no ordinal meaning. Feature summaries use observed numeric values only and report sample count and standardized difference from the imputed full-cohort mean.

## Export and integration

`build_multivariate(payload)` returns `{schemaVersion, asOf, seed, policy, analyses}`. `analyses.group.pca`, `.famd`, `analyses.solo.pca`, `.famd` always exist. Each result has `status`, `sampleSize`, `exclusions`; insufficient results have `reason`. Ready results additionally have `method`, `points`, `axes`, `variables`, `preprocessing`, and `clustering`. Points contain ID, name, x/y, and nullable cluster. Axes include population variance and explainedVarianceRatio. Variables contain name, kind, loadings, coefficients and contributions for the first two axes. Clustering includes status, evaluations, hierarchy, and clusters; ready clustering adds selectedK, labels and silhouette. `MultivariateAnalysis({data})` consumes this output and owns its stylesheet.

Tests use mathematical fixtures solely inside the test suite, never as published artist data. Run `python -m unittest tests.test_multivariate` and the full collector suite `python -m unittest discover -s tests`.
