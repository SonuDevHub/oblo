# TESTING.md — Phase Tests (Antigravity)

After **every** phase: run `npx tsc --noEmit && npm run lint && npm run build`, then the browser/SQL tests below with Antigravity's browser agent. Use two browser profiles (or normal + incognito) for multi-user tests. Save screenshots in `reports/screenshots/phase-<N>/`. Write the report (`reports/_TEMPLATE.md`).

Demo users (password `Test@1234`): rahul, priya, aman, neha, admin `@test.com`.

## Phase 0
- [ ] `./start.sh` (or `start.bat`) → site opens on http://localhost:3000.
- [ ] `./stop.sh` (or `stop.bat`) → process gone, port 3000 free.
- [ ] Running `start` twice → "Already running", no second server.
- [ ] Missing `.env.local` → script creates it from example and stops with message.
- [ ] `.env.local` not tracked; `git ls-files | grep -iE "\.env|secret|\.pem|\.key"` → only `.env.example`.

## Phase 1 (SQL editor)
- [ ] Insert bike ride with seats = 2 → fails. Car ride with seats = 4 → fails. Car with 0 → fails.
- [ ] Insert vehicle type `auto` → fails. Duplicate plate → fails.
- [ ] Insert duplicate request (same ride+rider) → fails.
- [ ] `v_rides_with_seats.seats_left` = total − accepted.
- [ ] `request_seat` on own ride → "Own ride" error.
- [ ] Accept beyond seats → error.
- [ ] RLS: as anon, `select * from ride_requests` → 0 rows.

## Phase 2
- [ ] Signup → profile row with role `student`.
- [ ] Login/logout works; logged out `/rides/mine` → `/login`.
- [ ] Screens match design file (screenshot vs design).

## Phase 3
### Verification
- [ ] New student Karan opens Offer Ride → banner "pehle verification karein", no form.
- [ ] Karan can still search & request seats.
- [ ] Karan uploads 5 MB file / .exe → rejected "Sirf JPG, PNG ya PDF, max 2 MB".
- [ ] Karan submits valid ID card + DL → status Pending; files in `id-documents/<karan-id>/`.
- [ ] Karan calls `rpc('create_ride')` directly → "Pehle verification approve hona chahiye".
- [ ] Admin rejects with reason → Karan sees reason, resubmits → Pending.
- [ ] Admin approves → Karan's Offer Ride unlocked, "✔ Verified driver" badge on his rides.
- [ ] Priya can't open Karan's document path; public URL fails.
### Vehicles & rides
- [ ] Rahul adds car (Maruti Swift, White, RJ14AB1234); Aman adds bike (Honda Activa, Black, RJ14CD5678).
- [ ] Neha (no vehicle) opens Offer Ride → "Pehle apni gaadi add karein" CTA.
- [ ] Rahul: car, 62 → College, today+1, 08:30, 2 seats, ₹8/km → success.
- [ ] Priya: car, Vaishali → College, 08:45, 3 seats → success.
- [ ] Aman: bike, Indirapuram → College, 08:40 → seats field locked at 1 → success.
- [ ] Car with 4 seats (via API/devtools) → "Car mein max 3 seats".
- [ ] Bike with 2 seats (via API) → "Bike pe sirf 1 seat".
- [ ] Ride with someone else's vehicle_id (via API) → denied.
- [ ] Past date, same start/end → validation errors.

## Phase 4
- [ ] Aman searches 62 → College, preferred 08:15 → Rahul's ride on top, "Best match".
- [ ] Seat badge 2/2. Own rides show "Your ride".
- [ ] Each card shows vehicle icon + type + model + color; **plate NOT visible**.
- [ ] Full ride shows "Full", button disabled, listed after available rides.
- [ ] Empty search shows empty state.

## Phase 5 — JUDGE TEST 🔴 (must pass 2×)
1. [ ] Rahul requests own ride → blocked.
2. [ ] Aman, Neha, Priya each request Rahul's ride (2 seats) → all Pending; badge still 2 left.
3. [ ] Rahul accepts Aman → **1 left**.
4. [ ] Rahul rejects Neha → **still 1 left**.
5. [ ] Rahul accepts Priya → **0 left**, remaining pending auto-Rejected, Accept buttons disabled.
6. [ ] New user requests Rahul's ride → "Ride full".
7. [ ] Aman's My Requests shows Accepted; Neha shows Rejected.
8. [ ] Two browsers click Accept on last seat simultaneously → only one succeeds.
9. [ ] 🟡 Aman cancels → 1 left again, ride no longer Full, new requests allowed.

### Bike + full-ride tests 🔴
10. [ ] Aman's bike ride: Rahul and Neha request → both Pending, badge 1/1.
11. [ ] Aman accepts Rahul → **0 left, Full**; Neha auto-Rejected with "Ride full".
12. [ ] Priya requests Aman's bike ride → blocked "Ride full hai" (UI + direct API).
13. [ ] Aman (or admin) tries to accept another → "Seats khatam".
14. [ ] Car ride 3 seats: accept 3 → Full; 4th request blocked.
15. [ ] Owner tries to edit seats/vehicle after an Accepted request → blocked.
16. [ ] Accepted rider sees owner phone + plate; Pending/Rejected rider doesn't.

## Phase 6
- [ ] Reproduce example: route 62(0)→Indirapuram(4)→Vaishali(7)→College(12), ₹8/km → Aman ₹37, Priya ₹17, Neha ₹6, owner ₹37; sum ₹96 (±₹1 rounding).
- [ ] Bike example: ₹3/km, rider 62→Vaishali → rider ₹11, driver ₹25 (sum ₹36 ±₹1).
- [ ] Cancel a rider → others' fares recalculated.
- [ ] Client cannot send/modify fare.

## Phase 7
- [ ] Student opens `/admin` → denied.
- [ ] Verifications queue shows Neha (pending), docs open via signed URL; URL stops working after 60 s.
- [ ] Admin revokes Rahul → his open rides cancelled, requests Rejected, Offer Ride locked.
- [ ] Admin blocks Neha → Neha can't request; her rides hidden.
- [ ] Admin overrides request → still respects seat limit; audit log row.
- [ ] All SECURITY.md §8 cases pass.
- [ ] Response headers include CSP, X-Frame-Options.

## Phase 8
- [ ] Realtime: Rahul accepts in browser A → Aman's status changes in browser B without refresh.
- [ ] Production URL: full judge test passes.
- [ ] Lighthouse performance ≥ 85 on Search page.
