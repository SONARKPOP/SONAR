# YouTube links and browsing update — 2026-11-16

The initial dump importer omitted YouTube links. `collectors/dump_youtube.py` now extracts channel-only addresses from profile sections, resolves the actual root `channelMetadataRenderer` identity (not recommended-video channel IDs), caches responses, and registers matching dedicated channels as SUPPORTED. Official-site cross-link verification remains a separate step. Existing source IDs, collection flags and member/group data are preserved.

- 375 normalized channel links across 345 group documents.
- 73 new dedicated channel identities, including 56 artists previously without a registered channel; the rest are secondary/regional identities.
- 114 links remain pending because of unavailable pages, unrelated names or existing ownership. Topic, company, VEVO and fan sources do not qualify for automatic dedicated-channel registration.
- Registration rerun creates no additional sources or profile changes. New source collection is off; this update connects links without silently changing API usage.

Source evidence and identities: `youtube-link-registration-summary.json` and `namuwiki-youtube-links.json`. The channel review exporter now includes canonical dump candidates. Applying the main dump importer includes this stage; `--skip-youtube` opts out.

UI changes: debut dates beside group/person names (year-only when that is the known precision), persistent return-to-videos and per-artist video buttons, compact home without the previous slogan, collapsible year/month controls, redundant group/category/format controls removed. The player starts at the top, with a draggable title bar, corner resize and two-finger title-bar gestures; keyboard arrows also move/resize. The embedded YouTube iframe stays mounted while geometry changes. Pinch on the cross-origin video itself cannot be intercepted, so gestures use the title bar.

The player reserves space near the top to keep searching usable, and stays within the viewport. Modal management closes when navigating to videos. Stored favorite IDs, group data and localStorage keys are retained.

Shorts/portrait content starts with a vertical player, while landscape content starts wide. Explicit aspect/dimensions take precedence over Shorts defaults; otherwise ordinary videos default to 16:9. Previous/next follows the displayed list captured when the video opens, without wrapping at either end. Shorts/portrait navigation also supports a dedicated swipe strip (up next/down previous), leaving native YouTube controls accessible. Same-orientation navigation preserves user geometry.
