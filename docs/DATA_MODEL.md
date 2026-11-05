# SONAR data contract · schemaVersion 1

All timestamps are ISO 8601 with explicit offsets. UI schedules use Asia/Seoul. IDs are stable slugs; content uses `platform__platformId`. A canonical content record lives in exactly one `public/data/content/<id>.json`. Group indexes duplicate only discovery metadata, never a second authoritative video. Multi-group results are deduplicated before filtering, channel counts and pagination.

## Entities

| Entity | Fields / links |
| --- | --- |
| Group | id, name, aliases[], gender (`girl` initially; `boy`, `mixed` extensible), platforms[] |
| Member | id, name, aliases[], groupId; future memberships can become a relation with validity dates |
| Channel | id (internal), platform, handle, platformId (resolved by adapter), name, official, groupIds[], uploadsPlaylistId |
| Content | id, platform, platformId, title, description, publishedAt, groupIds[], memberIds[], channelId, channelName, category, subtypes[], tags[], format, thumbnail, durationLabel, live fields, source, demo |
| Schedule | id, title, groupIds[], startsAt, kind, location, url, demo |
| Taxonomy | categories[], subtypes[], formats[]; stable values are separate from navigation labels |

`category`: music / own / external / shorts. `subtypes`: multiple editorial classifications (MV, performance, behind, variety, etc). `tags`: multiple arbitrary editorial/AI tags. `format`: video / short / live. A non-YouTube adapter can supply post / image / carousel in a later schema version without changing group/member/channel identities. Do not overload platform IDs across services.

`source`: adapter and collectedAt. Later AI enrichment can add `tagging: {method, model, confidence, reviewedAt}`. Keep manual overrides authoritative. Live status derives only from the YouTube adapter; editorial tags cannot override live status or official-channel identity.

## Indexes / loading

1. Bootstrap only catalog and live snapshot.
2. With selected groups, request only `groups/<selected-id>.json`. With no selected groups, request `latest.json` (newest 72 discovery rows, all schedules).
3. Merge thin rows, dedupe IDs. OR selected groups; AND category + search + channel + member + subtype + format. Search matches title/channel/tags. Common external channels sort by distinct selected groups appearing, then count.
4. Slice 24 rows per page, fetch only their canonical files. Images use browser lazy loading. No iframe before explicit player click. In-memory cache retains previously fetched group/content files; a reload clears it.
5. Group discovery indexes are currently single files. At larger scale split each into cursor-based index shards or migrate server-side filtering; the current browser must load all discovery rows for a selected group to compute full filters.

## Collection boundaries

Official channel uploads link to the configured group. External channel uploads are linked only when configured group/member aliases match title or description. Latin aliases use word boundaries (`IVE` does not match `live`). This is heuristic, not comprehensive entity recognition: descriptions may mention unrelated artists. Review `config/overrides.json` for corrections.

`official` is an operator-maintained allowlist, not an automatic verification assertion. Verify handles before live deployment; unresolved handles fail the entire collection before publication. Never label an external source official just to surface it in LIVE NOW. Group-owned official sources must link to exactly their owning group. Shared label and broadcaster channels are registered once as external sources; their group links derive from aliases, never from blanket official-channel ownership.

Full collection refreshes all retained non-demo records through videos.list, removing unavailable/private videos; it fetches up to 100 recent uploads per configured source by default. `--pages 1..10` changes initial history depth. No scrape or unofficial schedule API is used. Automatic schedules are YouTube upcoming streams. Concerts, fan meetings, and broadcasts can be explicitly curated as schedule overrides with a source URL.

Every full collection resolves channel handles again and publishes only after API calls succeed. Individual files are atomically replaced locally; CI exposes the complete result only after successful static deployment. Known live/upcoming candidates refresh every 20 minutes; new candidates are discovered every 6 hours. LIVE NOW hides data older than 30 minutes and rechecks the snapshot every minute while open. Scheduled workflows can be delayed by GitHub: this is a periodically refreshed radar, not a guaranteed real-time service.

## Database migration

Use unique `(platform, platform_id)` on contents. Introduce content_groups, content_members, content_tags, channel_groups and schedule_groups join tables. Preserve the current IDs and JSON contract as the export/API response. Add adapters for Instagram/X/Weverse/Berriz only through each service's permitted API and credentials, not by repurposing YouTube IDs or changing the UI's group semantics. No account/community tables are needed for this scope.

## Group registry

`config/groups/<id>.json` owns each group's metadata, members and official channels. Four independent booleans control support, first-visit defaults, collection, and sample generation. `config/channels.json` owns shared external sources; `settings.json` owns display order; `taxonomy.json` owns tags/types. The former `sources.json` is removed. The registry validates all files before exposing a flattened adapter/UI contract. Full collection matches only collection-enabled groups, including on shared external sources.

`python -m collectors.groups wizard` provides interactive registration. add/import/set validate first and synchronize the public catalog/indexes. A newly registered group is supported but not default-selected or collected. UI bootstrap reads defaults from catalog, preserves saved choices and removes unsupported references. See [GROUPS.md](GROUPS.md).
