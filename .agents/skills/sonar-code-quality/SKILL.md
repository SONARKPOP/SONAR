---
name: sonar-code-quality
description: Code Quality. Make focused SONAR fixes and run regression checks.
---

- Start with the failing entry point and its callers. Reuse existing behavior before introducing helpers.
- Run focused tests during edits, then relevant Python and frontend suites and a production build.
- Check git diff for unrelated changes and never replace newer remote data with local snapshots.
- Report executed checks and incomplete requirements separately.

