# Music credit collection — 2026-11-16

Added **32 distinct works, 32 recordings, 32 release-track appearances, seven releases, four artists and 61 source-scoped contributor/credit-party records**. The catalog now contains 34 works/recordings, 35 appearances, ten releases, six artists, 69 credit parties and 13 evidence sources. Existing MusicBrainz IDs and the two-release/one-recording The Feels relation are unchanged.

| Artist | Releases | Added distinct tracks | Credit evidence |
|---|---|---:|---|
| Nicole | First Romance (vocal tracks 1–5) | 5 | [Cached Namuwiki role table](https://namu.wiki/w/%EB%8B%88%EC%BD%9C%28%EC%B9%B4%EB%9D%BC%29%2F%EC%9D%8C%EB%B0%98%20%EB%AA%A9%EB%A1%9D) |
| myB | 심장어택(MY OH MY), 또또(DDODDO) (vocal tracks 1–2 each) | 4 | [Cached Namuwiki role tables](https://namu.wiki/w/%EB%A7%88%EC%9D%B4%EB%B9%84%28%EC%95%84%EC%9D%B4%EB%8F%8C%29) |
| P.O.P | Puzzle Of POP (tracks 1–6) | 6 | [Cached Namuwiki explicit per-track liner credits](https://namu.wiki/w/P.O.P) |
| SURAN | Walkin', Jumpin', FLYIN' PART1 (complete EP tracklists) | 17 | [Cached Namuwiki role tables](https://namu.wiki/w/SURAN); explicit Bugs liner credits independently checked for the latter two EPs |

Bugs release metadata corroborates [First Romance](https://music.bugs.co.kr/album/464431), [심장어택](https://music.bugs.co.kr/album/526987), [또또](https://music.bugs.co.kr/album/539253), [Walkin'](https://music.bugs.co.kr/album/20101090), [Jumpin'](https://music.bugs.co.kr/album/20239706), and [FLYIN' PART1](https://music.bugs.co.kr/album/17460776). Search-indexed full public album descriptions exposed explicit lyricist/composer/arranger credits for all 12 tracks on the latter two releases. These are marked `retailer_published_credits`, not official verification. Other role credits remain `namuwiki_collected`.

The existing local 2026-08-29 dump cache was read without copying article bodies into the repository. Four source document hashes, document modification times, snapshot dates and conflicting provider/document license labels are retained in source metadata. Only structured factual credits are registered.

## Decisions and unresolved evidence

- **Wish i could:** Namuwiki adds SURAN as composer; Bugs explicit liner credits list 전용준 and Philtre. The stored composer list follows Bugs, and the conflict remains in `review`.
- **P.O.P:** the compact table and explicit liner prose differ for YIP PEE lyricist spelling (`youknowjuno` versus `송준호(RBW)`). The prose spelling is retained without asserting an alias identity. START 161516 has no explicit lyricist; null remains unknown.
- Producer is kept separate from composer/arranger. No producer is inferred from instrumentation, biography, group membership or an album-wide production claim. 오늘 취하면 retains its source title mentioning SUGA, while the person-role identity remains unresolved in `review`.
- Contributor IDs are deterministic, source-scoped local IDs, never fabricated external identifiers. Collective/unclear credits (`3B`, `the channels`, `텐조와 타스코`, `Royal Dive`, `highhopes`) are explicitly unresolved credit parties. SURAN and 수란(Suran) in the same subject document share its credited identity; unrelated people are not joined by matching names.
- ISRC and ISWC remain null. Nicole/myB/P.O.P instrumental tracks are omitted and those tracklists are marked partial. Featured performers remain in titles; no unverified registry performer relation is invented.
- Direct Bugs album fetch returned HTTP403. Targeted additional dump requests (Palette, LILAC, CHAT-SHIRE, SQUARE UP) failed DNS lookup, so no credits from those unavailable documents were registered. KOMCA, Spotify, Apple Music and Melon credentials were not used or claimed.
- Izykite was reviewed as a possible next batch but deferred: cached I ZIP track ordering conflicts with Bugs; 소낙비 arrangement also omits a contributor in the dump. No unchecked import was made.

## Focused verification

- `python -m unittest tests.test_music_credits`: 7 passed, using bundled Python.
- `node --test tests/music-credits.test.js`: 1 passed; validates distinct roles, repeated-release deduplication, search and Namuwiki/Bugs provenance rendering.
- `build_catalog` validates all catalog relations with real registry IDs. Evidence source IDs, role layers, duplicate contributors and registry relations are now rejected when invalid. MusicBrainz refresh skips curated releases lacking a MusicBrainz release ID.
- Public generated files were intentionally not written by this collection task. No global tests, production build, reindex, commit or push was performed.
