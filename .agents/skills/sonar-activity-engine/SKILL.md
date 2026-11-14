---
name: sonar-activity-engine
description: Activity Engine. Maintain exact official upload activity and API cadence.
---

- Read collectors/activity.py, channel_activity.py and config/activity-rules.json.
- Reuse public artist scope, reviewed dedicated channels, rolling windows and video-ID deduplication.
- Keep actual group status separate from YouTube activity. Preserve UNKNOWN reasons for missing or incomplete observations.
- Reuse caches and the quota ledger. Validate boundary counts, secondary-source failures and identity changes.

