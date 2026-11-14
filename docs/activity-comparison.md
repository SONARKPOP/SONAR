# Activity comparison data

`collectors.publish.publish()` emits `public/data/activity-comparison.json` alongside the existing catalog. It reuses collected records and snapshots; it makes no API requests. Consumers can fetch this asset only when opening a comparison view.

- `officialUploads`: existing official-channel status and rolling-window counts, unchanged. UNKNOWN counts are null, never zero. `canCompare` requires a known snapshot checked within 24 hours and not past its validity time. Check this flag before ranking artists; stale snapshots retain their original status for inspection.
- `externalAppearances`: observed uploads from approved outside publishers, including music shows and radio. Counts describe the collected archive, not all real appearances. Publication time is the date basis. Publisher/manual participant evidence contributes to `confirmedCounts`; automatic attribution contributes to `inferredCounts`. Explicit mentions, original artists and cover targets do not count as appearances.
- `memberActivities`: separately counts individual activity attributed to a parent group, including solo records where the parent exists only in `individualActivity.groupIds`. These records do not inflate the parent's outside guest count.

Counts use the existing 24-hour, 3-, 5-, 7- and 14-day rolling windows. The asset includes its generation time and 14-day window start. `byType` describes the 14-day observed outside total, split into broadcast, radio and other external content. Scheduled lives, continuous stations, sample videos and future-dated records are excluded. A YouTube video ID counts once per artist. Shared appearances can count for multiple artists, so artist totals are not additive; `uniqueExternalVideos` gives the distinct outside-video total.

Official upload activity and real-world group status remain separate. This data contract prepares comparison consumers; it does not add a comparison screen or change existing activity rules, content tabs, selection storage or collection schedules.
