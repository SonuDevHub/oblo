# PROJECT_TASKS.md — Full Task Board (start → finish)

Detailed, assignable tasks to fully achieve the PRD in 5.5 hours.
`docs/TASKS.md` = phase overview · **this file = every task with ID, owner, time, dependency, done-check.**

**Owners (3-person team; 1–2 people → one person takes 2 columns):**
- **A — Backend/DB:** Supabase SQL, RPC, RLS, storage, seed, security tests
- **B — Driver side:** auth, verification, vehicles, offer ride, My Rides, fare UI
- **C — Rider + Admin:** search, request flow, My Requests, admin panel, deploy
- **AG — Antigravity:** phase tests + reports

**Status:** ⬜ Not Started · 🟡 In Progress · ✅ Done · ❌ Blocked
Agent/team: update Status here **and** in `docs/FEATURES.md`.

---

## Phase 0 — Setup (0:00–0:20)
| ID | Task | Owner | Est | Depends | Done when | Status |
|---|---|---|---|---|---|---|
| T-001 | Create Next.js app (TS, Tailwind, App Router, `src/`) | C | 5m | — | `npm run dev` works | ✅ |
| T-002 | Install packages: supabase-js, ssr, zod, sonner, date-fns, supabase CLI | C | 3m | T-001 | in package.json | ✅ |
| T-003 | shadcn init + add button card input select badge dialog table tabs skeleton | C | 4m | T-001 | components/ui exists | ✅ |
| T-004 | Copy docs pack (CLAUDE.md, docs/, reports/, .agent/, .gitignore, .env.example, start/stop scripts) | C | 2m | T-001 | files in root | ✅ |
| T-005 | `cp .env.example .env.local`, fill Supabase keys | A | 3m | — | keys set | ✅ |
| T-006 | Supabase: Mumbai region, Confirm email OFF | A | 3m | — | settings saved | ✅ |
| T-007 | `chmod +x start.sh stop.sh`; test start/stop | C | 2m | T-004,T-005 | site opens & stops | ✅ (Verified key-check exit) |
| T-008 | GitHub repo, push, add collaborators; secret check | C | 3m | T-004 | only `.env.example` tracked | ✅ |
| T-009 | Put design file in `design/` | B | 2m | — | file present | ⬜ (Manual) |
| T-010 | **AG:** Phase 0 test + `reports/PHASE-0-setup-report.md` | AG | 5m | T-001…T-009 | report written | ✅ |

## Phase 1 — Database & backend (0:20–1:00) — Owner A
| ID | Task | Est | Depends | Done when | Status |
|---|---|---|---|---|---|
| T-101 | `0001_create_tables.sql`: profiles, driver_verifications, vehicles, routes, stops, rides, ride_requests, audit_logs + CHECKs (bike=1, car 1–3, rate 1–50, statuses) + UNIQUEs | 10m | T-006 | tables visible | ✅ |
| T-102 | `0002_create_indexes.sql` (8 indexes from TECH.md) | 2m | T-101 | `\di` lists them | ✅ |
| T-103 | `0003_create_profile_trigger.sql` (role always student) | 3m | T-101 | signup → profile row | ✅ |
| T-104 | `0004_create_views.sql` `v_rides_with_seats` (seats_left, is_full, vehicle w/o plate, verified badge) | 4m | T-101 | view returns rows | ✅ |
| T-105 | `0004a_create_verification_functions.sql` (is_verified_driver, submit, get_my, admin_review, admin_revoke) | 6m | T-101 | functions callable | ✅ |
| T-106 | `0004b_create_id_documents_bucket.sql` (private, 2 MB, jpg/png/pdf, own-folder RLS, admin read) | 4m | T-101 | upload own ✅, other's ❌ | ✅ |
| T-107 | `0005a_create_vehicle_rpc_functions.sql` (add/update/delete vehicle, get_ride_contact) | 4m | T-101 | functions callable | ✅ |
| T-108 | `0005_create_ride_rpc_functions.sql` (create_ride w/ verification + vehicle checks, search_rides w/ score + full last + pagination, cancel_ride) | 8m | T-104,T-105 | search returns sorted | ✅ |
| T-109 | `0006_create_seat_rpc_functions.sql` (request_seat, respond_to_request, cancel_request — FOR UPDATE, auto-reject on full) | 8m | T-108 | overbook impossible | ✅ |
| T-110 | `0007_create_fare_function.sql` (segment split, driver included, round ₹) | 6m | T-109 | example = 37/17/6/37 | ✅ |
| T-111 | `0008_create_admin_functions.sql` (is_admin, set_user_blocked, override_request, admin_stats, reset_demo) | 5m | T-101 | admin-only | ✅ |
| T-112 | `0009_enable_rls_policies.sql` (all tables, no direct writes on requests/verifications) | 5m | T-101 | anon sees nothing | ✅ |
| T-113 | `seed-demo-data.sql`: 2 routes+stops+km, 5 users (3 approved drivers, Neha pending, admin), vehicles, 3 rides | 5m | all above | demo data visible | ✅ |
| T-114 | Generate `src/types/database.types.ts` | 1m | T-113 | file created | ✅ |
| T-115 | **AG:** Phase 1 SQL tests + report | 5m | T-114 | report ✅ | ✅ |

## Phase 2 — Auth & app shell (1:00–1:40)
| ID | Task | Owner | Est | Depends | Done when | Status |
|---|---|---|---|---|---|---|
| T-201 | Extract design tokens → Tailwind theme (colors, fonts, radius, spacing) | B | 10m | T-009 | tokens used, no hardcoded colors | ✅ |
| T-202 | `create-browser-client.ts`, `create-server-client.ts` | B | 5m | T-002 | clients work | ✅ |
| T-203 | `middleware.ts` (session refresh, protect routes) | B | 5m | T-202 | logged-out → /login | ✅ |
| T-204 | Login + Signup pages (as per design, Zod, generic errors) | B | 12m | T-201,T-203 | signup/login work | ✅ |
| T-205 | App layout + nav (Search, Offer, My Rides, My Requests, Vehicles, Verification, Admin if admin) + logout | C | 10m | T-201 | nav visible | ✅ |
| T-206 | Sonner toaster + `loading.tsx` skeleton pattern | C | 3m | T-205 | toasts show | ✅ |
| T-206a | Install `motion`; `motion-presets.ts` + `use-reduced-motion-safe.ts` | B | 4m | T-002 | reduced-motion respected | ✅ |
| T-206b | Add Skiper UI pieces the design needs (navbar / text / card animations) into `components/skiper/`, restyled, no 3rd-party brand; attribution in footer | B | 10m | T-201,T-206a | animations match design | ✅ |
| T-207 | Admin layout with server-side role check | C | 4m | T-205 | student blocked | ✅ |
| T-208 | **AG:** Phase 2 tests + report | AG | 5m | T-201…T-207 | report ✅ | ✅ |

## Phase 3 — Verification, vehicles, offer ride (1:40–2:20) — Owner B
| ID | Task | Est | Depends | Done when | Status |
|---|---|---|---|---|---|
| T-301 | `verification-schema.ts` (fields + file ≤2 MB, jpg/png/pdf) | 3m | T-204 | Zod rejects bad input | ⬜ |
| T-302 | `upload-id-document.ts` → `id-documents/<uid>/id-card.ext`, `dl.ext` | 5m | T-106 | files in bucket | ⬜ |
| T-303 | `/verification` page + `driver-verification-form.tsx` → `submit_driver_verification` | 10m | T-301,T-302 | status Pending | ⬜ |
| T-304 | `verification-status-banner.tsx` (not submitted / pending / rejected+reason / approved) | 4m | T-303 | banner per status | ⬜ |
| T-305 | Minimal admin approve/reject button (temp, for testing) | 3m | T-105 | can approve Neha | ⬜ |
| T-306 | `vehicle-seat-limits.ts` + `vehicle-schema.ts` | 3m | — | bike 1, car 1–3 | ⬜ |
| T-307 | `/vehicles` page: `vehicle-form.tsx`, `vehicle-card.tsx` (add/edit/delete) | 8m | T-107,T-306 | car + bike added | ⬜ |
| T-308 | `ride-offer-schema.ts` + `ride-offer-form.tsx` (vehicle select → seats lock, route → stops, date, time, rate, km/cost preview, banners) | 12m | T-108,T-304,T-307 | ride created | ⬜ |
| T-309 | `createRideAction` + redirect to My Rides + toast | 3m | T-308 | redirect works | ⬜ |
| T-310 | **AG:** Phase 3 tests (verification, bike/car limits, API bypass) + report | 6m | T-301…T-309 | report ✅ | ⬜ |

## Phase 4 — Search & matching (2:20–3:00) — Owner C
| ID | Task | Est | Depends | Done when | Status |
|---|---|---|---|---|---|
| T-401 | `ride-search-filters.tsx` (from, to, date, preferred time, vehicle type) in URL params | 8m | T-205 | URL updates | ⬜ |
| T-402 | Call `rpc('search_rides')` in server component + pagination (20) | 6m | T-108 | results load | ⬜ |
| T-403 | `match-label.ts` (Best ≤30m, Good ≤60m, Other) | 3m | — | labels correct | ⬜ |
| T-404 | `vehicle-badge.tsx`, `verified-driver-badge.tsx`, `route-timeline.tsx` | 6m | T-201 | render | ⬜ |
| T-405 | `ride-card.tsx` (owner, badges, time, seats left/Full, label, est. fare, button states: your ride / full / requested / request) | 10m | T-403,T-404 | all states visible | ⬜ |
| T-406 | Empty state + skeleton | 3m | T-405 | shows correctly | ⬜ |
| T-407 | **AG:** Phase 4 tests + report | 5m | T-401…T-406 | report ✅ | ⬜ |

## Phase 5 — Requests & judge test (3:00–3:50) 🔴
| ID | Task | Owner | Est | Depends | Done when | Status |
|---|---|---|---|---|---|---|
| T-501 | `seat-request-schema.ts` + `request-seat-dialog.tsx` (vehicle info, pickup/drop, est. fare) → `request_seat` | C | 10m | T-109,T-405 | Pending created | ⬜ |
| T-502 | `/requests/mine` + `request-status-badge.tsx` + cancel | C | 8m | T-501 | statuses shown | ⬜ |
| T-503 | Contact reveal (phone + plate) for Accepted via `get_ride_contact` | C | 4m | T-107 | only accepted sees | ⬜ |
| T-504 | `/rides/mine` + `request-row-owner.tsx` (Accept/Reject, disabled at 0 seats, Full state) | B | 12m | T-109 | owner can act | ⬜ |
| T-505 | `request-actions.ts` server actions + `revalidatePath` | B | 5m | T-504 | data refreshes | ⬜ |
| T-506 | `useOptimistic` + disable buttons while pending + error toasts | B | 6m | T-505 | no double submit | ⬜ |
| T-507 | Concurrency test: 2 browsers accept last seat | A | 3m | T-504 | only one wins | ⬜ |
| T-508 | **AG:** Judge test ×2 + bike/full-ride tests + report | AG | 8m | all above | report ✅ | ⬜ |

## Phase 6 — Fare split (3:50–4:30) — Owner B (+A)
| ID | Task | Owner | Est | Depends | Done when | Status |
|---|---|---|---|---|---|---|
| T-601 | Hook `calculate_ride_fares` into respond/cancel functions | A | 6m | T-110 | fares update | ⬜ |
| T-602 | `fare-breakdown-card.tsx` (per segment share) on My Requests + dialog | B | 10m | T-601 | breakdown visible | ⬜ |
| T-603 | Owner total collection + own share on My Rides | B | 5m | T-601 | totals correct | ⬜ |
| T-604 | `format-currency-inr.ts` | B | 2m | — | ₹ format | ⬜ |
| T-605 | **AG:** car + bike fare examples + report | AG | 5m | T-601…T-604 | report ✅ | ⬜ |

## Phase 7 — Admin panel & security (4:30–5:00) — Owner C (+A)
| ID | Task | Owner | Est | Depends | Done when | Status |
|---|---|---|---|---|---|---|
| T-701 | `/admin` dashboard: `admin-stats-cards.tsx` (users, pending verifications, verified drivers, rides today car/bike, requests by status, fill %) | C | 6m | T-111 | numbers correct | ⬜ |
| T-702 | `/admin/verifications`: `verification-review-card.tsx` (signed URLs 60s, Approve / Reject reason / Revoke) | C | 10m | T-105,T-106 | Neha approved live | ⬜ |
| T-703 | `/admin/users` (search, block/unblock) | C | 5m | T-111 | blocked user can't act | ⬜ |
| T-704 | `/admin/rides` + `/admin/requests` (cancel, override) | C | 6m | T-111 | audit row written | ⬜ |
| T-705 | `/admin/vehicles`, `/admin/routes` (🟡) | C | 5m | T-111 | CRUD works | ⬜ |
| T-706 | Security headers in `next.config.ts` | A | 3m | — | headers present | ⬜ |
| T-707 | Run SECURITY.md §8 (15 cases) | A | 8m | all | all pass | ⬜ |
| T-708 | **AG:** Phase 7 tests + report | AG | 5m | all above | report ✅ | ⬜ |

## Phase 8 — Polish, deploy, demo (5:00–5:30)
| ID | Task | Owner | Est | Depends | Done when | Status |
|---|---|---|---|---|---|---|
| T-801 | `use-ride-realtime.ts` (seats/status live) 🟡 | B | 8m | T-504 | updates w/o refresh | ⬜ |
| T-801a | `app-preloader.tsx` (Skiper-style, our branding, first visit only, ≤1.5 s, dynamic import) 🟡 | B | 6m | T-206b | Lighthouse still ≥ 85 | ⬜ |
| T-802 | Admin "Reset demo data" button 🟡 | A | 3m | T-111 | reseeds | ⬜ |
| T-803 | Mobile check vs design; list deviations | B | 5m | all UI | report lists gaps | ⬜ |
| T-804 | `tsc` + `lint` + `build` clean | C | 3m | all | no errors | ⬜ |
| T-805 | Vercel deploy + env vars (no service key client-side) | C | 5m | T-804 | prod URL live | ⬜ |
| T-806 | Judge test on prod URL | AG | 4m | T-805 | passes | ⬜ |
| T-807 | Backup demo video (Loom/OBS) | B | 4m | T-806 | video saved | ⬜ |
| T-808 | Presentation lines + rehearse demo journey (USER_FLOW §11) | All | 5m | T-806 | rehearsed | ⬜ |
| T-809 | **AG:** Final report `reports/PHASE-8-final-report.md` | AG | 3m | all | report ✅ | ⬜ |

---

## Critical path (don't slip)
`T-005 → T-101 → T-108 → T-109 → T-204 → T-308 → T-405 → T-501 → T-504 → T-508`
If behind at **3:50**: skip T-705, T-801, T-802; use fallback fare (`km × rate`) for T-601.

## Hourly checkpoint (merge + quick test)
| Time | Must be done |
|---|---|
| 1:00 | T-001…T-115 |
| 2:00 | Auth + verification working |
| 3:00 | Search shows rides with badges |
| 4:00 | **Judge test passes** |
| 5:00 | Admin + security done |
| 5:30 | Deployed + rehearsed |
