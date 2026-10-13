# STRUCTURE.md — Full App File Structure

Every file name says what it does (see `NAMING.md`). Create files only where shown here.

```
campus-carpool/
├─ CLAUDE.md                              # AI agent entry point
├─ .agent/rules/project-rules.md          # Antigravity always-on rules
├─ .gitignore                             # blocks .env*, keys, ID docs, .run/
├─ .env.example                           # placeholder keys (only env file in git)
├─ .env.local                             # real keys (gitignored, never pushed)
├─ start.sh · stop.sh                     # one-command run/stop (mac/Linux)
├─ start.bat · stop.bat                   # same for Windows
├─ package.json · tsconfig.json · next.config.ts (security headers)
├─ components.json                        # shadcn + Skiper UI registry config
├─ postcss.config.mjs · eslint.config.mjs
│
├─ design/                                # user's design file — ONLY UI source
├─ docs/                                  # all planning docs
├─ reports/                               # phase test reports + screenshots/
├─ .run/                                  # pid + logs from start.sh (gitignored)
│
├─ supabase/
│  ├─ migrations/
│  │  ├─ 0001_create_tables.sql
│  │  ├─ 0002_create_indexes.sql
│  │  ├─ 0003_create_profile_trigger.sql
│  │  ├─ 0004_create_views.sql
│  │  ├─ 0005_create_ride_rpc_functions.sql
│  │  ├─ 0006_create_seat_rpc_functions.sql
│  │  ├─ 0007_create_fare_function.sql
│  │  ├─ 0008_create_admin_functions.sql
│  │  ├─ 0009_create_verification_functions.sql
│  │  ├─ 0010_create_id_documents_bucket.sql
│  │  ├─ 0011_create_vehicle_rpc_functions.sql
│  │  └─ 0012_enable_rls_policies.sql
│  ├─ seed/
│  │  ├─ seed-demo-users.mjs               # Node script for creating demo auth users
│  │  └─ seed-demo-data.sql
│
├─ public/
│  ├─ icons/ (car.svg, bike.svg — from design)
│  └─ fonts/ (if design uses local fonts)
│
└─ src/
   ├─ middleware.ts                       # session refresh + route protection
   │
   ├─ app/
   │  ├─ layout.tsx                       # root: fonts, Toaster, MotionProvider
   │  ├─ globals.css                      # Tailwind + design tokens
   │  ├─ page.tsx                         # → redirect /rides/search or /login
   │  ├─ not-found.tsx · error.tsx
   │  │
   │  ├─ (auth)/
   │  │  ├─ layout.tsx                    # auth screens layout
   │  │  ├─ login/page.tsx
   │  │  └─ signup/page.tsx
   │  │
   │  ├─ (student)/
   │  │  ├─ layout.tsx                    # app nav (student)
   │  │  ├─ rides/
   │  │  │  ├─ search/page.tsx · loading.tsx
   │  │  │  ├─ new/page.tsx                # offer ride (verified drivers only)
   │  │  │  └─ mine/page.tsx · loading.tsx # owner: requests accept/reject
   │  │  ├─ requests/mine/page.tsx · loading.tsx
   │  │  ├─ vehicles/page.tsx
   │  │  └─ verification/page.tsx
   │  │
   │  └─ admin/
   │     ├─ layout.tsx                    # server-side admin role check
   │     ├─ page.tsx                      # dashboard
   │     ├─ verifications/page.tsx
   │     ├─ users/page.tsx
   │     ├─ vehicles/page.tsx
   │     ├─ rides/page.tsx
   │     ├─ requests/page.tsx
   │     ├─ routes/page.tsx
   │     └─ audit-log/page.tsx
   │
   ├─ actions/                            # server actions ("use server")
   │  ├─ auth-actions.ts
   │  ├─ verification-actions.ts
   │  ├─ vehicle-actions.ts
   │  ├─ ride-actions.ts
   │  ├─ request-actions.ts
   │  └─ admin-actions.ts
   │
   ├─ components/
   │  ├─ ui/                              # shadcn primitives (restyled to design)
   │  ├─ skiper/                          # Skiper UI animated components (restyled)
   │  │  ├─ app-preloader.tsx             # first-visit preloader (adapted, no brand)
   │  │  ├─ animated-nav.tsx
   │  │  ├─ animated-text.tsx
   │  │  └─ ...                           # only what the design needs
   │  ├─ layout/
   │  │  ├─ app-navbar.tsx
   │  │  ├─ admin-sidebar.tsx
   │  │  └─ page-header.tsx
   │  ├─ auth/
   │  │  ├─ login-form.tsx
   │  │  └─ signup-form.tsx
   │  ├─ verification/
   │  │  ├─ driver-verification-form.tsx
   │  │  ├─ verification-status-banner.tsx
   │  │  └─ verified-driver-badge.tsx
   │  ├─ vehicles/
   │  │  ├─ vehicle-form.tsx
   │  │  ├─ vehicle-card.tsx
   │  │  └─ vehicle-badge.tsx
   │  ├─ rides/
   │  │  ├─ ride-offer-form.tsx
   │  │  ├─ ride-search-filters.tsx
   │  │  ├─ ride-card.tsx
   │  │  ├─ ride-card-skeleton.tsx
   │  │  ├─ ride-list-empty.tsx
   │  │  ├─ route-timeline.tsx
   │  │  └─ seats-left-badge.tsx
   │  ├─ requests/
   │  │  ├─ request-seat-dialog.tsx
   │  │  ├─ request-row-owner.tsx
   │  │  ├─ request-row-rider.tsx
   │  │  ├─ request-status-badge.tsx
   │  │  └─ ride-contact-card.tsx         # phone + plate after Accepted
   │  ├─ fares/
   │  │  └─ fare-breakdown-card.tsx
   │  └─ admin/
   │     ├─ admin-stats-cards.tsx
   │     ├─ verification-review-card.tsx
   │     ├─ admin-users-table.tsx
   │     ├─ admin-vehicles-table.tsx
   │     ├─ admin-rides-table.tsx
   │     ├─ admin-requests-table.tsx
   │     ├─ admin-routes-editor.tsx
   │     └─ reset-demo-button.tsx
   │
   ├─ lib/
   │  ├─ supabase/
   │  │  ├─ create-browser-client.ts
   │  │  ├─ create-server-client.ts
   │  │  └─ create-admin-client.ts        # service role, server only
   │  ├─ validation/
   │  │  ├─ auth-schema.ts
   │  │  ├─ verification-schema.ts
   │  │  ├─ vehicle-schema.ts
   │  │  ├─ ride-offer-schema.ts
   │  │  └─ seat-request-schema.ts
   │  ├─ storage/
   │  │  ├─ upload-id-document.ts
   │  │  └─ create-signed-doc-url.ts      # server only, 60 s
   │  ├─ vehicles/vehicle-seat-limits.ts  # bike 1, car 1–3
   │  ├─ matching/match-label.ts          # Best / Good / Other
   │  ├─ motion/motion-presets.ts         # shared Skiper/motion variants + reduced-motion
   │  ├─ format/
   │  │  ├─ format-currency-inr.ts
   │  │  └─ format-ride-time.ts
   │  └─ constants/app-messages.ts        # all Hinglish error/success texts
   │
   ├─ hooks/
   │  ├─ use-ride-realtime.ts
   │  └─ use-reduced-motion-safe.ts
   │
   └─ types/
      ├─ database.types.ts                # generated by supabase CLI
      └─ app.types.ts                     # RideWithSeats, RequestStatus, VehicleType…
```

## Which layer does what
| Folder | Responsibility | Never |
|---|---|---|
| `app/` | Pages, layouts, loading/error states | Business rules |
| `actions/` | Server actions: Zod validate → `supabase.rpc()` → `revalidatePath` | Compute seats/fare |
| `components/ui` | shadcn primitives restyled to design | Data fetching |
| `components/skiper` | Animated Skiper UI pieces restyled to design | Business logic, brand logos |
| `components/<feature>` | Feature UI | Direct DB writes |
| `lib/` | Clients, schemas, pure helpers | Secrets in client files |
| `supabase/` | Schema, RPC (all rules), RLS, seed | — |
