# TECH.md — Tech Stack & Purpose

## Stack overview
| Layer | Tech | Purpose / why |
|---|---|---|
| Framework | **Next.js 15 (App Router)** | Frontend + routing + Server Actions in one project; fast first load with Server Components |
| Language | **TypeScript (strict)** | Catch bugs early, typed DB rows |
| Styling | **Tailwind CSS** | Fast styling; theme tokens taken from the user's design file |
| UI behaviour | **shadcn/ui (Radix)** | Accessible Dialog, Select, Dropdown, Table, Tabs — restyled to the design |
| Animated components | **Skiper UI** (skiper-ui.com) | Premium animated pieces: preloader, navbar, text reveals, cards, carousels — restyled to the design |
| Animation engine | **motion** (`framer-motion`) | Required by Skiper UI; page/list transitions, button micro-interactions |
| Database | **Supabase Postgres** | Tables: profiles, driver_verifications, vehicles, routes, stops, rides, ride_requests, audit_logs |
| File storage | **Supabase Storage (private bucket)** | College ID card, driving licence, selfie for driver verification |
| Auth | **Supabase Auth (email + password)** | Hashing, JWT, sessions handled for us |
| Auth in Next | **@supabase/ssr** | Session cookies on server + client; used in middleware |
| Business logic | **Postgres functions (RPC, `security definer`)** | Seat rules, fare split, admin actions — tamper-proof |
| Security | **Row Level Security (RLS)** | Each user sees/changes only allowed rows |
| Concurrency | **`SELECT … FOR UPDATE`** | No double-booking of the last seat |
| Validation | **Zod** | Form + server action validation |
| Live updates | **Supabase Realtime** (🟡) | Seat count / status update without refresh |
| Notifications UI | **Sonner** | Toasts for success/errors |
| Dates | **date-fns** | Time difference for matching, formatting |
| Icons | Whatever the design file uses (fallback: lucide-react) | |
| Hosting | **Vercel** | 1-click deploy, CDN, auto-scale |
| DB region | **Supabase ap-south-1 (Mumbai)** | Low latency in India |
| AI testing | **Antigravity (browser agent)** | Runs phase tests in browser, writes reports |

## Where each feature lives
| Feature | Where |
|---|---|
| Login / Signup | Supabase Auth + `src/app/(auth)/…` + `src/middleware.ts` |
| Driver verification | `/verification` → upload to Storage `id-documents` → `rpc('submit_driver_verification')` |
| Admin approval | `/admin/verifications` → signed URLs → `rpc('admin_review_verification')` |
| Local start/stop | `start.sh` / `stop.sh` (mac/Linux), `start.bat` / `stop.bat` (Windows) |
| Secrets | `.env.local` (gitignored), `.env.example` committed |
| Route protection | `src/middleware.ts` (logged in) + admin role check in `src/app/admin/layout.tsx` |
| My Vehicles | `src/app/(student)/vehicles/page.tsx` → `rpc('add_vehicle')` etc. |
| Offer ride | Server Action → `rpc('create_ride')` (vehicle select; bike locks seats to 1) |
| Search + match sort | `rpc('search_rides')` returns rows + score; label logic in `src/lib/matching/match-label.ts` |
| Request seat | `rpc('request_seat')` |
| Accept / Reject | `rpc('respond_to_request')` |
| Cancel | `rpc('cancel_request')`, `rpc('cancel_ride')` |
| Seats left | View `v_rides_with_seats` |
| Fare split | `rpc('calculate_ride_fares')` (returns per-rider fare) |
| Admin actions | `rpc('admin_*')` functions that check `is_admin()` |
| Realtime | `src/hooks/use-ride-realtime.ts` |

## Architecture
```
Browser (Next.js client comps)
   │  anon key + user JWT
   ▼
Next.js server (Server Components / Server Actions / middleware)
   │  @supabase/ssr
   ▼
Supabase
   ├─ Auth (JWT)
   ├─ Postgres  ── RLS on all tables
   │     └─ RPC functions (all rules, FOR UPDATE locks, fare calc)
   └─ Realtime (ride_requests changes)
```
**Rule:** frontend never decides seats/fare/permissions. It only calls RPC and shows results.

## Database schema (summary)
```
profiles      (id uuid PK→auth.users, full_name, email, phone, role 'student'|'admin', is_blocked, created_at)
driver_verifications (id, user_id→profiles UNIQUE, college_name, roll_no, course, year,
               id_card_path, dl_number, dl_path, selfie_path null,
               status 'pending'|'approved'|'rejected', rejection_reason null,
               submitted_at, reviewed_by→profiles null, reviewed_at null)
               -- no row = not_submitted
vehicles      (id, owner_id→profiles, vehicle_type 'car'|'bike', brand_model, color,
               plate_number UNIQUE CHECK ~ '^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{4}$', is_active, created_at)
routes        (id, name, is_active)
stops         (id, route_id→routes, name, stop_order, km_from_start)  UNIQUE(route_id, stop_order)
rides         (id, owner_id→profiles, vehicle_id→vehicles, vehicle_type (snapshot), route_id, start_stop_id, end_stop_id,
               ride_date, ride_time, total_seats, rate_per_km CHECK 1..50,
               status 'open'|'cancelled'|'completed', created_at,
               CHECK ((vehicle_type='bike' AND total_seats=1) OR (vehicle_type='car' AND total_seats BETWEEN 1 AND 3)))
ride_requests (id, ride_id→rides, rider_id→profiles, pickup_stop_id, drop_stop_id,
               status 'Pending'|'Accepted'|'Rejected'|'Cancelled', reject_reason text null,
               fare_estimate int, created_at, updated_at)
               UNIQUE(ride_id, rider_id)
audit_logs    (id, actor_id, action, entity, entity_id, meta jsonb, created_at)
```
View: `v_rides_with_seats` = rides + owner name + vehicle (type, brand_model, color — **no plate**) + `seats_left` + `is_full` (both computed).
Plate number + owner phone returned only by `get_ride_contact(ride)` for owner, accepted riders, admin.

### ID document storage
- Supabase Storage bucket **`id-documents`**, `public = false`, file size limit 2 MB, MIME: image/jpeg, image/png, application/pdf.
- Path: `<auth.uid()>/id-card.<ext>`, `<auth.uid()>/dl.<ext>`, `<auth.uid()>/selfie.<ext>`.
- Storage RLS: user can insert/update/select **only** objects in their own folder; admin (`is_admin()`) can select all. No delete for students after approval.
- Admin views via `createSignedUrl(path, 60)` from a server action.
- Helper SQL: `is_verified_driver(uid)` → `exists(select 1 from driver_verifications where user_id = uid and status='approved')`.

### Vehicle seat limits (single source of truth)
| vehicle_type | total_seats allowed | People on vehicle |
|---|---|---|
| `bike` | 1 | 2 (driver + 1) |
| `car` | 1–3 | up to 4 (driver + 3) |
Enforced 3 times: Zod (form), `create_ride` RPC, table `CHECK`. Constant in code: `src/lib/vehicles/vehicle-seat-limits.ts`.

### Full-ride enforcement
`request_seat` and `respond_to_request` both: lock ride (`FOR UPDATE`) → compute `seats_left` → if 0 raise error. On last accept → same transaction sets other Pending to `Rejected` (`reject_reason = 'ride_full'`).

## Indexes
```sql
create index idx_rides_route_date      on rides (route_id, ride_date, ride_time);
create index idx_rides_owner           on rides (owner_id);
create index idx_requests_ride_status  on ride_requests (ride_id, status);
create index idx_requests_rider        on ride_requests (rider_id);
create index idx_stops_route_order     on stops (route_id, stop_order);
create index idx_vehicles_owner        on vehicles (owner_id);
create index idx_verifications_status  on driver_verifications (status, submitted_at);  -- admin queue
-- UNIQUE(user_id) on driver_verifications already indexed
-- UNIQUE(plate_number) already creates an index
-- UNIQUE(ride_id, rider_id) already creates an index
```

## RPC functions (contract)
| Function | Who | Does |
|---|---|---|
| `submit_driver_verification(college, roll_no, course, year, id_card_path, dl_number, dl_path, selfie_path)` | student | upserts own row → `pending`; only if not already approved |
| `get_my_verification()` | student | own status + reason |
| `admin_review_verification(verification, approve bool, reason)` | admin | sets approved/rejected, reviewer, time, audit log |
| `admin_revoke_driver(user, reason)` | admin | → rejected; cancels open rides; audit log |
| `is_verified_driver(uid)` | internal | used in `create_ride` |
| `add_vehicle(type, brand_model, color, plate)` | student | owner = auth.uid(); plate uppercased + validated |
| `update_vehicle` / `delete_vehicle(vehicle)` | owner | blocked if vehicle on a ride with Pending/Accepted requests |
| `create_ride(vehicle, route, start_stop, end_stop, date, time, seats, rate)` | verified driver | checks `is_verified_driver(auth.uid())`; vehicle belongs to caller; copies vehicle_type; seats per vehicle limit |
| `search_rides(from_stop, to_stop, date, pref_time, vehicle_type, page)` | student | matching rides with score, vehicle info, seats_left, is_full, fare estimate; full rides sorted last |
| `get_ride_contact(ride)` | owner / accepted rider / admin | owner phone + plate number |
| `request_seat(ride, pickup_stop, drop_stop)` | student | rules 7–9, 16–17; lock ride |
| `respond_to_request(request, status)` | owner/admin | rules 11–15; lock ride; recalc fares |
| `cancel_request(request)` | rider | frees seat; recalc fares |
| `cancel_ride(ride)` | owner/admin | cancels ride + its requests |
| `calculate_ride_fares(ride)` | internal | segment split; updates `fare_estimate` |
| `is_admin()` | internal | role check |
| `admin_set_user_blocked(user, bool)` | admin | + audit log |
| `admin_override_request(request, status)` | admin | still respects seat limit + audit log |
| `admin_stats()` | admin | dashboard numbers |
| `admin_reset_demo()` | admin | 🟡 reseed |

## Skiper UI — how we use it
- **Free components:** open component on skiper-ui.com → "Source Code" → copy into `src/components/skiper/<name>.tsx`. Free tier requires **attribution** → add "UI components: Skiper UI" in footer / about.
- **Pro components:** `npx shadcn@latest add @skiper-ui/<component>` (e.g. `@skiper-ui/skiper7`) — needs a Pro license; set up the registry in `components.json` as per Skiper Pro docs. License key only in `.env.local` (gitignored), never committed.
- Dependency: `npm i motion` (or `framer-motion` if the component imports it).
- **Restyle to design tokens.** Remove any third-party brand (e.g. skiper7 is a Nike-inspired preloader → use our app name/logo, our colors, no Nike text/logos/videos).
- Where to use: app preloader (first visit only, ≤ 1.5 s), navbar, hero/landing text, ride-card enter animation, status change, success states.
- Where NOT to use: input typing, form validation, or submit buttons (never animate these). Forms and admin tables get light motion only: focus/hover, row fade-in, dialog open/close. Keep interactions fast, accessible, and never blocking.
- Performance rules: dynamic import (`next/dynamic`, `ssr:false`) for heavy ones; no autoplay videos > 1 MB; respect `prefers-reduced-motion`; animation must never block an action or the judge test.

## Packages
```
@supabase/supabase-js @supabase/ssr zod sonner date-fns motion
(dev) supabase  (CLI for migrations/types)
shadcn: button card input select badge dialog table tabs skeleton
```
