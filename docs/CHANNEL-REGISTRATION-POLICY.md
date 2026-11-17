# Dedicated YouTube registration

Automatic registration accepts an exact artist title and matching handle (including an `official` suffix), provided the artist name and channel have no conflicting registry identity. A reviewed artist/agency page linking to the dedicated UC ID is independently sufficient. Owner cross-links are supporting evidence, not a universal requirement.

Fan, reupload, Topic, distributor/shared agency channels and conflicting UC IDs remain in `youtubeCandidates`. A name collision requires primary ownership review. An evidence URL by itself does not establish ownership. Exact metadata agreement is `SUPPORTED`; a reviewed primary ownership link is `VERIFIED`. The stored review contains the observed UC ID, name, handle, reason, evidence URL and actual observation date. Missing dates are never replaced with today's date.

The candidate registration entry point is:

```
python -m collectors.channel_candidates --register --metadata-cache work/youtube-channel-metadata.json
```

`--online` resolves missing metadata from public YouTube pages. `--apply` saves approved registrations and unresolved queues to the registry. New sources default to collection disabled; registration does not silently increase API collection. A human-reviewed individual channel can use `collectors.channel_review --apply`; `--official-evidence` explicitly asserts the supplied primary page links to that dedicated channel.

Person reconciliation preserves member IDs across current/former stage names and sourced legal-name history. Birth-date contradictions, unconnected legal-name contradictions and ambiguous matches enter review. Legal names alone never merge people. A shared agency/roster evidence page is not a canonical person identity. No existing person is deleted or merged.

## Offline review performed on 2026-11-17

The local candidate list and existing public metadata cache were evaluated without network calls or registry writes. Of 355 distinct artist/URL candidates, 3 satisfy the exact name/handle path and 352 remain unresolved. Cached observations were made on 2026-11-15; this run does not refresh those dates or establish new official-site verification.

The 3 supported decisions are GIRLSET (`@GIRLSET`), NiziU (`@NiziUOfficial`) and XG (`@xg_official`). This review does not claim they were newly discovered or newly registered: already registered identities can also satisfy the policy.

Unresolved reasons: 250 missing observed identities, 73 identity matches needing review, 13 shared agency/distributor names, 9 conflicting existing artist UC IDs, 3 fan/reupload/Topic markers, 2 handles belonging to another source and 2 UC IDs belonging to another source. Machine-readable decisions are in `work/channel-policy-review/channel-registration-review.json`.

Validation: 21 focused tests passed covering the registration command path, dedicated channel database, dump link matching, person identity and roster reconciliation. No full suite, production build, or publication was performed for this scoped change.

## Applied registration review

The three clear matches were subsequently applied through the registration command, limited with repeatable `--group` options and `--output work/channel-policy-apply`. Only those three registry files were backed up to `work/channel-policy-apply/registry-backup`; no public data files were edited. All three already had registered dedicated source IDs. The update preserves those IDs and UC IDs, adds observed handles and replaces the former broad identity rationale with `exact-name-and-handle`, retaining secondary evidence URLs. They remain `SUPPORTED`, checked on 2026-11-15; no primary-site verification is claimed.

| Artist / registry group ID | Existing stable source ID | UC ID |
| --- | --- | --- |
| GIRLSET / `gg-6183ab054811d4e7` | `gg-6183ab054811d4e7-dump-youtube-6191d134` | `UCSskmnvIhEy3nSZxxVKTeIg` |
| NiziU / `gg-58462020e43cb61a` | `gg-58462020e43cb61a-dump-youtube-c07ab68f` | `UCHp2q2i85qt_9nn2H7AvGOw` |
| XG / `gg-b5b6428214f222bb` | `gg-b5b6428214f222bb-dump-youtube-bf4fbebc` | `UC12HMtO5MYph9dCZZ7yygng` |

Evidence comes from the existing `work/youtube-channel-metadata.json` public channel observations and their channel URLs, not a newly fetched page. Applied subset report: 3 reviewed, 3 approved, 0 unresolved. The broader offline review still has 352 unresolved candidates. Full registry validation passes after application.
