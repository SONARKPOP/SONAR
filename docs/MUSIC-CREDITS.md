# Music credits foundation

`python -m collectors.music_credits` validates the curated source input and generates `public/data/music-credits.json` offline. Existing artist/member IDs are untouched. Input is `config/music-credits.json`.

## Actual collected scope

Two existing registry artists: TWICE and BLACKPINK. Two works, two recordings, three release-track appearances, eight credited people. TWICE **The Feels** appears on the Japan single and US signed/voice-memo edition with the same MusicBrainz recording and work IDs. BLACKPINK **DDU-DU DDU-DU** is track 1 of the selected SQUARE UP EP. These are selected real records, not full tracklists or full discographies. All producer, ISRC and ISWC fields are unknown (`null`). Composer, lyricist and recording arranger roles are separate; programming does not imply production. Review entries describe missing fields.

Evidence was reviewed on 2026-11-16 from the three MusicBrainz release pages linked in `sources`. MusicBrainz is a community database, not official credit verification. Artist MBIDs resolve from each release's own artist link; their group identities were compared against existing registry name, aliases and official profile evidence. No name-based person/member merge is performed.

## Schema version 1

Top level: `schemaVersion`, `generatedAt`, `coverage`, `sources`, `artists`, `albums`, `tracks`, `recordings`, `works`, `persons`, `songs`, `review`.

- `artists[].artistId` references the existing registry, with exact `externalIds.musicbrainzArtist` and identity evidence URLs.
- `albums` describes a release edition (`mb-release:<MBID>`), date, country, release type, source IDs and `tracklistComplete`.
- `tracks` is the release/disc/position occurrence and references `albumId` and `recordingId`.
- `recordings` has MusicBrainz recording identity, optional ISRCs, work reference and arranger/producer roles.
- `works` has MusicBrainz work identity, optional ISWCs and composer/lyricist roles.
- `persons` has source-linked external identities; does not change or fabricate registry member links.
- `songs` is the explicit canonical grouping: work ID plus recording IDs. Without a known work, use a distinct recording identity and `workId: null`; never merge normalized titles, translated versions, remixes or covers automatically. Same original recording across editions is one recording, with multiple track occurrences. A work may have multiple recordings; distinct recordings remain visible.
- Role values are person-ID arrays or `null` (unknown), never guessed from another role. Null identifiers are uncollected, not proof no identifier exists.
- Every source includes publisher, URL, date, method and verification status. Review items are `{entityId,field,reason}`.

## Optional network/cache

`MUSICBRAINZ_USER_AGENT` must contain an operator contact, e.g. `SONAR/1.0 (your actual contact URL)`. No key, Spotify credential or token is required or read. Without this environment setting, network refresh refuses to run. Default generation does not access the network.

`python -m collectors.music_credits --refresh-cache` fetches only the selected exact release MBIDs, verifies returned artist MBIDs against curated registry bindings, and caches JSON under `work/musicbrainz-cache`. Requests are sequential, at least 1.05 seconds apart; failures stop without replacing the public artifact. Cached metadata is retained for review, not automatically promoted to curated credit claims. `MusicBrainzClient.get(..., refresh=False)` reuses disk cache by default. No broad search, prohibited service scraping, or Spotify full-credit endpoint is assumed. The public API returned a busy response during this task; the checked-in seed was reviewed from accessible public MusicBrainz metadata pages.

MusicBrainz references: [API](https://musicbrainz.org/doc/MusicBrainz_API), [rate limits](https://musicbrainz.org/doc/MusicBrainz_API/Rate_Limiting), [data licenses](https://musicbrainz.org/doc/About/Data_License). Attribution is retained in the UI and artifact.

## Frontend integration

`import MusicCredits from './MusicCredits';`

Render `<MusicCredits data={musicCredits} catalog={catalog}/>` after loading `/data/music-credits.json` with the app's normal base-aware path. The component is safe with absent data. Pass the existing catalog (`groups` array) for artist labels. It owns its CSS import. The named export `musicSongRows(data, query='')` builds source-preserving canonical rows and searches titles, releases and credited participants. Search is local and does not issue network requests.

The component shows partial coverage, source dates, community provenance, unknown roles/identifiers, per-song credits and expandable release appearances. Parent integration owns fetching, loading/error state, and navigation. No shared translations, workflows or app entry points are modified by this module.

## Verification

`python -m unittest tests.test_music_credits`

`node --test tests/music-credits.test.js`

Tests use the actual checked-in seed to check repeated-release dedup, distinct role attribution, missing producer behavior, registry validation, search and server rendering.
