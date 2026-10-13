# CLAUDE.md — Campus Carpool Matcher (Team Jugaad Junction)

> Entry point for any AI agent (Claude Code, Antigravity, Cursor). Read this file FIRST, then the files listed below in order.

## What we are building
A multi-user web app where college students share rides. One student account can **offer** a ride (driver/owner) and **request** a seat (rider). An **admin** manages everything. Fare is split **per km, per segment**.

Hackathon: 5.5 hours. Judges test: create 2 rides → search → request seats → accept/reject → **seat counts must always stay correct.**

## Read order (mandatory)
1. `docs/RULES.md` — non-negotiable rules (business + coding + agent)
2. `docs/PRD.md` — what to build
   + `docs/USER_FLOW.md` — user journeys, screen flows, status lifecycles, error messages
3. `docs/TECH.md` — stack and why
4. `docs/NAMING.md` — file/DB/code naming
   + `docs/STRUCTURE.md` — full app file tree (create files only where shown)
5. `docs/SECURITY.md` — security checklist
6. `docs/APP_MEMORY.md` — where app data/state lives
7. `docs/TASKS.md` — phase overview
   + `docs/PROJECT_TASKS.md` — every task (T-001…T-809) with owner, time, dependency, done-check, status (UPDATE IT)
8. `docs/FEATURES.md` — live progress tracker (UPDATE IT)
9. `docs/TESTING.md` + `reports/README.md` — test + report after every phase

Other: `docs/QUICKSTART.md`, `docs/COMMANDS.md`, `docs/SCALING.md`, `docs/FUTURE_SCOPE.md`

## Top 10 agent rules (full list in docs/RULES.md)
1. **UI = only the design file given by the user.** No own theme, no default shadcn look. If a screen is missing in the design, match its colors/fonts and report it.
2. **Never store `seats_left`.** Always compute: `total_seats − accepted requests`.
3. **All seat/fare/permission rules live in Postgres functions (RPC).** Frontend checks are UX only.
4. `owner_id` / `rider_id` / `admin` checks always come from `auth.uid()`, never from the client.
5. **RLS ON for every table.** Service role key never in the browser.
6. Work **phase by phase** (`docs/TASKS.md`). Don't start the next phase until the current one passes its tests.
7. After every phase: run tests (`docs/TESTING.md`) → write report in `reports/` → update `docs/FEATURES.md`.
8. Follow `docs/NAMING.md` exactly. File names must describe what the file does.
9. Core (judge test) before bonus. Fare split and admin panel come after seats work.
10. Never commit `.env*`. Never use `dangerouslySetInnerHTML`. Validate every input with Zod.

## Stack (one line)
Next.js 15 (App Router, TS) · Tailwind (tokens from design file) · shadcn/ui + **Skiper UI** (animated, via `motion`) · Supabase (Postgres + Auth + RLS + RPC + Realtime) · Zod · Sonner · date-fns · Vercel

## Driver verification (strict)
- Any student can **book** after signup. To **list a ride** they must upload **college ID card + driving licence** and get **admin approval**.
- Status: not_submitted → pending → approved / rejected (reason). Only admin changes it. `create_ride` rejects non-approved users server-side.
- Docs in **private** Storage bucket `id-documents/<user_id>/`, admin views via 60 s signed URL.

## Secrets (strict)
- Real keys only in `.env.local` / Vercel. `.gitignore` blocks `.env*` (except `.env.example`), keys, ID docs, `.run/`. Never commit or print keys.

## Run locally
`./start.sh` / `./stop.sh` (mac/Linux) · `start.bat` / `stop.bat` (Windows).

## Vehicles & full rides (strict)
- Only **Car** or **Bike**. Bike = **1** rider seat (driver + 1). Car = **1–3** rider seats (driver + up to 3). Driver never counted in seats.
- Ride shows vehicle (type, model, color). Plate + phone only for Accepted riders, owner, admin.
- When all seats are booked the ride is **Full**: no new requests, no more accepts, other Pending auto-Rejected. A cancel reopens a seat.

## Roles
| Role | Can do |
|---|---|
| `student` | Request/book seats anytime; after admin-approved ID verification: add vehicles (car/bike) and offer rides; accept/reject requests on own rides, cancel own requests |
| `admin` | Everything: approve/reject/revoke driver verifications, manage users (block/unblock), vehicles, rides, requests, routes/stops, view stats |

## Status of the project
See `docs/FEATURES.md` (source of truth for progress) and latest file in `reports/`.
