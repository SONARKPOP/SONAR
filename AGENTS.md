# SONAR

- Inspect only files relevant to the requested change. Use targeted searches before reading large files.
- Preserve existing artist and member IDs, content relations, and localStorage settings.
- Treat config/groups as registry inputs. Public catalog entries follow public_artist_scope.
- Run `python -m collectors.completeness` before quoting registry completeness numbers.
- Record unresolved data in review lists. Do not infer personal facts or official channel verification.
- Reuse filterContent for video results and channel facets. Facets omit their own selection condition.
- Keep P0 registry work separate from P1 presentation changes when assigning parallel tasks.
- Run relevant Python and frontend tests and a production build before publishing.
- Never replace current GitHub data indexes with older local snapshots.
