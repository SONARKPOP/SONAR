# Artist browser and career tags

Open `#artists` (sidebar above artist-type buttons: 전체 아티스트 목록). This is a separate route; MY GROUPS editing remains available. It shows all registered profiles independently of the sidebar's enabled artist types and selected groups.

- Browse general, inactive, archived, pending, or all statuses. The existing six/twelve calendar-month official-upload policy is used; archive status does not assert disbandment.
- Filter by artist type/debut year and sort by name/debut year. Name and career-tag search takes priority over all directory filters. All matching profiles appear in one compact scrolling list without pagination. A floating back-to-top button appears after scrolling.
- MY GROUPS membership, heart/star/sprout, individual exclusions and exceptions edit the same saved preferences immediately. Favorites remain automatically protected from exclusion.
- `relatedGroupIds` describes solo/parent-group relationships. `previousGroupIds` describes reviewed previous-group career credits, including re-debuts; `careerEvidence` stores sources. Previous-group credits are display/search metadata and do not automatically classify every new-group video as featuring the old group.
- Reviewed initial previous-group credits: LUNEDI → Weeekly; VIVIZ → GFRIEND; ARTMS and Loossemble → LOONA; MADEIN → LIMELIGHT/Kep1er (member career credits). Other solo profiles display their existing parent-group relationships without claiming departure.

The video viewer is 1080px wide when the full viewer and 24px outer gutters fit; on narrower screens it falls back to the original 740px maximum, remains responsive on mobile, previews the collected thumbnail before loading YouTube, and has separate copy-link / thumbnail-download controls. Thumbnail saving may be restricted by the image server; the original image link remains available for manual saving. Direct YouTube video-file downloading is not implemented by this static client.

The displayed data timestamp includes seconds in Asia/Seoul (KST), using the catalog's actual publication timestamp rather than page-load time.

YouTube playback quality is managed by the embedded player. The official quality-control API has been retired; no forced 480p/720p/1080p stepping is claimed. A preconnect is opened when the modal is shown, before the user requests the player; a thumbnail-backed loading state is shown while the iframe document loads. No player is loaded merely by browsing thumbnails.

Native YouTube controls are explicitly enabled at the bottom of the player (play/pause, progress, volume and quality menu where supported). The embed cannot enforce a default 720p quality.

Reviewed agency-only artist sources are hidden from the default catalog UI using directoryVisibility=agency-only, preserving their data for future dedicated-channel verification. This batch covers 1CHU, PUZZLE, E11iVYN (MOAI shared publisher) and 2EYES (SidusHQ shared publisher). The SONAR logo returns home; no extra sidebar Home button is added.
