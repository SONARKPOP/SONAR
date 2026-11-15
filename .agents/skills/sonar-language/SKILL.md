---
name: sonar-language
description: Translate SONAR interface text into Korean, Japanese, English and Spanish while preserving artist identities and data.
---

- Use src/i18n.js and the language context. Add every new UI label in all four languages.
- Translate component output as well as App output; preserve event handlers, refs and accessibility labels.
- Keep artist names, original legal names, titles, IDs, source citations and English activity states unchanged with data-no-translate.
- Use concise labels: 선호 / お気に入り / Favorites / Favoritos. Saved and selected are legacy storage concepts, not new UI categories.
- Format dates/numbers using the selected locale; identify KST explicitly for refresh timestamps.
- Never translate missing information into a factual claim or fabricate profile data.
- Test dictionary parity, profile preservation and the rendered new screens in all languages; build before publication.
