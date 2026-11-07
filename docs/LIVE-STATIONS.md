# Live and station navigation

LIVE ON is located in the top fan-page notice, including the artist directory and collapsed-sidebar layout. It counts ordinary, currently confirmed official broadcasts only.

The normal-colored LIVE STATION tab sits immediately after the live-video tab. It uses the same day/night button styling as the other content tabs. BIBI STATION / 비비스테이션 and ITZY Playlist Station / 있지 플레이스테이션 are classified as continuous stations, excluded from normal live alerts and the Home/live-video feeds, and shown under LIVE STATION when the official broadcast is confirmed active.

`live.json` separates `items` and `stations` while keeping one shared verification timestamp. Both lists use the same 30-minute freshness limit, official-channel check, ended/reserved/demo exclusion and video-ID deduplication. Group selection, artist-type switches and exclusion settings still apply. A station is not declared active solely because an old video record says live.

Known stream IDs are refreshed before a large archive collection so an archive budget deferral does not prevent the small on-air refresh. Existing candidate discovery continues on its normal schedule; no new search calls are introduced.
