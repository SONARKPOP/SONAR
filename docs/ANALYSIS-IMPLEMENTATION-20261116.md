# SONAR analysis implementation — 2026-11-16

## Data audit

Source registry: 734 profiles (including 84 hidden boy profiles), 1,920 structured members, 1,776 dated births. Public catalog: 650 artists. Dedicated reviewed-channel evidence exists for 339 artist profiles (VERIFIED and SUPPORTED are distinct; this is not 339 official-verification claims). This stage adds **0 members, 0 birthdays and 0 channels**; it reuses existing IDs and source evidence.

No claim is made that the foundational database is complete. Unresolved channels, missing biography fields, career-wide credits and historical upload coverage remain data work.

## Implemented

- Existing analysis route extended with five views; new focused components instead of rewriting main.jsx. User preference storage is untouched.
- Profile mean/median/min/max/population SD, explicit debut-member age, DOB coverage, current/former/last-known members, debut elapsed years, nationality/agency summaries. Group and solo debut dates stay separate.
- 7/30/90-day official/external-confirmed/external-inferred/individual records, searchable descending columns, expandable daily/weekly/monthly lines and disjoint type bars. Unknown is not zero; all-zero/unknown rows are hidden.
- Explicit appearance-event deduplication; titles alone never merge appearances. No added YouTube calls for analytics.
- Credits schema/collector/UI with 2 artists, 3 release editions, 2 works, 2 recordings, 3 track appearances and 8 creators. Actual MusicBrainz records, clearly community-supported and partial. No invented Spotify credits.
- Equal Earth world map and separate Korean 17-province / 252-district boundary views. Search, artist filters, zoom/pan, region selection and member lists; explicit map licenses and birthplace provenance.
- Seed-42 standardized PCA and mixed-data FAMD/PCAmix-style analysis, missingness gates, exclusions, variance/loadings/contributions, K-means/silhouette and average-linkage hierarchy. Group/solo cohorts separate.

## Current analytical coverage

At source reference 2026-11-15T16:52:07Z: 404 artist rows meet age-feature coverage; 67 rows have complete checked official 30-day counts; 203 have positive observed activity within 90 days. Longer official histories remain partial where cache coverage cannot prove completeness.

The geographic index contains 1,955 deduplicated person records (structured members plus standalone solo identities): 1,166 resolved birth countries, 1,117 Korean province matches, 651 Korean district matches, 789 unresolved countries. Country matching is not official profile verification. No guessed city coordinates are plotted; foreign city-level geocoding/point markers remain unsupported.

PCA and FAMD each retain 383 group rows; current exploratory K-means proposes 5 and 2 groups respectively. These are characteristics, not popularity rankings. Solo data fails coverage requirements and is explicitly withheld. Complete content-type proportions and career credit diversity/self-participation features are withheld, not inferred from a two-song seed.

## Limits and next work

- Expand real discographies and role evidence through permitted APIs/official credits. Current 2-song coverage is a pipeline seed, not a complete music database.
- Verify missing source biography/channel facts and build complete, coverage-marked 30/90-day histories within quota.
- Foreign city geocoding needs a licensed, unambiguous gazetteer; current map remains country/known Korean administrative areas.
- Full agency history remains in artist profiles; this analysis summarizes current agencies. No demographic conclusions should be treated as population statistics when coverage is partial.
- P3/P4 are documentation only in ANALYSIS-BACKLOG.md; comments are not collected.

## Main files

UI: AnalysisPage.jsx, ActivityAnalysis.jsx, ActivityCharts.jsx, ProfileStatistics.jsx, MusicCredits.jsx, BirthplaceMaps.jsx, MultivariateAnalysis.jsx and focused CSS.
Calculations: artist-insights.js, analysis-data.js, birthplace-data.js, collectors/analysis_activity.py, collectors/music_credits.py, collectors/multivariate.py, scripts/analysis-features.mjs.
Pipeline: collectors/publish.py, channel_activity.py (reuse already-fetched timestamps), sonar.yml, requirements-analysis.txt. New source-backed credits and licensed map assets are separate from artist/video records.

See ANALYSIS.md for local refresh commands and the individual feature documents for methods and licenses.

## Executed validation

pnpm test: 118 passed. Python unittest discovery: 180 tests, OK with 12 skips for unavailable optional dump/parser dependencies. Production build passed (1,696 modules). Focused UI SSR checks cover route loading, missing artifacts and credit provenance. No real API collection was performed for this analytical refresh.

Supplementary checks: the previously skipped dump/parser modules passed separately with the existing optional dependencies (15 tests). Category-specific descending sort and official daily mean/deviation display were then added; focused activity/UI tests and the production build passed again.

