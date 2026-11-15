# Dump-first profile registration

Canonical inputs remain `config/groups/*.json`. This import does not create official channel evidence, enable new YouTube collectors, change existing IDs or erase former members.

## Run

```sh
python -m pip install -r requirements-dump.txt
python -m collectors.namuwiki_register --cache work/namuwiki-latest --online --report reports/namuwiki-registration.json
# Review the dry-run report, then register first-line facts:
python -m collectors.namuwiki_register --cache work/namuwiki-latest --online --apply --report reports/namuwiki-registration.json
python -m collectors.groups validate
python -m collectors.groups sync --preserve-attribution
python -m collectors.completeness --output reports/firstline-completeness.json
```

The SQLite reader retrieves indexed documents with bounded HTTP Range requests; it never downloads the entire 23.7GB database. Cached pages, documents and content-hash parser results are reused. Reports are checkpointed while traversing all targets. `--apply` backs up pre-change canonical bundles under ignored `work/namuwiki-backups/`. Keep the same cache directory when resuming. A network failure remains `source_unavailable`; a missing document is not evidence that an artist does not exist.

`config/namuwiki-targets.json` records the list-derived target titles, not full article bodies. Related list links are traversed. Missing category/template documents and groups without explicit lineups remain in the per-target report. Source snapshot: 2026-08-29; membership is not guaranteed current in November.

## Verification stages

1. `namuwiki_collected`: missing factual fields and explicit members register immediately with source URL and dump date. This is not official verification.
2. `wiki_cross_checked`: follow-up work must record independent supporting evidence, not merely two sites copying the same source.
3. `official_verified`: explicit official evidence can supersede conflicting values. Previous values and sources remain in `fieldEvidence`.

Existing nonempty facts are retained on conflict. Birth date precision, unknown membership dates and person IDs remain explicit. Canonical source-document identity takes precedence over name aliases. Same-year punctuation-equivalent group names reuse the existing group. Ambiguous identities remain in the review report instead of being merged by name alone.

Full field-change history stays in canonical files. The public catalog includes field sources and membership relations but omits duplicate fieldEvidence history to limit download size.

The broken optional Namuwiki API workflow has been retired. Existing YouTube collection and activity computation continue independently.

## Source conditions

Archive metadata labels the snapshot CC BY-NC-ND 4.0, while document front matter says CC BY-NC-SA 2.0 KR. These provider labels conflict. Preserve both in source metadata; do not redistribute the raw dump or article bodies. This project stores structured factual fields and citations. Recheck provider terms before redistributing source text.
