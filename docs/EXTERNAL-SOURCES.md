# External source collection

Verified 2026-11-06: STUDIO CHOOM, 1theK, Dingo Music, KBS CoolFM, MMTG and it's Live.
Source evidence links are stored in config/channels.json. Channel identities are checked against the YouTube API title before use.

External sources scan up to four uploads-playlist pages (200 uploads) per full collection. Official group sources retain the existing one-page workflow setting. No per-group YouTube search is added. Existing rolling quota limits still apply.

Only explicit title group aliases connect external uploads to artists. Member tags additionally require matching group context, even for names that are unique in the local catalog. Description boilerplate is ignored. These tags do not certify that a person appears in the full video. Unknown artists and ambiguous aliases remain unassigned. Historical uploads beyond the scan window are not guaranteed.

Source ownership is stored independently in contentTypes, so an external performance can appear in MUSIC and External. Shorts remain confined to the Shorts view. Song/radio/variety defaults are used only for dedicated sources; mixed channels retain title-based type inference. Live NOW remains restricted to artist official channels.


## Program discovery reference

Reviewed SCENE-FLIX (https://adam-yam.github.io/SCENE-FLIX/) and its published EXTERNAL_CATS/EXTERNAL_LABELS on 2026-11-06. It organizes performances, radio, variety, interviews, promotions, events, challenge behind-the-scenes and other appearances by program. SONAR uses broad categories and independently authored publisher-scoped title rules; no SCENE-FLIX video list or implementation is imported.

New publisher candidates: M2 (@MnetM2), KBS Kpop (@KBSKpop), MBC Radio (@radiombc), Arirang Radio (@arirangradio; formerly Music180Arirang), 1theK Originals (@1theKOriginals), TEO (@TEO_universe). Runtime API identity checks gate each source. Source URLs are in config/channels.json.

Programs include Relay Dance, Tingle Interview, LA Deja Vu, Lee Mujin Service, Idol 1N2D, Gap Crush, Idol Silence, Idol Backstage, Killing Voice and Salon Drip. A title match applies only on the configured publisher; editorial overrides take precedence. Program filter buttons use the existing SONAR discovery UI. Videos without a recognized program remain under their channel. Multiple programs on the same publisher share one upload scan.

Events, advertisements and cross-artist challenge appearances need individual evidence; they are not assigned solely because another archive lists them. The current 200-upload window is not a complete historic archive.


## Hosts, guests and historical discovery

External content includes individual idol hosts, regular cast and episode guests. Group-owned uploads are not a prerequisite: external title matching covers all supported directory groups, including those awaiting official-channel verification.

Workman (@workman) and Wassup Man (@WassupMan) are additional publishers. Workdol has reviewed program-scoped title aliases for HAEWON/NMIXX and TSUKI/Billlie. An episode must match both its publisher/program and a reviewed cast name; a show is never assigned wholesale to every past host. Ordinary cast records use role=participant because a title alone cannot distinguish host, guest, substitute or compilation. The official host compilation HImR7CR_zs0 is retained as a reviewed historical seed, with publisher credits and explicit linked members. Its actual API publisher must match the configured source.

Explicit publisher description lines starting with Guest:, Starring:, or the equivalent Korean cast/guest labels may establish group context. Unlabelled description lists and social boilerplate remain ignored. Member tags still require explicit title mentions, program-scoped reviewed evidence or a per-video editorial override. No full-video appearance verification is claimed.

Each external source refreshes its recent 200 uploads and advances two additional historical pages (up to 100 older uploads) per full run. Per-source playlist cursors are stored in public/data/external-backfill.json only after successful publishing. Invalidated cursors restart historical paging while recent results are retained; authentication/quota failures remain fatal. Existing read/search budget limits apply. History is filled progressively, not claimed complete after one run. Multiple links to the same video retain one canonical record.
