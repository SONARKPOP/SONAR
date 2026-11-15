# SONAR phased analysis implementation

1. Reuse AnalysisPage/artist-insights. Extend sourced profile descriptive stats with denominators, exact-date age validation and explicit debut-lineup eligibility. Preserve IDs and stored preferences.
2. Build archive activity analysis separately from status engine: 7/30/90 rolling counts, current public official source vs confirmed/inferred outside appearances vs individual, null for unobserved, source coverage and observed lower bounds. Preserve SURGE thresholds. Add sorted search/detail charts. Only explicit event/work IDs deduplicate appearances; never collapse merely similar titles.
3. Music credit foundation: albums/releases, recordings/tracks, canonical works, creator-role entities with source evidence; actual MusicBrainz seed and bounded optional sync. No guessed Spotify writing credits.
4. Maps: shared person IDs, explicit birthPlace only, Equal Earth plus reusable South Korea admin geometry, unknown/ambiguous separate, representative admin points labelled.
5. Feature artifact: analysis-features.json {schemaVersion,asOf,rows:[{id,name,kind,numeric,categorical,coverage}]}. Reuse frontend demographic helper in a Node generator. Fixed snapshot asOf, null missing values. NumPy-only multivariate reads artifact, separates group/solo, seed42; excludes inadequate data and records reasons.
6. Reproducible PCA/FAMD/Kmeans/hierarchy with loadings/variance/k evaluation and cohort coverage; no ranking interpretation.
7. Wire focused components into AnalysisPage tabs, retain original menu/router. Build artifact scripts during CI build, not every UI render. Install only required small geo libraries; optional scientific dependency declared.
8. Record P3 purposes/inputs and P4 comments deferred, no implementation or comment API calls. Execute targeted + regression/build checks and report actual coverage.

Ownership: root AnalysisPage, artist-insights, archive analysis, feature generator, pipeline and translations. Credits agent isolated music modules/assets. Maps agent isolated geographic modules/assets. Multivariate agent isolated statistical engine/component. No shared-file rewrites.
