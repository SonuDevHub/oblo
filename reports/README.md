# reports/ — Phase Test Reports

After each phase the agent (Antigravity) must:
1. Run checks from `docs/TESTING.md` for that phase.
2. Copy `_TEMPLATE.md` → `PHASE-<N>-<slug>-report.md` (e.g. `PHASE-5-seat-requests-report.md`).
3. Fill every section. Save screenshots in `screenshots/phase-<N>/`.
4. Update `docs/FEATURES.md` statuses + link this report.
5. If any 🔴 test fails → status ❌, fix, re-test, write `PHASE-<N>-<slug>-report-v2.md`.

Reports are append-only — never edit an old report, write a new version.
