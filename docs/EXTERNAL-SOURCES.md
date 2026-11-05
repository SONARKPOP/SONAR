# External source collection

Verified 2026-11-06: STUDIO CHOOM, 1theK, Dingo Music, KBS CoolFM, MMTG and it's Live.
Source evidence links are stored in config/channels.json. Channel identities are checked against the YouTube API title before use.

External sources scan up to four uploads-playlist pages (200 uploads) per full collection. Official group sources retain the existing one-page workflow setting. No per-group YouTube search is added. Existing rolling quota limits still apply.

Only explicit title group aliases connect external uploads to artists. Member tags additionally require matching group context, even for names that are unique in the local catalog. Description boilerplate is ignored. These tags do not certify that a person appears in the full video. Unknown artists and ambiguous aliases remain unassigned. Historical uploads beyond the scan window are not guaranteed.

Source ownership is stored independently in contentTypes, so an external performance can appear in MUSIC and External. Shorts remain confined to the Shorts view. Song/radio/variety defaults are used only for dedicated sources; mixed channels retain title-based type inference. Live NOW remains restricted to artist official channels.


## Program discovery reference

Reviewed SCENE-FLIX (https://adam-yam.github.io/SCENE-FLIX/) and its published EXTERNAL_CATS/EXTERNAL_LABELS on 2026-11-06. It organizes performances, radio, variety, interviews, promotions, events, challenge behind-the-scenes and other appearances by program. SONAR uses broad categories and independently authored publisher-scoped title rules; no SCENE-FLIX video list or implementation is imported.

New publisher candidates: M2 (@MnetM2), KBS Kpop (@KBSKpop), MBC Radio (@radiombc), Arirang Radio (@Music180Arirang), 1theK Originals (@1theKOriginals), TEO (@TEO_universe). Runtime API identity checks gate each source. Source URLs are in config/channels.json.

Programs include Relay Dance, Tingle Interview, LA Deja Vu, Lee Mujin Service, Idol 1N2D, Gap Crush, Idol Silence, Idol Backstage, Killing Voice and Salon Drip. A title match applies only on the configured publisher; editorial overrides take precedence. Program filter buttons use the existing SONAR discovery UI. Videos without a recognized program remain under their channel. Multiple programs on the same publisher share one upload scan.

Events, advertisements and cross-artist challenge appearances need individual evidence; they are not assigned solely because another archive lists them. The current 200-upload window is not a complete historic archive.
