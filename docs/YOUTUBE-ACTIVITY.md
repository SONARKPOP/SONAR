# Official girl-group YouTube activity

The activity icon describes YouTube uploads, never a group's real-world disbandment. It applies only to dedicated official channels of registered Korean girl idol groups debuting from 2000 through the current year. Solo, male and mixed artists retain their existing behavior. Shared agency channels, Topic channels and unreviewed candidates do not qualify.

## Rules

All constants live in `config/activity-rules.json`, imported by both Python and JavaScript. Windows include their exact lower boundary and use UTC timestamps, not calendar dates.

1. Missing official evidence, failed/incomplete scan, no valid upload, or evidence older than 24 hours: internal UNKNOWN; no icon.
2. Last upload at least 365 days ago: LOST SIGNAL. At least 90 days: ANCHORED.
3. Last upload within 48 hours AND at least 3 uploads/24h, 10/3d, or 15/5d: SURGE.
4. Last upload within 3 days OR at least 2/7d or 4/14d: SAILING.
5. Otherwise: COASTING.

Publication time is used for public ordinary videos and Shorts. Actual start time is used for a live that actually started. Scheduled-only lives, future publications, private videos, playlist modifications and duplicate video IDs are excluded. Multiple dedicated channels are unioned by video ID. A failed secondary channel makes the group's result UNKNOWN rather than undercounting it. Channel creation date is never compared with debut date.

## Collection and cache

`python -m collectors.channel_activity` uses the existing `YOUTUBE_API_KEY` secret and persistent rolling quota ledger. It does not use `search.list` and does not reset quota. Each source is cached for 6 hours. A run uses at most 80 read calls; oldest due sources go first. Metadata is batched in sets of 50. Upload playlists are paged until exhausted or a complete old page beyond 14 days is reached; a safety cap of 20 pages yields UNKNOWN when coverage cannot be established. This is independent of the 10-video preview collector.

The existing GitHub Actions schedule checks every 20 minutes and performs full content updates every 6 hours. Cached sources are skipped. With many sources and limited quota, first-time coverage takes multiple runs; no fabricated status is substituted. Errors are recorded per channel and retried after the cache interval. Builds recalculate cached activity without API calls. The frontend also recalculates rolling counts/age transitions while the page is open.

`public/data/channel-activity.json` contains channel snapshots and group aggregates. `catalog.json` contains the group's small activity payload and 14-day timestamps required for exact rolling windows; content card indexes remain independent. Existing actual videos and preference storage are retained.

## Channel database and review

`python -m collectors.channel_database` exports normalized Groups and YouTubeChannels to `public/data/girl-group-database.json` and detailed census reports in `docs/OFFICIAL-CHANNEL-CENSUS.*`. Fields include Korean/English names when known, nullable exact debut date, independent real-world group status, actual channel URL/ID/handle, verification evidence/date, channel history and a primary-channel flag. Unknown historical dates/statuses are not invented.

VERIFIED means a documented official-source review; SUPPORTED means corroborated external links. UNVERIFIED candidates remain outside collection. NOT FOUND must be explicitly accompanied by documented search evidence; an empty channel list never implies no official channel exists. Older legacy registrations lacking evidence remain UNVERIFIED. The source registry is `config/groups/<id>.json`; channel corrections do not require frontend edits. A channel ID remains stable when its handle changes. Current observed handles are retained in the activity snapshot for review.

`python -m collectors.channel_candidates` performs bounded daily discovery from Wikipedia/Wikidata and the organized KPOP DISCOVER official-links index. It records candidates and potential new artist pages only. It never approves or adds a group/channel automatically. Shared labels must still be rejected during review, including labels not matched by the candidate prefilter. No blocked-site circumvention, external dump download, or unofficial API is used. No NamuWiki dump has been obtained/imported.

## UI and validation

Icons are 15px with a 5px gap after names in MY GROUPS, the editor and the artist directory. Desktop hover/keyboard focus and mobile tap show English status, elapsed upload time and 7-day count. Tooltip clicks do not toggle group selection. Tooltips use a portal so the scrolling group list cannot clip them. Favorite colors, selection, language controls, localStorage, navigation and video browsing retain their existing structure.

Tests cover all five states, inclusive rolling windows, 24h/3d/5d count thresholds, the 48-hour gate, 90/365-day boundaries, duplicate IDs, started/reserved lives, stale/future/missing data, partial secondary sources, pagination and API failure/cache behavior. The census exposes incomplete source coverage; implementing the feature does not mean every historical group has been verified.
