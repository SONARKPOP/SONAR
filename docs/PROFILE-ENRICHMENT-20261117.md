# Cached profile and title-song enrichment — 2026-11-17

This offline pass reused the existing local Namuwiki SQLite document cache. It made no new network requests and did not require official cross-checking before first-line registration. Every registered fact retains `namuwiki_collected`, its source article URL, the 2026-08-29 snapshot date and the checked date. This snapshot does not claim live November agency status.

## Applied scope and changes

- Female registry scope: **647 artists** (529 groups, 112 solo profiles, six duos). **558 source documents processed; 89 unavailable or identity-ambiguous**. The total registry also includes 84 male and three mixed records; none was edited by this pass.
- **552 registry files changed**, with pre-change backups under ignored `work/profile-enrichment-backups/2026-11-17/`.
- **95 missing solo birthdays**, **94 missing exact debut dates** and **83 solo debut dates** registered. Only full, calendar-valid source dates are accepted; year-only text never becomes January 1. Group/career debut and explicitly labeled solo debut remain separate.
- **798 agency/label history entries**: 439 current agency, 254 former agency, 102 current label, 3 former label. These categories are based on the source snapshot. Previous-company collapsibles, strikethroughs and explicit ended date ranges are historical; record-label and management roles remain separate.
- **Eight conflicting debut-date facts** remain recorded in `reports/profile-enrichment-20261117.json` and field evidence rather than overwriting existing values. For example, TWICE's own expanded profile row says 2015-10-20, while the earlier stored date is 2015-10-14; the existing value remains pending conflict resolution.
- **Two nationality parser errors corrected**: 비아 (`person-a459bfc7242e62ad`, beauty-box) and 딘다 (`person-d719b531bb410684`, secret-number). Their source nationality is explicitly 인도네시아. The previous substring match also added India because 인도 occurs inside 인도네시아. Nationalities now contain `ID` only, with previous values and correction provenance retained. Parser boundaries and parsed-cache version were updated.

## Schema and evidence

Solo birthdays are stored in `personProfile.birthDate` and `personProfile.birthDatePrecision`, with `personProfile.profileSources` and `personProfile.fieldEvidence`. Existing higher-level evidence and conflicting values are preserved. Exact debut dates use top-level `debutDate`; explicit solo debuts use `soloDebutDate`. Existing person/member IDs, channel settings, membership relations and stronger official evidence are retained.

Top-level `agencyHistory` entries contain `agencyId`, `name`, `role` (`agency` or `label`), `status` (`current` or `former`), nullable `startDate`/`endDate`, `sourceUrl`, `dumpDate`, `checkedAt`, `sourceType` and `verificationStatus`. Known company aliases reuse a stable company ID. Other IDs are source-scoped local identifiers, never invented external identifiers. Independent/unaffiliated status is evidence in `fieldEvidence.agencyStatus`; it does not create a fake company. Older nested `personProfile.agencyHistory` entries are preserved and must be combined by consumers when needed.

Identity matching prefers existing source-document relations, then a unique exact registry alias with its own artist profile, then a unique qualified profile title. Disambiguation pages and person profiles for group IDs are rejected. Three misleading person/group alias matches discovered in audit were restored from backup and explicitly marked unavailable.

## Mandatory title-song first-line collection

**316 new source-backed title/lead or title/follow-up listings** were registered from **26 artist documents with explicit title columns**. There are now **350 song rows**, while the previous **34 credited works, 34 recordings and 35 release-track appearances remain unchanged**. The music catalog contains 31 artists and 39 evidence sources.

Title-only rows use `canonicalBasis: explicit_source_title_song_listing`, `workId: null`, `recordingIds: []`, `promotionRole: title` or `title_or_followup`, `releaseContext`, `sourceLocator` and `sourceIds`. They are title-listing facts, not claims of 316 newly resolved compositions or recordings. Album context and release date are retained only where explicit; unknowns remain null. No composer, producer, ISRC, track position or recording identity is inferred from a song title. The UI labels these rows as first-line title listings and shows the release context and source.

The repeatable collector accepts only explicit `타이틀곡` or `타이틀곡 및 후속곡` columns with album context. It handles merged rows, source year headings and multiple titles separated by source line breaks. Supporting-track columns and unrelated tables such as “타이틀곡 별 메인보컬” are rejected. Sources that combine title and follow-up songs are not promoted to a title-only claim. Source-local IDs prevent blind title merging across versions/releases.

Collection is **partial**: 532 processed documents lacked supported explicit title columns; other artist/dedicated discography documents were unavailable in this cache or ambiguous. This report does not claim that every artist's title songs are complete. Full album-track and contributor-credit expansion remains optional and was not attempted in this pass. Prior 34-work credit data is preserved.

Birthdays and exact group debut dates alone do not prove that a particular current member was in the debut lineup. This pass does not manufacture membership join dates or group debut-average ages; those statistics must remain unfilled when the required membership evidence is unknown.

## Repeatable commands

Use the configured Python runtime with optional dump dependencies installed:

```text
python -m collectors.profile_enrichment --cache <existing-cache>/documents.sqlite --report reports/profile-enrichment-20261117.json --apply
python -m collectors.title_songs --cache <existing-cache>/documents.sqlite --profiles reports/profile-enrichment-20261117.json --apply
```

Both commands support dry-run operation without `--apply`. Music title collection backs up the pre-title seed under ignored `work/music-title-backups/`. Structured facts and hashes are stored; raw source documents are not redistributed.

## Verification

- `tests.test_profile_enrichment`, `tests.test_namuwiki_register`, `tests.test_music_credits`: **22 focused Python tests passed**.
- Profile parser tests cover domestic/country and actor/music rowspan rows, distinct solo dates, year-only dates, historical company collapsibles, label separation, identity exclusions and Indonesia/India boundaries. Title tests cover line breaks and exclusion of supporting tracks/unrelated tables.
- Full registry validation ran before profile writes. Music catalog source/ID/role/relation validation ran before title writes.
- Read-only `collectors.completeness` output saved to ignored `work/profile-enrichment-completeness.json` before reporting registry coverage.
- Generated public catalogs, full tests, build, sync, commit and push are left to the parent integration task.
