# Antigravity Project Rules — Campus Carpool Matcher

Always-on rules for the Antigravity agent. Full details live in `/docs`.

1. Read `CLAUDE.md` first, then `docs/RULES.md`, `docs/PRD.md`, `docs/TECH.md`, `docs/NAMING.md`, `docs/SECURITY.md`, `docs/TASKS.md`.
2. Work strictly phase by phase from `docs/TASKS.md`; pick tasks by ID from `docs/PROJECT_TASKS.md` and update their Status column.
3. Phase start → mark items 🟡 in `docs/FEATURES.md`.
4. Phase end → run `npx tsc --noEmit && npm run lint && npm run build`, then browser tests from `docs/TESTING.md` (two browser profiles for multi-user).
5. Write `reports/PHASE-<N>-<slug>-report.md` from `reports/_TEMPLATE.md` with screenshots.
6. Mark ✅/❌ in `docs/FEATURES.md`, link the report, add a change-log row.
7. Don't continue to next phase if any 🔴 test fails.
8. UI only from the design file in `design/`. Report anything derived.
9. Seats never stored; all seat/fare/permission logic in Postgres RPC; RLS on all tables; ownership from `auth.uid()`.
10. Never commit secrets; never expose service role key; no `dangerouslySetInnerHTML`; Zod on every input.
11. New ideas → `docs/FUTURE_SCOPE.md`, not code.
12. Only admin-approved drivers (ID card + DL verified) can create rides — enforce in DB.
13. Never commit `.env.local`, keys or ID documents; run the secret check before every commit.
14. Start/stop the app with `start.sh`/`stop.sh` (or `.bat` on Windows) during tests.
15. Bike = 1 seat, Car = 1–3 seats; full ride blocks all new requests and accepts.
16. UI kit: shadcn/ui + Skiper UI (in `src/components/skiper/`), restyled to the design; no third-party brands; respect reduced-motion.
17. Create files only where `docs/STRUCTURE.md` shows.
