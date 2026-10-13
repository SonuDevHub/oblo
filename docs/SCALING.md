# SCALING.md — Performance & Scale Rules

## Database
- 🔴 Indexes (TECH.md) on every filter/sort column used by search and lists.
- 🔴 Pagination: 20 rows per page (`range()` / `limit/offset` in `search_rides`).
- 🔴 Only needed columns selected.
- 🔴 Past rides filtered out (`ride_date >= current_date`).
- 🔴 Seats computed by indexed `COUNT` on `(ride_id, status)` — fast up to large volumes.
- ⚪ At very high volume: maintain `accepted_count` via trigger under the same row lock, partition `ride_requests` by month, archive completed rides.

## App / speed (no laggy feel)
- 🔴 Server Components for first paint; `loading.tsx` skeletons.
- 🔴 Optimistic UI (`useOptimistic`) on request/accept/reject.
- 🔴 Disable buttons while pending; debounce filters (300 ms).
- 🔴 Light bundle: no heavy libs, images optimised with `next/image`, fonts via `next/font`.
- 🔴 Supabase region Mumbai; Vercel region `bom1`.
- 🟡 Realtime only subscribed on pages that need it, filtered by `ride_id` / `rider_id`.

## Architecture
- 🔴 All rules in DB functions → any future client (mobile app) gets the same behaviour.
- 🔴 Vercel + Supabase scale automatically (serverless + managed Postgres + connection pooler).
- 🔴 Routes/stops are data, not code → new areas/colleges added by admin.
- ⚪ Multi-college: add `college_id` to profiles/routes/rides + RLS by college.
