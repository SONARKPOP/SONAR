# Favorites, artist profiles and analysis

The directory has Group and People tabs. Members and solo profiles resolve through
the existing person ID; ambiguous identities remain separate. Official shortcuts,
current/former lineup details and original-language names are retained.

The sidebar controls All, Active (SURGE/SAILING/COASTING), and independently combined
heart/star/sprout presets. Unchecking temporarily mutes videos, without removing
favorites. Old saved/selected storage values remain untouched for compatibility.
New preferences use `sonar.favorite-view.v1`, `sonar.favorite-scope.v1`,
`sonar.muted-artists.v1` and `sonar.hard-blocked.v1`.

Soft exclusions permit favorite co-stars. Skull exclusions are applied first to
videos, channel facets, calendar entries and live feeds; favorites cannot override
them. Restore entries in the directory's hard-block management scope.

`agencyHistory` is an additive array for artists and person profiles:
agencyId, name, status (current/former), optional startDate/endDate, sourceUrl,
sourceType, verificationStatus and checkedAt. Unknown contract dates stay absent.
Initial evidence includes JYP's official roster, YG's BABYMONSTER profile, and
reproduced official termination statements for HyunA's former agencies. This is
not an exhaustive agency survey; unresolved agencies remain unknown.

The Analysis page consumes the existing `activity-comparison.json`. Official
rolling-window uploads are independent of confirmed and inferred appearances in
the collected archive. Expired or missing official snapshots show a dash. Age
averages show known/current-member coverage and require exact birth dates. Debut
averages require confirmed membership at debut, rather than assuming the current
lineup debuted together. Multiple nationalities count once per person/country.

Use `sonar-language` for KR/JP/EN/ES labels. User names, titles, IDs and English
activity-state names remain unchanged. Use `sonar-code-cleanup` for read-only
unused-binding audits and focused removal; collector/migration public entry points
must not be deleted solely because they lack frontend imports.
