# RULES.md — Strict Rules (do not break)

Priority: 🔴 Must · 🟡 If time · ⚪ Presentation only

---

## A. Business rules (enforced in DATABASE, not only UI)

### Driver verification (ID card + admin approval) — before offering rides
D1. 🔴 Any logged-in student can **search and book** rides right after signup.
D2. 🔴 To **offer (list) a ride**, the student must be a **verified driver**: submit verification → admin approves.
D3. 🔴 Verification form: full name, phone, college name, roll/enrollment no., course & year, **college ID card photo (front)** 🔴, driving licence number + photo 🔴 (needed because they drive), selfie 🟡.
D4. 🔴 Files: JPG/PNG/PDF only, max **2 MB** each, stored in **private** Supabase Storage bucket `id-documents` at `<user_id>/<file>`; never public, never in git.
D5. 🔴 Status flow: `not_submitted` → `pending` → `approved` | `rejected` (with reason). Rejected can resubmit. Only one active submission per user.
D6. 🔴 **Only admin** can approve/reject (`admin_review_verification`). Student can never set own status.
D7. 🔴 `create_ride` raises **"Pehle verification approve hona chahiye"** if status ≠ `approved`. Offer Ride page shows status banner instead of form.
D8. 🔴 Admin sees documents via **signed URLs (60 s expiry)** only.
D9. 🔴 Admin can **revoke** approval (fake/expired) → status `rejected`; their open rides cancelled, requests auto-Rejected.
D10. 🔴 Search shows a **"✔ Verified driver"** badge on every ride (all listed rides are by verified drivers).
D11. 🔴 Every review action is written to `audit_logs`.
D12. 🟡 Admin also checks the vehicle (plate matches DL/RC) during review.

### Vehicles (only 2 types: Car, Bike)
V1. 🔴 Vehicle type is **only `car` or `bike`** (`CHECK`). No auto, van, bus.
V2. 🔴 **Bike → exactly 1 seat** for a rider (driver + 1 pillion = 2 people).
V3. 🔴 **Car → 1 to 3 seats** for riders (driver + max 3 = 4 people).
V4. 🔴 **Driver is never counted in `total_seats`.** Seats = rider seats only.
V5. 🔴 A student must add a vehicle before offering a ride. One student can have multiple vehicles (e.g. 1 bike + 1 car).
V6. 🔴 Vehicle details: type, brand/model, color, number plate (Indian format, e.g. `RJ14AB1234`), unique per plate.
V7. 🔴 Every ride is linked to one of the **owner's own** vehicles (checked by `auth.uid()`).
V8. 🔴 Ride stores a snapshot `vehicle_type`; DB `CHECK`: `(bike AND total_seats = 1) OR (car AND total_seats BETWEEN 1 AND 3)`.
V9. 🔴 Search cards and request screens **show the vehicle** (icon + type + model + color). Number plate visible **only to accepted riders, the owner and admin**.
V10. 🔴 Vehicle cannot be deleted/changed on a ride that has Pending or Accepted requests.
V11. 🟡 Rider can filter search by vehicle type (Any / Car / Bike).

### Rides
1. 🔴 Seats per ride depend on vehicle: **Bike = 1, Car = 1–3** (see V2–V3, V8). Form auto-locks bike to 1 seat.
2. 🔴 Ride date/time **cannot be in the past**.
3. 🔴 Start stop and end stop **cannot be the same**; start must come before end on the route.
4. 🔴 Owner must be a logged-in, non-blocked, **admin-verified driver** (D2, D7).
5. 🟡 Max **5 rides per user per day** (anti-spam).
6. 🟡 Owner can cancel own ride → all its requests become `Rejected`/`Cancelled`.

### Seat requests
7. 🔴 **Cannot request a seat on your own ride.**
8. 🔴 **One request per user per ride** (`UNIQUE(ride_id, rider_id)`).
9. 🔴 **If `seats_left = 0` → new requests blocked** ("Ride full").
10. 🔴 Statuses: `Pending` → `Accepted` | `Rejected`. Rider may set own Pending/Accepted → `Cancelled` (🟡).
11. 🔴 Only the **ride owner** (or admin) can accept/reject.
12. 🔴 Only a **Pending** request can be accepted/rejected.
13. 🔴 **Accept only if `seats_left > 0`.** A ride can NEVER accept more students than its seats.
14. 🔴 **Reject never changes seat count.**
15. 🔴 When the last seat is accepted → all other Pending requests auto-`Rejected`.
16. 🔴 Pickup stop must be **before** drop stop, and both must lie **inside** the ride's start→end range.
17. 🟡 No new requests after departure time.

### Full ride — booking lock (all seats booked → nobody else can book)
F1. 🔴 Ride is **Full** when `seats_left = 0` (Accepted count = total_seats). Full is computed, not a stored flag.
F2. 🔴 On a Full ride, `request_seat` **raises error "Ride full hai"** — even if someone calls the API directly.
F3. 🔴 On a Full ride, `respond_to_request('Accepted')` **raises "Seats khatam"** — owner/admin cannot over-accept.
F4. 🔴 The moment the last seat is accepted, **all remaining Pending requests become `Rejected`** (reason: ride full) in the same transaction.
F5. 🔴 Search: Full rides show a **"Full" badge, disabled button**, sorted **below** available rides (or hidden via "Hide full" toggle 🟡).
F6. 🔴 Owner's My Rides: Full ride shows "Full · 3/3 booked", Accept buttons disabled.
F7. 🔴 If an Accepted rider cancels (or admin removes them), the seat is freed → ride becomes available again automatically.
F8. 🔴 Owner cannot reduce `total_seats` below current Accepted count, and cannot edit seats/vehicle once any request is Accepted.
F9. 🔴 Concurrency: `request_seat` and `respond_to_request` lock the ride row (`SELECT … FOR UPDATE`) → two people can never take the same last seat.
F10. 🔴 Bike ride becomes Full after **1** acceptance; car after its 1–3 seats.

### Seats
18. 🔴 `seats_left = total_seats − COUNT(Accepted)` — **always computed, never stored.**
19. 🔴 Accept/request functions lock the ride row with `SELECT … FOR UPDATE` (no race-condition overbooking).
20. 🟡 Segment-wise seats (a seat frees up after a rider drops off) — bonus only, core test uses whole-ride seats.

### Fare (per km, segment split)
21. 🔴 Owner sets `rate_per_km` (₹1–₹50). Trip cost = route km × rate.
22. 🔴 Each segment's cost is split **equally among everyone on the vehicle on that segment, including the driver** (bike: driver + 1; car: driver + up to 3).
22a. 🟡 Default rate suggestion: Bike ₹3/km, Car ₹8/km (owner can change within ₹1–₹50).
23. 🔴 Rider fare = sum of their segment shares, **rounded to nearest ₹**.
24. 🔴 Fare is calculated **only in a DB function**, never trusted from client.
25. 🔴 UI shows **"Estimated fare"** until departure; recalculated on every accept/cancel.
26. Fallback (if short on time): `fare = rider_km × rate_per_km`.

### Matching / search
27. 🔴 Search by from-stop, to-stop, date (+ optional preferred time).
28. 🔴 Show rides whose route contains both stops in the right order and owner's range covers them.
29. 🔴 Sort: same exact start & end first → then `|ride_time − preferred_time|` ascending.
30. 🔴 Labels: **Best match** (same route, ≤30 min) · **Good match** (≤60 min) · **Other rides**.
31. 🔴 Hide past rides and rides of blocked users. Paginate 20 per page.

### Roles
32. 🔴 One student account = both driver and rider. No separate signups.
33. 🔴 Admin role is set **only in DB** (never via signup or client).
34. 🔴 Blocked users cannot log in to actions (offer/request/accept); their open rides are hidden.

### Locations
35. 🔴 Sample locations/routes only (seeded). **No maps, no GPS.** Locations are dropdowns, never free text.

---

## B. Coding rules
1. 🔴 TypeScript strict. No `any` unless commented why.
2. 🔴 Every form validated with **Zod** (client + server action).
3. 🔴 All writes that touch seats/fare/status go through `supabase.rpc(...)`.
4. 🔴 Select only needed columns; never `select('*')` in production queries.
5. 🔴 Every list has a loading skeleton (`loading.tsx`) and an empty state.
6. 🔴 Buttons disable while a request is in flight (no double submit).
7. 🔴 Errors shown as friendly toasts ("Ride full hai"), never raw stack traces.
8. 🔴 DB errors raised with clear messages in functions; frontend shows `error.message`.
9. 🔴 No hardcoded colors/fonts — use Tailwind tokens from the design file.
10. 🔴 Server Components by default; `"use client"` only where interaction is needed.
11. 🔴 One component per file. Max ~200 lines per file; split otherwise.
12. 🔴 No secrets in code. `.env.local` only, gitignored.

## C. Design rules
1. 🔴 **Use ONLY the design file the user provides** (Figma / PNG / PDF in `/design`).
2. 🔴 Extract tokens (colors, fonts, radius, spacing) into `tailwind` theme first.
3. 🔴 shadcn/Radix used for behaviour only; restyle to design.
3a. 🔴 **Skiper UI** allowed for animated components (preloader, navbar, text, cards). Always restyle to design tokens; place in `src/components/skiper/`.
3b. 🔴 No third-party brand names, logos or videos from Skiper demos (e.g. Nike in skiper7) — replace with our app branding.
3c. 🔴 Free Skiper components need attribution ("UI components: Skiper UI") in footer/about. Pro license key only in `.env.local`.
3d. 🔴 Animations: keep shadcn/Skiper animations and wire up fully; add subtle motion via `src/lib/motion/motion-presets.ts`. Forms and admin tables get light motion only (focus/hover, row fade-in, dialog open/close; never on input typing, validation, or submit). Respect `prefers-reduced-motion` via `src/hooks/use-reduced-motion-safe.ts`, keep UI durations 150–300 ms (≤600 ms page/hero), preloader first visit only and ≤ 1.5 s, never block clicks, delay server actions or hide error toasts. Animate only transform/opacity. Heavy components use `next/dynamic(ssr:false)` (Lighthouse ≥85).
3e. 🔴 Heavy animated components loaded with `next/dynamic` to keep first load fast.
4. 🔴 If something isn't in the design (empty state, toast, disabled state), derive from design tokens and **list it in the phase report**.
5. 🔴 Mobile-first; desktop if design has it.

## D. Agent workflow rules
1. 🔴 Follow `docs/TASKS.md` phase order. One phase at a time.
2. 🔴 Before a phase: set its items to `🟡 In Progress` in `docs/FEATURES.md`.
3. 🔴 After a phase: run `docs/TESTING.md` checks for that phase (Antigravity browser test).
4. 🔴 Write report `reports/PHASE-<N>-<slug>-report.md` using `reports/_TEMPLATE.md`.
5. 🔴 Mark items `✅ Done` / `❌ Blocked` in `docs/FEATURES.md` with date.
6. 🔴 If a test fails → fix → re-test → only then move on.
7. 🔴 Never delete migrations; add a new one.
8. 🔴 Don't add features not in PRD without logging them in `docs/FUTURE_SCOPE.md` first.
9. 🔴 Commit after every green phase: `feat(phase-N): <summary>`.

## E. Secrets & keys rules (never on git) 🔴
1. Real keys only in `.env.local` (local) and Vercel env settings (prod).
2. `.gitignore` blocks `.env`, `.env.*` (except `.env.example`), `*.pem`, `*.key`, `*secret*`, `*credentials*`, `supabase/.env`, `uploads/`, `id-documents/`, `.run/`.
3. Only `.env.example` (placeholder values) is committed.
4. `SUPABASE_SERVICE_ROLE_KEY` is server-only — never `NEXT_PUBLIC_`, never imported in a `"use client"` file.
5. Before every commit: `git status` must not show any `.env*` (except example) or ID documents. Check: `git ls-files | grep -iE "\.env|secret|\.pem|\.key"` → must print only `.env.example`.
6. If a key is ever pushed → rotate it immediately in Supabase dashboard, then remove from history.
7. Never paste keys in docs, reports, screenshots or AI chats.

## F. Git rules
- `main` always runnable. Feature branches: `feat/<area>-<short>` (e.g. `feat/rides-offer-form`).
- Merge + test every ~1 hour.
- Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `test:`.
