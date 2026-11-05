# External source collection

Verified 2026-11-06: STUDIO CHOOM, 1theK, Dingo Music, KBS CoolFM, MMTG and it's Live.
Source evidence links are stored in config/channels.json. Channel identities are checked against the YouTube API title before use.

External sources scan up to four uploads-playlist pages (200 uploads) per full collection. Official group sources retain the existing one-page workflow setting. No per-group YouTube search is added. Existing rolling quota limits still apply.

Only explicit title group aliases connect external uploads to artists. Member tags additionally require matching group context, even for names that are unique in the local catalog. Description boilerplate is ignored. These tags do not certify that a person appears in the full video. Unknown artists and ambiguous aliases remain unassigned. Historical uploads beyond the scan window are not guaranteed.

Source ownership is stored independently in contentTypes, so an external performance can appear in MUSIC and External. Shorts remain confined to the Shorts view. Song/radio/variety defaults are used only for dedicated sources; mixed channels retain title-based type inference. Live NOW remains restricted to artist official channels.
