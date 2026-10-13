# USER_FLOW.md — User Journeys & Flows

Roles: **Student** (one account = Ride Owner + Rider) · **Admin**.
Screens: `/login` `/signup` `/rides/search` `/rides/new` `/rides/mine` `/requests/mine` `/admin/*`

---

## 1. App map
```mermaid
flowchart TD
  A[Landing / Login] -->|new user| B[Signup]
  B --> C{Role?}
  A -->|login| C
  C -->|student| D[Search Rides - home]
  C -->|admin| E[Admin Dashboard]
  D --> VF[Driver Verification]
  VF -->|admin approves| F
  D --> V[My Vehicles]
  V --> F
  E --> E0[Verifications queue]
  D --> F[Offer Ride]
  D --> G[My Rides]
  D --> H[My Requests]
  E --> E1[Users] & E2[Rides] & E3[Requests] & E4[Routes & Stops] & E5[Audit Log]
```

---

## 2. Journey: New student onboarding
| Step | Screen | User does | System does |
|---|---|---|---|
| 1 | `/signup` | Enters name, email, password, phone | Zod validates; Supabase creates user |
| 2 | — | — | Trigger creates `profiles` row, role = `student` |
| 3 | `/rides/search` | Lands on home | Shows today's rides |
| ✗ | `/signup` | Email already used / weak password | Friendly error toast |

---

## 2a. Journey: Become a verified driver (ID card + admin approval)
```mermaid
flowchart TD
  A[Student wants to offer ride] --> B{Verification status}
  B -->|not submitted| C[/verification form/]
  C --> D[Fill college, roll no, course, year, DL number]
  D --> E[Upload college ID card + DL photo - JPG/PNG/PDF ≤2MB]
  E --> F[Files → private bucket id-documents/user_id/]
  F --> G[rpc submit_driver_verification → status PENDING]
  G --> H[Banner: 'Verification pending — admin approve karega']
  H --> I[Admin: Verifications queue]
  I --> J[View docs via 60s signed URL]
  J --> K{Genuine?}
  K -->|yes| L[APPROVED ✔ → can add rides, Verified badge]
  K -->|no| M[REJECTED + reason → student can fix & resubmit]
  M --> C
  B -->|pending| H
  B -->|approved| N[Offer Ride form unlocked]
  L --> N
  N --> O[Ride listed → any student can book it]
  L -. later fake found .-> P[Admin revokes → open rides cancelled]
```
| Status | Student sees | Can book? | Can offer ride? |
|---|---|---|---|
| Not submitted | "Ride dene ke liye verification karein" + button | ✅ | ❌ |
| Pending | "Verification pending — admin approve karega" | ✅ | ❌ |
| Rejected | Reason + "Dobara submit karein" | ✅ | ❌ |
| Approved | ✔ Verified driver | ✅ | ✅ |

---

## 3. Journey: Add vehicle (only Car or Bike)
```mermaid
flowchart LR
  A[My Vehicles] --> B[Add Vehicle]
  B --> C{Type}
  C -->|🏍️ Bike| D[Brand/model, color, plate]
  C -->|🚗 Car| D
  D --> E{Valid plate & unique?}
  E -->|no| F[Error toast]
  E -->|yes| G[rpc add_vehicle] --> H[Vehicle card: 'Bike · 1 seat' / 'Car · up to 3 seats']
```
| Type | Rider seats | People on vehicle |
|---|---|---|
| 🏍️ Bike | exactly 1 | driver + 1 |
| 🚗 Car | 1 to 3 | driver + up to 3 |

Edit/delete allowed only if the vehicle has no ride with Pending/Accepted requests.

---

## 4. Journey: Ride Owner (Rahul offers a ride)
```mermaid
flowchart LR
  A[Offer Ride] --> VV{Verified driver?}
  VV -->|no| VW[Status banner → /verification]
  VV -->|yes| V{Has vehicle?}
  V -->|no| W[CTA: Pehle apni gaadi add karein → My Vehicles]
  V -->|yes| X[Select vehicle]
  X -->|Bike| S1[Seats locked = 1]
  X -->|Car| S2[Seats dropdown 1/2/3]
  S1 & S2 --> B[Pick route] --> C[Pick start & end stop]
  C --> D[Date, time, ₹/km]
  D --> E[Preview: 12 km · ₹96 · driver + N people]
  E --> F{Valid?}
  F -->|no| G[Show error]
  F -->|yes| H[rpc create_ride] --> I[My Rides + toast 'Ride posted']
```
| Step | User does | System does |
|---|---|---|
| 1 | Opens **Offer Ride** | Loads own vehicles, routes & stops |
| 2 | Selects vehicle | Bike → seats locked at 1; Car → seats 1–3 |
| 3 | Picks route → start/end stop | Only stops of that route; end after start |
| 4 | Date, time, rate/km | Trip km + total cost + "Driver + N" preview |
| 5 | Submits | `create_ride` checks vehicle ownership, seat limit by type, date, stops, daily limit |
| 6 | Sees ride in **My Rides** | 🚗 Swift (White) · `2/2 left` · 0 requests |

**Errors:** not verified / pending / rejected · no vehicle · bike >1 seat · car >3 seats · someone else's vehicle · past date · start = end · 5 rides/day · blocked user.

---

## 5. Journey: Rider (Aman finds & requests a seat)
```mermaid
flowchart TD
  A[Search: from, to, date, preferred time] --> B[rpc search_rides]
  B --> C{Results?}
  C -->|none| D[Empty state: 'Koi ride nahi mili' + Offer Ride CTA]
  C -->|yes| E[Cards sorted: Best → Good → Other]
  E --> F{Card state}
  F -->|own ride| G[Badge 'Your ride' - no button]
  F -->|full| H[Badge 'Ride full' - disabled]
  F -->|already requested| I[Shows current status]
  F -->|available| J[Request Seat]
  J --> K[Dialog: pickup & drop + estimated fare]
  K --> L[rpc request_seat]
  L -->|ok| M[Status Pending - My Requests]
  L -->|error| N[Toast: Ride full / already requested]
```
| Step | User does | System does |
|---|---|---|
| 1 | Search 62 → College, date, 08:15 | Filters in URL params |
| 2 | Sees list | Best match (same route ≤30 min), Good (≤60), Other; Full rides last. Each card: 🚗/🏍️ + model + color + seats left (no plate) |
| 3 | Taps **Request Seat** | Dialog with vehicle info, pickup/drop (pre-filled), estimated fare |
| 4 | Confirms | Optimistic "Pending"; `request_seat` locks ride, checks rules |
| 5 | Opens **My Requests** | 🟡 Pending chip, fare estimate |
| 6 | Owner accepts | 🟢 Accepted (live if realtime), owner phone + **number plate** visible to find the vehicle |
| 6b | Owner rejects / ride full | 🔴 Rejected |
| 7 | (opt) Cancels | ⚫ Cancelled, seat freed, fares recalculated |

---

## 6. Journey: Owner handles requests
```mermaid
flowchart TD
  A[My Rides] --> B[Ride card: seats left + request list]
  B --> C{Action}
  C -->|Accept| D{seats_left > 0?}
  D -->|no| E[Button disabled / 'Seats khatam']
  D -->|yes| F[rpc respond_to_request Accepted]
  F --> G[seats_left − 1, fares recalculated]
  G --> H{seats_left = 0?}
  H -->|yes| I[Other Pending → auto Rejected, badge 'Full']
  H -->|no| B
  C -->|Reject| J[Status Rejected, seats unchanged] --> B
```
Owner sees per request: rider name, pickup → drop, estimated fare, status. Footer: **Total collection ₹96 · Your share ₹37**.

---

## 6a. All seats booked → nobody else can book (Full-ride lock)
```mermaid
flowchart TD
  A[Owner accepts request] --> B[Lock ride row - FOR UPDATE]
  B --> C[seats_left = total_seats − accepted]
  C --> D{seats_left > 0?}
  D -->|no| E[Error 'Seats khatam' - nothing changes]
  D -->|yes| F[Status → Accepted]
  F --> G{seats_left now 0?}
  G -->|no| H[Ride stays open]
  G -->|yes| I[Ride = FULL]
  I --> J[All other Pending → Rejected 'Ride full']
  I --> K[Search: 'Full' badge, button disabled, moved to bottom]
  I --> L[New request_seat → 'Ride full hai' - even via API]
  I --> M[Owner: Accept buttons disabled]
  N[Accepted rider cancels] --> O[Seat freed → ride open again]
```
| Vehicle | Full after | Example |
|---|---|---|
| 🏍️ Bike | 1 accepted | Aman's bike: accept Rahul → Full; Neha auto-rejected; Priya blocked |
| 🚗 Car (3 seats) | 3 accepted | 4th rider blocked |
| 🚗 Car (2 seats) | 2 accepted | Rahul's ride in judge test |

Owner can't increase/decrease seats or swap vehicle once anyone is Accepted. Two people clicking the last seat at the same time → only one wins (row lock).

---

## 7. Request status lifecycle
```mermaid
stateDiagram-v2
  [*] --> Pending: request_seat
  Pending --> Accepted: owner accepts (seat available)
  Pending --> Rejected: owner rejects / ride full / ride cancelled
  Pending --> Cancelled: rider cancels
  Accepted --> Cancelled: rider cancels (seat freed)
  Accepted --> Rejected: ride cancelled by owner/admin
  Rejected --> [*]
  Cancelled --> [*]
```

## 8. Ride lifecycle
```mermaid
stateDiagram-v2
  [*] --> Open: create_ride
  Open --> Full: seats_left = 0 (computed, not stored)
  Full --> Open: accepted rider cancels
  Open --> Cancelled: owner/admin cancels
  Full --> Cancelled
  Open --> Completed: departure time passed
  Full --> Completed
```

---

## 9. Journey: Fare split (shown to everyone)
Bike: split between driver + 1 rider. Car: driver + up to 3 riders.
Route: Sector 62 (0) → Indirapuram (4) → Vaishali (7) → College (12) · ₹8/km
1. Owner posts ride → preview ₹96 total.
2. Each accept/cancel → `calculate_ride_fares` recalculates everyone.
3. Rider sees **Fare breakdown card**: "62→Indirapuram ₹32 ÷ 3 = ₹10.67 · Indirapuram→Vaishali ₹24 ÷ 4 = ₹6 → **₹17**".
4. Label "Estimated" until departure; then locked.

---

## 10. Journey: Admin
| Step | Screen | Admin does | System does |
|---|---|---|---|
| 1 | `/login` | Logs in | Server checks `role = admin` → `/admin` |
| 2 | Dashboard | Views stats | Users, rides today (car vs bike), requests by status, seats filled % |
| 3 | Users | Search, block/unblock | Blocked user can't act; rides hidden; audit log |
| 3a | Vehicles | Filter car/bike, remove fake vehicle | Blocked if vehicle on active ride (cancel ride first) |
| 3b | Verifications | Opens pending (oldest first), views ID card + DL, Approve / Reject (reason) / Revoke | Student status updates; audit log; revoke cancels open rides |
| 4 | Rides | Filter, cancel ride | Requests auto-Rejected; audit log |
| 5 | Requests | Override status | Seat limit still enforced; audit log |
| 6 | Routes & Stops | Add area/stop with km | Instantly available in dropdowns |
| 7 | Demo | Reset demo data | Reseeds sample data |

Student opening `/admin` → redirected with "Access denied".

---

## 11. Demo journey (judge test, ~3 min)
0. (Pre-seeded) Rahul, Priya, Aman = approved drivers. Neha = pending → show admin approving her live (30 s).
1. **Rahul** (🚗 car) offers 62 → College, 08:30, 2 seats. **Priya** (🚗 car) offers Vaishali → College, 08:45, 3 seats.
2. Rahul tries to request own ride → "Your ride".
3. **Aman** searches 62 → College, 08:15 → Rahul's ride = Best match → requests. **Neha** & **Priya** request too.
4. Rahul: accept Aman (1 left) → reject Neha (still 1) → accept Priya (0 left, Full, others auto-rejected).
5. New user tries → "Ride full".
6. Bonus: **Aman** (🏍️ bike) ride → 1 accept → Full instantly.
7. Show fare breakdown + admin dashboard.

## 12. Edge cases & messages
| Situation | Message |
|---|---|
| Own ride | "Yeh aapki ride hai" |
| Ride full | "Ride full hai" |
| Duplicate request | "Aap pehle hi request kar chuke ho" |
| Past ride | "Yeh ride nikal chuki hai" |
| Accept with 0 seats | "Seats khatam" |
| Blocked user | "Aapka account block hai, admin se contact karein" |
| Not owner | "Sirf ride owner yeh kar sakta hai" |
| Not verified (offer ride) | "Ride dene ke liye pehle verification karein" |
| Verification pending | "Verification pending — admin approve karega" |
| Verification rejected | "Verification reject hua: <reason>. Dobara submit karein" |
| Wrong file type / > 2 MB | "Sirf JPG, PNG ya PDF, max 2 MB" |
| No vehicle added | "Pehle apni gaadi add karein" |
| Bike > 1 seat | "Bike pe sirf 1 seat ho sakti hai" |
| Car > 3 seats | "Car mein max 3 seats (driver ke alawa)" |
| Plate already exists | "Yeh number plate pehle se registered hai" |
| Not your vehicle | "Yeh gaadi aapki nahi hai" |
| Edit vehicle/seats after accept | "Booking ho chuki hai, ab badlav nahi ho sakta" |
| Network error | "Kuch galat hua, dobara try karein" |
