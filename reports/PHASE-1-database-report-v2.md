# PHASE 1 — Database Report (v2 Follow-up Fixes)

**Date/time:** 2026-10-13 14:35 IST · **Agent:** Antigravity · **Commit:** `e6a5c76`
**Result:** ✅ PASS (All Part A Follow-Up Tests Passed)

## 1. What was built & fixed
- **Exact Fare Calculation (`0014_phase1_fixes.sql`):**
  - Updated `calculate_ride_fares` to compute exact driver share as `route trip cost - SUM(rider fares)`.
  - Re-tested Car ride: Aman (37), Priya (17), Neha (6), Driver (36) -> Total sum = 96 (matches route cost of 96 exactly).
  - Re-tested Bike ride (12 km @ ₹3/km): Rider 62->Vaishali (11), Driver (25) -> Total sum = 36 (matches route cost of 36 exactly).
- **Standardized RPC Error Strings (`0014_phase1_fixes.sql`):**
  - Updated `respond_to_request` to raise exact message: `"Seats khatam"`.
  - Verified edge cases and error messages aligned with `docs/USER_FLOW.md` §12.
  - Added start = end check in `create_ride`: rejects with `"Start stop must come before end stop"`.
- **Seed Route 1 Stop Names & Route (`seed-demo-data.sql`):**
  - Exact stops verified: `Sector 62 (0) -> Indirapuram (4) -> Vaishali (7) -> College (12)`.
  - Rahul's ride verified: 62 -> College, 08:30:00, 2 seats, ₹8/km.
  - Added ride & request cleanup before seeding rides to guarantee exactly 3 pristine demo rides.
- **RLS Seat Test Verification:**
  - When Rahul accepts 1 request (Aman), querying `v_rides_with_seats` and `search_rides` as Neha (a student with NO request on Rahul's ride) returns `seats_left = 1` across both interfaces.
- **Extra RPC & Security Verification:**
  - `get_ride_contact`: Pending rider is denied; Accepted rider receives plate (`RJ14AB1234`) and phone (`9876543210`).
  - `cancel_request`: An accepted rider cancelling frees the seat (`seats_left = 1`, `is_full = false`) and recalculates fares.
  - `create_ride`: Past date is rejected (`"Yeh ride nikal chuki hai"`), start = end is rejected.
  - Blocked user: Calling `request_seat` raises `"Aapka account block hai, admin se contact karein"`.
  - Storage RLS: Student A reading Student B documents in `id-documents` bucket returns 0 items / denied.
- **Pristine State Verified:**
  - 3 rides dated tomorrow in database with all seats free (Rahul car 2/2, Priya car 3/3, Aman bike 1/1).
- **Type Generation:**
  - `src/types/database.types.ts` regenerated from live database in UTF-8.

## 2. Files created / changed
| File | Purpose |
|---|---|
| `supabase/migrations/0014_phase1_fixes.sql` | Exact fare split, error message standardization, start/end stop validation |
| `supabase/seed/seed-demo-data.sql` | Exact stop names and clean ride reset before seeding |
| `src/types/database.types.ts` | Regenerated TypeScript types |
| `docs/FEATURES.md` | Progress tracker updated with v2 follow-up report |
| `reports/PHASE-1-database-report-v2.md` | Comprehensive report for Part A follow-up fixes |

## 3. Build & Quality checks
| Check | Result |
|---|---|
| `npx tsc --noEmit` | ✅ PASS (0 errors) |
| `npm run lint` | ✅ PASS (0 errors, 0 warnings) |
| `npm run build` | ✅ PASS (Next.js 15.5.27 production build succeeded) |
| Secret check (`git ls-files \| grep -iE "\.env\|secret\|\.pem\|\.key"`) | ✅ PASS (Only `.env.example` tracked) |

## 4. Tests Table (PART A Requirements)
| # | Test | Expected | Actual | Pass |
|---|---|---|---|---|
| 1a | Exact Car fare calculation | Aman: 37, Priya: 17, Neha: 6, Driver: 36 (sum 96) | Aman: 37, Priya: 17, Neha: 6, Driver: 36 (sum 96) | ✅ |
| 1b | Exact Bike fare calculation | Rider: 11, Driver: 25 (sum 36) | Rider: 11, Driver: 25 (sum 36) | ✅ |
| 2 | Error string on overbooking | Exact message `"Seats khatam"` | `"Seats khatam"` | ✅ |
| 3a | Route 1 stop names and km | Sector 62 (0) -> Indirapuram (4) -> Vaishali (7) -> College (12) | Exact match | ✅ |
| 3b | Rahul's ride details | 62 -> College, 08:30, 2 seats, ₹8/km | Exact match | ✅ |
| 4 | RLS seat test (Student with NO request) | `v_rides_with_seats` & `search_rides` show `seats_left = 1` | Both interfaces return `seats_left = 1` | ✅ |
| 5a | `get_ride_contact` security | Pending denied; Accepted gets phone + plate | Pending denied; Accepted gets RJ14AB1234 + 9876543210 | ✅ |
| 5b | `cancel_request` by Accepted rider | Seat freed (1 left), `is_full = false`, fares recalculated | Seat freed, `is_full = false`, fares recalculated | ✅ |
| 5c | `create_ride` invalid inputs | Past date rejected, start = end rejected | Both rejected with validation errors | ✅ |
| 5d | Blocked user `request_seat` | Error `"Aapka account block hai, admin se contact karein"` | Exact error raised | ✅ |
| 5e | Storage RLS document privacy | Student A reading Student B documents denied | Access denied (0 items returned) | ✅ |
| 6 | Pristine demo rides state | 3 rides tomorrow, all seats free | 3 rides tomorrow, all seats free | ✅ |
