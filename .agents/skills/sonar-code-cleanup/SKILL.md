---
name: sonar-code-cleanup
description: Remove unused SONAR code and simplify proven duplication or complex control flow without changing artist IDs, data collection or user preferences. Use for explicit code cleanup and refactoring requests.
---

- Trace the requested screen and its callers first. Read only affected JSX, CSS and helper tests.
- Use `scripts/audit-unused.mjs` for a read-only binding report. An unused binding is a candidate, not proof a module or public export can be deleted.
- Remove obsolete handlers and unreachable JSX before removing their state and imports. Preserve side-effectful initializers and hook ordering.
- Retire obsolete UI storage writes while leaving existing localStorage values intact. Never delete persisted user settings as cleanup.
- Share logic only when its behavior and inputs are actually equivalent. Keep official statistics, inferred appearances and real group status separate.
- Prefer small named helpers for repeated policy checks. Do not replace main.jsx wholesale or split into tiny prop-heavy components.
- Remove CSS only after checking dynamic class names and other entry points. Do not delete collector or migration modules merely because the browser does not import them.
- Apply `.agents/skills/sonar-code-quality/SKILL.md` for regression checks. Run relevant tests and build, inspect the diff, and report measurable removals and any remaining complexity.
