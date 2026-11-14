---
name: sonar-ui-filtering
description: UI Filtering. Change SONAR artist/video filters and MY GROUPS usability.
---

- Reuse ArtistDirectory, DirectoryFilters, SidebarGroupRow and filterContent.
- Use OR within each dimension and AND between dimensions. Build channel facets with the same conditions and omit the facet's own selection.
- Keep stored groups, viewing checks, favorites and exclusions distinct. Preserve localStorage migrations.
- Keep mobile controls compact and accessible. Modify only the needed components, without rewriting main.jsx.

