# PRD — Campus Carpool Matcher

**Team:** Jugaad Junction · **Time box:** 5.5 hours · **Type:** Multi-user web app

## 1. Problem
Students going in the same direction to/from college travel separately. They need a simple way to find and share rides, and split cost fairly by distance.

## 2. Goals
- Students can offer and find shared rides quickly.
- Seat counts are **always correct** (core judge test).
- Fare is fair: you pay only for the km you travel, shared with whoever is in the car.
- Admin can manage everything.

## 3. Non-goals
Live maps, GPS, real payments, chat, mobile native app.

## 4. Users & roles
| Role | Description |
|---|---|
| **Student** | Single account. **Rider** (books seats) right after signup. Becomes **Ride Owner / Driver** (lists rides) only after ID verification is **approved by admin**. |
| **Admin** | Manages users, rides, requests, routes/stops; sees stats. |

## 5. Judge test (must pass)
1. Create two rides.
2. Search for a ride.
3. Request seats.
4. Accept / reject — seat counts stay correct; requests blocked on full ride and own ride.

## 6. Features

### 6.1 Auth (🔴)
- Sign up: name, email, password, phone (optional). Login, logout.
- Email confirmation OFF (hackathon). 🟡 Restrict to college email domain.
- Protected routes via middleware. Admin routes check role.

### 6.1a Driver verification — ID card + admin approval (🔴)
Goal: no fake drivers. Anyone can **book**; only **admin-approved** students can **list rides**.

| Field | Required |
|---|---|
| Full name, phone | 🔴 |
| College name, roll/enrollment no., course, year | 🔴 |
| College ID card photo (front) | 🔴 |
| Driving licence number + photo | 🔴 |
| Selfie | 🟡 |

- Upload: JPG/PNG/PDF, ≤ 2 MB, private bucket `id-documents/<user_id>/…`.
- Status: `Not submitted` → `Pending review` → `Approved` ✔ / `Rejected` (reason shown, can resubmit).
- Offer Ride + My Vehicles show a status banner until approved: "Verification pending — admin approve karega".
- Admin **Verifications** queue: list pending (oldest first), view docs (signed URL), Approve / Reject with reason, Revoke later.
- Approved drivers get a **✔ Verified driver** badge on ride cards.
- Screen: `/verification` (student), `/admin/verifications` (admin).

### 6.2 My Vehicles (🔴)
Before offering a ride a student adds a vehicle. Only **2 types**:

| Type | Rider seats | People on vehicle | Icon |
|---|---|---|---|
| 🏍️ **Bike** | **exactly 1** | driver + 1 | bike |
| 🚗 **Car** | **1 to 3** | driver + up to 3 | car |

Fields: type (Car/Bike), brand & model (e.g. Maruti Swift / Honda Activa), color, number plate (`RJ14AB1234`, unique).
Student can add multiple vehicles, edit/delete one that isn't on an active ride.

### 6.3 Offer a ride (🔴)
Fields: **vehicle (select from my vehicles)**, route, start stop, end stop, date, departure time, seats, rate per km (₹).
- Bike selected → seats **locked to 1** (field disabled).
- Car selected → seats dropdown **1, 2, 3** only.
- Shows trip km, total trip cost preview and "People on vehicle: driver + N".
- No vehicle yet → CTA "Pehle apni gaadi add karein" → My Vehicles.

### 6.3a Full ride behaviour (🔴)
When accepted riders = seats (bike 1, car up to 3) the ride is **Full**:
- Search card: "Full" badge, Request button disabled, card moved below available rides.
- API: `request_seat` returns "Ride full hai"; `respond_to_request('Accepted')` returns "Seats khatam".
- All remaining Pending requests are auto-Rejected with reason "Ride full".
- If an Accepted rider cancels → seat freed → ride available again.
- Owner can't change seats/vehicle once someone is Accepted.

### 6.4 Search rides (🔴)
Filters: from stop, to stop, date, preferred time (optional), 🟡 vehicle type (Any/Car/Bike).
Result card: owner name, **vehicle (icon + type + model + color)**, route timeline (start→end), departure time, **seats left badge** (e.g. 🚗 2/3 left, 🏍️ 1/1 left, or "Full"), match label, estimated fare for the searched pickup→drop, Request button.
Number plate hidden here (shown only after Accepted).
Ordering: Best match → Good match → Other rides. 20 per page.

### 6.5 Request a seat (🔴)
Rider sees vehicle details, picks pickup + drop stop (pre-filled from search) → Request → status `Pending`.
Blocked with message: own ride, ride full, already requested, past ride, blocked user.

### 6.6 My Rides — owner view (🔴)
List of own rides with seats left, requests (rider name, pickup→drop, estimated fare, status). Accept / Reject buttons. Accept disabled at 0 seats. Total collection + owner's share.
🟡 Cancel ride.

### 6.7 My Requests — rider view (🔴)
List with status chip: 🟡 Pending · 🟢 Accepted · 🔴 Rejected · ⚫ Cancelled. Vehicle info, estimated fare. 🟡 Cancel request. When **Accepted**: owner phone + **vehicle number plate** visible (so rider can find the vehicle).

### 6.8 Fare split per km (🔴 after core)
- Route = ordered stops with `km_from_start`.
- Segment cost = segment km × rate_per_km.
- Split equally among everyone in the car on that segment (driver included).
- Rider fare = Σ shares, rounded to ₹. Shown as breakdown ("4 km ÷ 3 + 3 km ÷ 4").
- Recalculated on accept/cancel. Fallback: rider_km × rate.

**Car example (3 seats):** Route 62(0)→Indirapuram(4)→Vaishali(7)→College(12), ₹8/km = ₹96.
Driver + Aman full route, Priya 62→Vaishali, Neha Indirapuram→Vaishali → Aman ₹37, Priya ₹17, Neha ₹6, Driver ₹37.

**Bike example (1 seat):** same route, ₹3/km = ₹36. Rider goes 62→Vaishali (7 km): 7×3 = ₹21 ÷ 2 = **₹10.5 → ₹11**; Vaishali→College only driver → driver pays ₹15. Rider ₹11, driver ₹25.

### 6.9 Admin panel (🔴 basic / 🟡 full)
- Dashboard stats: total users, **pending verifications**, verified drivers, rides today, requests by status, seats filled %.
- Verifications: approve / reject (reason) / revoke drivers after checking ID card + DL.
- Users: list, search, block/unblock, make admin (🟡).
- Vehicles: list all, filter by type, see owner, remove fake/invalid vehicle.
- Rides: list all, filter by date/status/vehicle type, cancel any ride.
- Requests: list all, override status (with audit log).
- Routes & stops: CRUD (add new area without code change).
- Audit log: who did what, when (🟡).

### 6.10 Realtime (🟡)
Seat counts and request statuses update live via Supabase Realtime.

### 6.11 Demo helpers (🟡)
Seed script (4 students + 1 admin + 2 routes + vehicles: Rahul car, Priya car, Aman bike + 3 rides). Admin "Reset demo data" button.

## 7. Screens
`/login` · `/signup` · `/verification` · `/rides/search` · `/rides/new` · `/rides/mine` · `/requests/mine` · `/vehicles` · `/admin` · `/admin/verifications` · `/admin/users` · `/admin/vehicles` · `/admin/rides` · `/admin/requests` · `/admin/routes`

**Design:** only the design file provided by the user (see RULES.md §C).

## 8. Success criteria
- Judge test passes in < 3 minutes live.
- Zero overbooking even with two browsers accepting simultaneously.
- Pages load < 1.5 s on hackathon WiFi (Mumbai region).
