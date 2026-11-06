# Budgeted first collection for reviewed sources

When a full archive metadata refresh cannot fit the remaining rolling API budget, the collector may check up to 20 newly registered or identity-changed sources instead. It reserves two reads per source, batched metadata reads and retry headroom. No quota limits or history are reset.

The first pass reads at most 10 recent uploads per source and explicitly reviewed seed episodes. Seed episodes must belong to the approved publisher's resolved channel ID. Only public, artist-attributed records are published. The existing canonical archive is merged by platform/video ID and retained without pretending its metadata was refreshed. Existing live-feed confirmation times are preserved. Unchanged failed identities are not retried by this fallback.

`public/data/collection-report.json` records `mode: targeted-new-sources`, the checked source IDs, targeted record count and last full collection timestamp. Full periodic collection continues the bounded, rotating recent/archive scans when budget allows.

