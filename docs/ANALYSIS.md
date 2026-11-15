# Analysis data pipeline

The existing analysis route now has activity, profile statistics, music credits, birthplace maps and PCA/FAMD/clustering views. Original short-window comparison remains in a disclosure. Existing artist/member IDs and localStorage are unchanged.

## Refresh

```
python -m pip install -r requirements-analysis.txt
python -m collectors.analysis_activity
python -m collectors.music_credits
pnpm analysis:features
python -m collectors.multivariate --input public/data/analysis-features.json --output public/data/multivariate.json
pnpm build
```

The existing publisher also writes `analysis-activity.json` on data publication. GitHub Pages builds regenerate all analytical artifacts after registry synchronization. No additional YouTube requests are issued for analysis: already fetched timestamps are retained for up to 90 days. Historical 30/90-day coverage is not invented; caches that previously promised 14 days cannot establish larger totals without an exhaustion/coverage marker.

Activity rows separate official, confirmed/inferred external and individual activity; all-zero/unknown rows are omitted. Values from incomplete archives are lower bounds. Only explicit appearance/event IDs merge derived uploads. Missing dates break plotted lines; only fully checked official windows permit zero-filled dates. Category bars count observed videos once using Shorts, LIVE, broadcast, radio, music, official-content, external priority.

`analysis-features.json` uses a fixed KST reference date from the source artifact. Unknown values stay null. Content-type proportions are withheld because external archive completeness is unknown. Career credit diversity and self-credit rates are withheld until discographies are sufficiently collected. Group/solo fits are separate; insufficient solo data produces an explanation instead of coordinates.

See MUSIC-CREDITS.md, MAPS.md and MULTIVARIATE.md for source, license and statistical details. P3/P4 remain in ANALYSIS-BACKLOG.md.
