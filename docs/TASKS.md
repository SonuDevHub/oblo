# TASKS.md — Phase-wise Tasks

Rule: finish phase → test (TESTING.md) → report (`reports/`) → update FEATURES.md → commit → next phase.

| Phase | Time | Goal |
|---|---|---|
| 0 | 0:00–0:20 | Setup |
| 1 | 0:20–1:00 | Database + RPC + RLS + seed |
| 2 | 1:00–1:40 | Auth + layout + design tokens |
| 3 | 1:40–2:20 | Offer ride |
| 4 | 2:20–3:00 | Search + matching |
| 5 | 3:00–3:50 | Request / accept / reject + My Rides + My Requests (**judge test**) |
| 6 | 3:50–4:30 | Fare split per km |
| 7 | 4:30–5:00 | Admin panel + security hardening |
| 8 | 5:00–5:30 | Realtime/polish, deploy, demo rehearsal |

---

## Phase 0 — Setup
- [ ] Create Next.js app + packages (QUICKSTART §2)
- [ ] `cp .env.example .env.local` → fill keys; confirm `.gitignore` from docs pack is in place
- [ ] `chmod +x start.sh stop.sh`; test `./start.sh` and `./stop.sh` (Windows: `start.bat` / `stop.bat`)
- [ ] Secret check: `git ls-files | grep -iE "\.env|secret|\.pem|\.key"` → only `.env.example`
- [ ] Copy docs pack; create `design/`, `supabase/migrations/`, `supabase/seed/`
- [ ] GitHub repo + push + add collaborators
**Done when:** `npm run dev` shows the default page; repo pushed.

## Phase 1 — Database
- [ ] `0001_create_tables.sql` — profiles, **driver_verifications**, **vehicles**, routes, stops, rides (vehicle_id + vehicle_type + seat CHECK by type), ride_requests (+ reject_reason), audit_logs + CHECKs + UNIQUE
- [ ] `0002_create_indexes.sql` — 5 indexes (TECH.md)
- [ ] `0003_create_profile_trigger.sql` — auto profile on signup (role always student)
- [ ] `0004_create_views.sql` — `v_rides_with_seats`
- [ ] `0004a_create_verification_functions.sql` — is_verified_driver, submit_driver_verification, get_my_verification, admin_review_verification, admin_revoke_driver
- [ ] `0004b_create_id_documents_bucket.sql` — private bucket `id-documents` (2 MB, jpg/png/pdf) + storage RLS (own folder, admin read)
- [ ] `0005a_create_vehicle_rpc_functions.sql` — add_vehicle, update_vehicle, delete_vehicle, get_ride_contact
- [ ] `0005_create_ride_rpc_functions.sql` — create_ride (vehicle checks), search_rides (vehicle info, is_full, full last), cancel_ride
- [ ] `0006_create_seat_rpc_functions.sql` — request_seat, respond_to_request, cancel_request (FOR UPDATE)
- [ ] `0007_create_fare_function.sql` — calculate_ride_fares (segment split)
- [ ] `0008_create_admin_functions.sql` — is_admin, admin_* functions
- [ ] `0009_enable_rls_policies.sql`
- [ ] `seed-demo-data.sql` — 2 routes with stops+km, 5 users (Rahul, Priya, Aman = approved drivers; Neha = pending verification), vehicles (Rahul car, Priya car, Aman bike), 3 rides
- [ ] Generate types
**Done when:** SQL tests in TESTING.md Phase 1 pass in SQL editor.

## Phase 2 — Auth + shell
- [ ] Read design file → Tailwind tokens (colors, fonts, radius)
- [ ] Supabase clients (browser/server) + `middleware.ts`
- [ ] Login, Signup pages (as per design)
- [ ] App layout + nav (Search, Offer, My Rides, My Requests, Admin if admin) + logout
- [ ] Sonner toaster
**Done when:** signup → login → protected pages; logged-out redirect works.

## Phase 3 — Driver verification + Vehicles + Offer ride
- [ ] `verification-schema.ts` (Zod: fields + file type/size)
- [ ] `/verification` page: `driver-verification-form.tsx` (upload ID card + DL to `id-documents/<uid>/`) + `verification-status-banner.tsx`
- [ ] Offer Ride / My Vehicles show banner until `approved`
- [ ] `vehicle-seat-limits.ts` constant (bike 1, car 1–3)
- [ ] `vehicle-schema.ts` (Zod: type, brand_model, color, plate regex)
- [ ] `/vehicles` page: `vehicle-form.tsx` + `vehicle-card.tsx` (add/edit/delete)
- [ ] `ride-offer-schema.ts` (Zod, seats validated against vehicle type)
- [ ] `ride-offer-form.tsx`: vehicle select → seats (bike locked 1, car 1–3), route → stops, date, time, rate; trip km + cost preview; "No vehicle" CTA
- [ ] `createRideAction` → `rpc('create_ride')`
- [ ] Redirect to My Rides with toast
**Done when:** unverified/pending student can't offer (UI + API); verified driver's car ride (3 seats) + bike ride (1 seat) created; bike with 2 seats, car with 4 seats, someone else's vehicle, past date, same stop all rejected (form AND API).

## Phase 4 — Search + matching
- [ ] `ride-search-filters.tsx` (URL params)
- [ ] `rpc('search_rides')` + `match-label.ts`
- [ ] `ride-card.tsx`: owner, **vehicle badge (icon/type/model/color)**, timeline, time, seats badge, label, estimated fare, Request btn
- [ ] `vehicle-badge.tsx`
- [ ] Own ride → "Your ride" (no button); full → "Full" badge, disabled, sorted last
- [ ] 🟡 Vehicle type filter
- [ ] Skeleton + empty state + pagination
**Done when:** order = Best → Good → Other; seat badges correct.

## Phase 5 — Requests (judge test) 🔴
- [ ] `request-seat-dialog.tsx` (pickup/drop) → `rpc('request_seat')`
- [ ] My Requests page + `request-status-badge.tsx` + cancel
- [ ] My Rides page: requests per ride, Accept/Reject (`rpc('respond_to_request')`), disabled at 0 seats
- [ ] Full-ride lock: last accept → other Pending auto-Rejected ("Ride full"); full ride blocks request + accept
- [ ] Accepted rider sees owner phone + plate (`get_ride_contact`)
- [ ] Optimistic UI + disable while pending + error toasts
**Done when:** full judge scenario + bike/full-ride tests (TESTING.md Phase 5) pass twice in a row.

## Phase 6 — Fare split
- [ ] Fare recalculated in accept/cancel functions
- [ ] `fare-breakdown-card.tsx` (per segment share)
- [ ] Owner: total collection + own share
**Done when:** worked example (Aman ₹37, Priya ₹17, Neha ₹6, Driver ₹37) reproduces.

## Phase 7 — Admin + security
- [ ] `/admin` layout with server role check
- [ ] Dashboard stats (`admin_stats`) incl. pending verifications count
- [ ] **Verifications queue** `/admin/verifications`: `verification-review-card.tsx` with signed-URL doc preview, Approve / Reject (reason) / Revoke
  (🔴 do a minimal approve/reject screen early in Phase 3 if needed for testing; full UI here)
- [ ] Users (block/unblock), Vehicles (list/remove), Rides (cancel), Requests (override), Routes & stops CRUD
- [ ] Audit log list 🟡
- [ ] Security headers in `next.config.ts`
- [ ] Run SECURITY.md §8 tests
**Done when:** admin can manage all; student blocked from admin; security tests pass.

## Phase 8 — Polish + deploy
- [ ] Realtime seats/status 🟡
- [ ] "Reset demo data" button 🟡
- [ ] Mobile check against design
- [ ] `npm run build` clean → Vercel deploy → env vars
- [ ] Run judge test on production URL
- [ ] Backup demo video (Loom/OBS)
**Done when:** production passes judge test; final report written.
