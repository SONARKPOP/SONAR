# Interface language coverage

The public interface supports Korean (KR), Japanese (JP), English (EN) and Spanish (ES). Navigation, the artist directory and expanded profiles, preferences, content controls, video cards, player accessibility labels, feedback, statistics, activity charts and maps use the shared language context.

Dates, counts, relative upload times and elapsed debut periods use the selected locale. KST remains explicit where applicable. Artist/group/member names, native legal names, original video titles, channel names, source text and URLs, internal IDs, and the English activity states are preserved. Translation does not promote wiki imports to official verification.

The music-credit and PCA/FAMD/clustering screens remain hidden until ready; their data and implementation are retained. Unused legacy directory screens are not public routes and are outside this public-interface completion check.

Tests validate dictionary parity and interpolation fields, all four rendered languages, keyboard/accessibility labels, dates/numbers, and original identity/source preservation. An initial parallel Vite test attempt hit a Windows cache rename error; the supported test command runs files serially (`pnpm test`).
