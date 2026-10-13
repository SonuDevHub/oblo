# Oblo Rides — Campus Carpool Matcher

> Same route, same college, split by km.
> Built by **Team Jugaad Junction** for a 5.5-hour hackathon.

Oblo Rides is a multi-user web app where college students share rides. One student account can **book seats** on other students' rides and, after ID verification, **offer rides** with their own car or bike. Fare is split **per km, per segment**, and seat counts always stay correct, even when two people click "Accept" at the same time.

---

## Table of contents
1. [What's inside this repo](#1-whats-inside-this-repo)
2. [Features](#2-features)
3. [Tech stack](#3-tech-stack)
4. [Prerequisites](#4-prerequisites)
5. [Setup (first time)](#5-setup-first-time)
6. [Run the project](#6-run-the-project)
7. [Test accounts](#7-test-accounts)
8. [How to test (judge demo, ~3 min)](#8-how-to-test-judge-demo-3-min)
9. [Business rules](#9-business-rules)
10. [Fare split example](#10-fare-split-example)
11. [Security](#11-security)
12. [Project structure](#12-project-structure)
13. [Deploy (Vercel)](#13-deploy-vercel)
14. [Commands](#14-commands)
15. [Troubleshooting](#15-troubleshooting)
16. [Docs & credits](#16-docs--credits)

---

## 1. What's inside this repo

The repo holds **two separate Next.js apps** that both need their own `node_modules`:

| Folder | App | Port | What it is |
|---|---|---|---|
| `/` (root) | **Booking portal** | `3000` | The main app: login, search, offer ride, requests, fare split, admin panel. Uses Supabase. |
| `/frontend` | **Website** | `3001` | Public marketing website of Oblo Rides (landing page). Links to the booking portal. |

Both apps run independently. Run `npm install` **once in each folder** (see [Setup](#5-setup-first-time)).

---

## 2. Features

### Student (one account = rider + driver)
- **Sign up / log in** with email + password.
- **Search rides** by from-stop, to-stop, date, preferred time and vehicle type (Any / Car / Bike).
- **Smart matching**: results grouped as **Best match** (same route, ≤ 30 min), **Good match** (≤ 60 min), **Other rides**. Full rides are shown last.
- **Request a seat**: pick pickup and drop stop, and see the estimated fare before sending.
- **My Requests**: status tracker (Pending, Accepted, Rejected, Cancelled). Cancel a request.
- **Contact reveal**: owner phone and vehicle number plate are shown **only after Accepted**.
- **Driver verification**: upload college ID card and driving licence (JPG/PNG/PDF, max 2 MB). An admin approves.
- **My Vehicles**: add a car or bike (model, colour, plate).
- **Offer a ride** (verified drivers only): vehicle, route, stops, date, time, seats, rate per km, with a live km and cost preview.
- **My Rides**: see the requests on each ride and Accept or Reject them. Shows total collection and the driver's own share.
- **Fare breakdown card**: per-segment split, recalculated on every accept or cancel.
- **Schematic route map**: an SVG metro-style line built from the stops and km (no GPS or map APIs).
- **Realtime** seat and status updates (Supabase Realtime).

### Admin
- **Dashboard**: total users, pending verifications, verified drivers, rides today (car/bike), requests by status, seats filled %.
- **Verifications queue**: view documents through 60-second signed URLs, then Approve, Reject (with reason) or Revoke.
- **Users**: search and block/unblock.
- **Vehicles**: filter and remove fake ones.
- **Rides**: filter and cancel.
- **Requests**: override status (the seat limit is still enforced).
- **Routes & stops**: add new areas with km, without any code change.
- **Audit log**: who did what, and when.
- **Reset demo data** button.

### Website (`/frontend`)
- Landing page explaining how Oblo Rides works, with a call-to-action to the booking portal.

---

## 3. Tech stack

| Layer | Tech |
|---|---|
| Framework | Next.js 15 (App Router, TypeScript strict) |
| Styling | Tailwind CSS v4 with design tokens in `src/app/globals.css`, dark theme |
| UI | shadcn/ui (restyled), Skiper UI + `motion` for animations, lucide-react icons |
| Fonts | Sora, Manrope, JetBrains Mono (`next/font`) |
| Backend | Supabase: Postgres, Auth, Storage, Row Level Security, RPC functions, Realtime |
| Validation | Zod (client and server) |
| UX | Sonner toasts, date-fns |
| Hosting | Vercel (`bom1` Mumbai) + Supabase (`ap-south-1` Mumbai) |

**Core idea:** every seat, fare and permission rule lives in **Postgres functions**. The frontend only calls RPC and shows the result, so the rules can't be bypassed from the browser.

---

## 4. Prerequisites

- **Node.js 20+** and npm: check with `node -v`
- **Git**
- A **Supabase** account (free plan is enough)
- A **Vercel** account (only for deploying)

> **Windows tip:** keep the project **outside OneDrive** (e.g. `C:\dev\oblo-rides`). OneDrive sync makes Next.js very slow and can lock files.

---

## 5. Setup (first time)

### 5.1 Clone
```bash
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>
```

### 5.2 Install dependencies (both apps)
```bash
# booking portal (root)
npm install

# website
cd frontend
npm install
cd ..
```

### 5.3 Supabase project
1. Create a new project at [supabase.com](https://supabase.com). Choose region **South Asia (Mumbai) `ap-south-1`**.
2. Under **Authentication → Sign In / Providers → Email**: set Enabled = ON and **Confirm email = OFF**.
3. Under **Authentication → URL Configuration**:
   - Site URL: `http://localhost:3000`
   - Redirect URLs: add `http://localhost:3000/**`
4. Under **Project Settings → API Keys**, copy the Project URL, the anon (publishable) key and the service_role (secret) key.

### 5.4 Environment variables
```bash
cp .env.example .env.local       # Windows: copy .env.example .env.local
```
Fill in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>   # server only, never public
NEXT_PUBLIC_APP_URL=http://localhost:3000
PORT=3000
USE_LOCAL_SUPABASE=false
```
If the website needs env values, also create `frontend/.env.local` from `frontend/.env.example` (if one exists). For example, set `NEXT_PUBLIC_APP_URL=http://localhost:3000` so the "Book a ride" button opens the portal.

> `.env.local` is gitignored. **Never commit real keys.** Only `.env.example` goes to git.

### 5.5 Database: migrations, seed and types
```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push                                   # creates tables, RPC, RLS, storage bucket
node supabase/seed/seed-demo-users.mjs                 # creates the 5 demo accounts
```
Then run `supabase/seed/seed-demo-data.sql` in **Supabase → SQL Editor**. It adds the routes, stops, verifications, vehicles and 3 rides for tomorrow.
```bash
npx supabase gen types typescript --linked > src/types/database.types.ts
```
If the admin account doesn't open `/admin`, run this in the SQL Editor:
```sql
update profiles set role = 'admin' where email = 'admin@test.com';
```

> No CLI? Paste each file from `supabase/migrations/` into the SQL Editor **in number order**, then run the seed.

---

## 6. Run the project

### Booking portal (port 3000)
**One command** (installs deps if missing, starts the server, opens the browser):

| OS | Start | Stop |
|---|---|---|
| Windows | `start.bat` | `stop.bat` |
| macOS / Linux / Git Bash | `./start.sh` (run `chmod +x start.sh stop.sh` once) | `./stop.sh` |

Or start it manually:
```bash
npm run dev            # development  → http://localhost:3000
npm run build && npm run start   # production mode (much faster)
```
Server logs: `.run/next-dev.log`

### Website (port 3001)
```bash
cd frontend
npm run dev -- -p 3001           # → http://localhost:3001
# production:
npm run build && npm run start -- -p 3001
```

### Run both together
Use two terminals:
```bash
# terminal 1 (root)
npm run dev
# terminal 2
cd frontend && npm run dev -- -p 3001
```

> **Dev mode is slow on the first visit of each page** because Next.js compiles it. To judge real speed, use `npm run build && npm run start`.

---

## 7. Test accounts

All passwords: **`Test@1234`**

| Email | Password | Role | Use it to test |
|---|---|---|---|
| `rahul@test.com` | `Test@1234` | Verified driver (Car: Maruti Swift, White) | Offer a ride, accept/reject requests |
| `priya@test.com` | `Test@1234` | Verified driver (Car) | Offer a ride, book others' rides |
| `aman@test.com` | `Test@1234` | Verified driver (Bike: Honda Activa, Black) | Bike ride (1 seat), book rides |
| `neha@test.com` | `Test@1234` | Student, **verification pending** | Can book only. Offer Ride shows "Verification pending" |
| `admin@test.com` | `Test@1234` | Admin | `/admin`: approve Neha, manage everything |

**Seeded data:** 2 routes. Route 1 is **Sector 62 (0 km) → Indirapuram (4) → Vaishali (7) → College (12)**. There are 3 rides dated tomorrow:
- Rahul: car, 62 → College, 08:30, 2 seats, ₹8/km
- Priya: car, Vaishali → College, 08:45, 3 seats, ₹8/km
- Aman: bike, Indirapuram → College, 08:40, 1 seat, ₹3/km

> Tip: for multi-user testing, use one normal browser window and one incognito window (or two browser profiles).
> Admin can reset all demo data at any time with **Admin → Reset demo data**.

---

## 8. How to test (judge demo, ~3 min)

1. **Admin approves a driver:** log in as `admin@test.com`, open **Verifications**, open Neha's documents and approve.
2. **Create rides:** as Rahul, offer 62 → College, 08:30, 2 seats. As Priya, offer Vaishali → College, 08:45, 3 seats.
3. **Own ride blocked:** Rahul searches and sees "Yeh aapki ride hai" on his own ride, with no request button.
4. **Search:** Aman searches 62 → College, 08:15. Rahul's ride shows on top as **Best match**, with **2/2 seats left**.
5. **Request:** Aman, Neha and Priya each request Rahul's ride. All are **Pending** and the ride still shows 2 seats left.
6. **Accept / Reject** (as Rahul):
   - Accept Aman: **1 left**
   - Reject Neha: **still 1 left** (a reject never changes seats)
   - Accept Priya: **0 left, Full**. All remaining pending requests are auto-rejected and the Accept buttons are disabled.
7. **Full lock:** any new user requesting this ride gets **"Ride full hai"**, even through the API.
8. **Contact reveal:** Aman (Accepted) sees Rahul's phone and number plate. Neha (Rejected) does not.
9. **Bike:** on Aman's bike ride, one accept makes it **Full** immediately.
10. **Fare:** open the fare breakdown card. Each segment is split among everyone on board, driver included.
11. **Concurrency:** two browsers click Accept on the last seat at the same time. **Only one succeeds.**

---

## 9. Business rules

| Rule | Enforced where |
|---|---|
| Vehicle is only **Car** or **Bike** | DB `CHECK` |
| **Bike = 1 seat**, **Car = 1–3 seats**. The driver is never counted | Zod + RPC + DB `CHECK` |
| `seats_left = total_seats − accepted requests`, always computed and **never stored** | DB view / RPC |
| You can't request a seat on your own ride | RPC |
| One request per user per ride | DB `UNIQUE` |
| Accept only if `seats_left > 0`. Reject never changes seats | RPC + row lock |
| Last seat accepted: ride is **Full**, and the remaining Pending requests are auto-rejected | RPC (same transaction) |
| An Accepted rider cancelling frees the seat and reopens the ride | RPC |
| Only **admin-verified drivers** can offer rides | RPC (`create_ride`) |
| No past rides, start ≠ end, pickup before drop, max 5 rides/day | RPC |
| Number plate and phone are visible only to the owner, Accepted riders and admin | RPC (`get_ride_contact`) |
| Two users can never take the same last seat | `SELECT … FOR UPDATE` |

---

## 10. Fare split example

Route: Sector 62 (0) → Indirapuram (4) → Vaishali (7) → College (12), at ₹8/km, for a **trip cost of ₹96**.
Each segment's cost is split equally among **everyone on the vehicle on that segment, including the driver**.

| Person | Travels | Fare |
|---|---|---|
| Aman | 62 → College (full) | ₹37 |
| Priya | 62 → Vaishali | ₹17 |
| Neha | Indirapuram → Vaishali | ₹6 |
| Driver | full route | ₹36 (trip cost − riders' total, so the sum is exactly ₹96) |

Bike example, at ₹3/km (₹36 trip): the rider goes 62 → Vaishali and pays **₹11**, and the driver pays **₹25**.

Fares are calculated **only in the database** and recalculated on every accept or cancel. The client never sends a fare.

---

## 11. Security

- **Row Level Security** is on for every table. Ownership always comes from `auth.uid()`.
- All writes go through `security definer` RPC functions with `search_path = public`.
- The admin role is set only in the database, never through signup.
- ID documents are stored in a **private** bucket (`id-documents/<user_id>/`). Users can only access their own folder, and the admin views them through **60-second signed URLs**.
- Uploads are limited to JPG/PNG/PDF, 2 MB max, with app-generated filenames.
- Security headers: CSP, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`.
- Zod validates every input. There is no `dangerouslySetInnerHTML`. The login error is always generic.
- The service role key is server-only. `.env*` files are gitignored (except `.env.example`).

Run this before every push. It must print **only** `.env.example`:
```bash
git ls-files | grep -iE "\.env|secret|\.pem|\.key"
```
If a key ever gets pushed, **rotate it immediately** in the Supabase dashboard.

---

## 12. Project structure

```
.
├─ frontend/                 # Website (Next.js) — run separately on :3001
├─ src/                      # Booking portal (Next.js)
│  ├─ app/                   # (auth) login/signup · (student) rides, requests, vehicles, verification · admin/*
│  ├─ actions/               # server actions → supabase.rpc()
│  ├─ components/            # ui/ (shadcn) · skiper/ · rides/ · requests/ · vehicles/ · verification/ · fares/ · admin/ · layout/
│  ├─ lib/                   # supabase clients, zod schemas, storage, matching, format, constants
│  ├─ hooks/                 # use-ride-realtime, use-reduced-motion-safe
│  ├─ types/                 # database.types.ts (generated)
│  └─ middleware.ts          # session refresh + route protection
├─ supabase/
│  ├─ migrations/            # 0001 … numbered SQL (tables, views, RPC, RLS, storage)
│  └─ seed/                  # seed-demo-users.mjs + seed-demo-data.sql
├─ public/brand/             # Oblo logos
├─ design/DESIGN.md          # UI source of truth
├─ docs/                     # PRD, rules, tech, security, tasks, testing …
├─ reports/                  # phase test reports
├─ start.sh / stop.sh        # one-command run (mac/Linux)
├─ start.bat / stop.bat      # one-command run (Windows)
└─ .env.example              # placeholder keys (only env file in git)
```

---

## 13. Deploy (Vercel)

The two apps are deployed as **two Vercel projects** from the same repo.

### 13.1 Booking portal
1. Push to GitHub (run the secret check first).
2. On [vercel.com](https://vercel.com), choose **Add New → Project** and import the repo.
3. Set the **Root Directory** to `/` (the default). The framework is detected as Next.js.
4. Add these **Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server only)
   - `NEXT_PUBLIC_APP_URL` = your production URL
5. The region is set to Mumbai through `vercel.json`: `{ "regions": ["bom1"] }`
6. Click **Deploy**.
7. In **Supabase → Authentication → URL Configuration**:
   - Site URL: `https://<portal>.vercel.app`
   - Redirect URLs: add `https://<portal>.vercel.app/**` (keep the localhost entry too)

### 13.2 Website
1. In Vercel, create **another project** by importing the same repo.
2. Set the **Root Directory** to `frontend`.
3. Add its env vars, e.g. `NEXT_PUBLIC_APP_URL=https://<portal>.vercel.app` for the booking button.
4. Click **Deploy**.

After this, every `git push` to `main` redeploys both apps automatically.

---

## 14. Commands

| Command | What it does |
|---|---|
| `start.bat` / `./start.sh` | Start the booking portal (one command) |
| `stop.bat` / `./stop.sh` | Stop everything and free the port |
| `npm run dev` | Dev server (root → :3000) |
| `cd frontend && npm run dev -- -p 3001` | Website dev server |
| `npm run build` / `npm run start` | Production build / run |
| `npm run lint` · `npx tsc --noEmit` | Lint · type check |
| `npx supabase db push` | Apply migrations |
| `npx supabase gen types typescript --linked > src/types/database.types.ts` | Regenerate DB types |
| `node supabase/seed/seed-demo-users.mjs` | Create the demo accounts |

---

## 15. Troubleshooting

| Problem | Fix |
|---|---|
| `start.bat` stays on "Waiting for server…" | The first compile takes 30–60 s. If it's still stuck, run `stop.bat`, then `npm run dev` to see the error, and check `.run/next-dev.log` |
| Very slow pages / login | Move the project out of OneDrive. Use `npm run build && npm run start` for real speed |
| "Fill real keys in .env.local first" | `.env.local` still has the placeholder values. Paste your Supabase keys |
| Port 3000 already in use | Run `stop.bat` / `./stop.sh`, or change `PORT` in `.env.local` |
| Admin gets "Access denied" | Run `update profiles set role='admin' where email='admin@test.com';` |
| Login fails right after signup | Check that Supabase **Confirm email** is OFF |
| Login works locally but not on Vercel | Add the Vercel URL to the Supabase Site URL and Redirect URLs |
| `frontend` won't start | Run `cd frontend && npm install` first. It has its own `node_modules` |
| Types out of date after a DB change | Regenerate them with `npx supabase gen types …` |

---

## 16. Docs & credits

- Planning docs: `docs/` (PRD, RULES, TECH, SECURITY, USER_FLOW, TESTING, TASKS)
- Design system: `design/DESIGN.md`
- Test reports: `reports/`
- UI components: [shadcn/ui](https://ui.shadcn.com) · [Skiper UI](https://skiper-ui.com) · icons by [lucide](https://lucide.dev)

**Team Jugaad Junction** · Oblo Rides
