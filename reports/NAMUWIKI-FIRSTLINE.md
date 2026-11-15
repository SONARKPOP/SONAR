# Namuwiki first-line registration — 2026-11-16

Actual canonical registry and generated public catalog have been updated. These are first-line wiki facts, not official verification.

| Metric | Before | After |
|---|---:|---:|
| All canonical artist profiles (including retained hidden male profiles) | 514 | 734 |
| Structured member IDs | 229 | 1920 |
| Members with birth date | 32 | 1776 |
| Profiles with exact debut date | 3 | 514 |
| Groups with a roster | 28 | 388 |
| Unlinked roster names | 0 | 0 |

## Coverage and unresolved work

- 527 list links evaluated: 520 group documents checked; 6 country references and 1 disambiguation page excluded.
- 388 documents yielded explicit member lineups; 132 have no reliably extracted lineup. Every target has a result in `namuwiki-group-results.csv` and `namuwiki-registration.json`.
- 1,881 member documents checked; 1907 unique person IDs connected to source lineups, including 1827 with an individual document. 80 missing individual documents remain registered from explicit group lineups.
- Added 220 groups and 1,691 member IDs. Enriched 216 existing members. Birthday fields increased by 1744.
- 43 factual/membership conflicts retain existing values and candidate evidence. No new official channel verification or independent wiki/official cross-check was performed.
- LPG/L.P.G. reuses the existing group ID. Historical Iris (2005) is separate from IRRIS (2022). Twenty confirmed non-person table/UI entries were removed before final registration. No baseline IDs/channels/collection settings or populated birthdays were removed or replaced.
- Repeat execution: zero new groups, members or changed bundles. Existing member/group duplicates that need stronger identity evidence are not destructively merged.
- Generated catalog matches all expected IDs: 650 public profiles and 1920 members. Male archive profiles remain excluded from public scope.
- Category/template probes were absent in this snapshot. Broader category discovery and 132 unresolved lineups remain follow-up work; this is not a claim that every real-world girl group/member has been found.

## Files and next stage

Importer/parsers: `collectors/namuwiki_register.py`, `dump_markdown.py`, `dump_sqlite.py`. Registry/export and shared membership changes: `collectors/registry.py`, `completeness.py`, `groups.py`, `youtube.py`. Canonical data: `config/groups/*.json`; generated catalog and indexes: `public/data/`. Source metadata/targets: `config/namuwiki-*.json`. UI preserves layouts/localStorage and now distinguishes wiki-first facts from official verification.

Next: inspect `namuwiki-review.json`, cross-check independent wiki evidence, then official profiles/notices. Promote field-level status only with the relevant evidence. Snapshot is 2026-08-29, not live November information. Source license labels conflict; no raw article text/database is published. See `docs/NAMUWIKI-FIRSTLINE.md`.

Validation logs are under ignored `work/`; final test outcomes are recorded in `firstline-validation.json` after execution.
