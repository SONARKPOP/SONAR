# Artist browser and career tags

Open `#artists` (sidebar: 전체 아티스트 목록). This is a separate route; MY GROUPS editing remains available. It shows all registered profiles independently of the sidebar's enabled artist types and selected groups.

- Browse general, inactive, archived, pending, or all statuses. The existing six/twelve calendar-month official-upload policy is used; archive status does not assert disbandment.
- Filter by artist type/debut year and sort by name/debut year. Name and career-tag search takes priority over all directory filters. Results are paginated at 48 profiles.
- MY GROUPS membership, heart/star/sprout, individual exclusions and exceptions edit the same saved preferences immediately. Favorites remain automatically protected from exclusion.
- `relatedGroupIds` describes solo/parent-group relationships. `previousGroupIds` describes reviewed previous-group career credits, including re-debuts; `careerEvidence` stores sources. Previous-group credits are display/search metadata and do not automatically classify every new-group video as featuring the old group.
- Reviewed initial previous-group credits: LUNEDI → Weeekly; VIVIZ → GFRIEND; ARTMS and Loossemble → LOONA; MADEIN → LIMELIGHT/Kep1er (member career credits). Other solo profiles display their existing parent-group relationships without claiming departure.

The video viewer is capped at 1100px and 88vw on desktop, remains responsive on mobile, previews the collected thumbnail before loading YouTube, and has separate copy-link / thumbnail-download controls. Thumbnail saving may be restricted by the image server; the original image link remains available for manual saving. Direct YouTube video-file downloading is not implemented by this static client.

The displayed data timestamp includes seconds in Asia/Seoul (KST), using the catalog's actual publication timestamp rather than page-load time.
