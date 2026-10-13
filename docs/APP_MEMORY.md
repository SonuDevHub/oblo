# APP_MEMORY.md — Where the App's Data & State Live

## 1. Persistent data (source of truth) → Supabase Postgres
| Data | Table | Notes |
|---|---|---|
| User profile, role, blocked flag | `profiles` | 1:1 with `auth.users`, auto-created by trigger |
| Driver verification (status, details, doc paths) | `driver_verifications` | One row per student; status set only by admin |
| ID card / DL / selfie files | Supabase Storage `id-documents/<user_id>/` | Private; admin views via 60 s signed URL |
| Vehicles (car/bike, model, color, plate) | `vehicles` | Per student; plate private |
| Routes & stops (with km) | `routes`, `stops` | Seeded; admin can add |
| Rides | `rides` | `total_seats` stored; `seats_left` **never stored** |
| Seat requests + fare | `ride_requests` | `status`, `fare_estimate` (written only by DB function) |
| Admin/audit history | `audit_logs` | Append-only |
| Derived seats | `v_rides_with_seats` view | Computed every read |

## 2. Auth session → Supabase Auth + HTTP-only cookies
- Managed by `@supabase/ssr`. Middleware refreshes on every request.
- Never store tokens in `localStorage` manually.

## 3. Server state in UI → fetched per request
- Server Components fetch fresh data (no long cache): `export const dynamic = 'force-dynamic'` on ride/request pages.
- After a mutation: `revalidatePath('/rides/mine')` etc.

## 4. Client state → React only (temporary)
| State | Where |
|---|---|
| Form inputs | `useActionState` / local state |
| Search filters | **URL search params** (`?from=..&to=..&date=..&time=..`) — shareable, survives refresh |
| Optimistic status ("Pending" instantly) | `useOptimistic` |
| Toasts | Sonner |
| Realtime updates | `useRideRealtime` hook subscribing to `ride_requests` changes |

## 4a. Secrets & local runtime
| What | Where | In git? |
|---|---|---|
| Real keys | `.env.local` (local), Vercel env (prod) | ❌ never |
| Placeholder keys | `.env.example` | ✅ |
| Dev server PID + logs | `.run/` | ❌ |

## 5. What is NOT stored anywhere
- `seats_left` (computed)
- Fare in client (only displayed from DB)
- Passwords (Supabase handles hashes)
- No `localStorage` for app data.

## 6. Data flow example: Accept request
```
Owner clicks Accept
 → (optimistic) UI shows "Accepted…"
 → Server Action respondToRequestAction(id,'Accepted')
 → rpc respond_to_request  [locks ride row, checks seats, updates status,
                            auto-rejects pending if full, recalculates fares, audit log]
 → revalidatePath + Realtime event → rider's screen updates
 → on error → rollback optimistic + toast(error.message)
```

## 7. Agent memory (for AI, not the app)
- Project progress: `docs/FEATURES.md`
- Phase results: `reports/`
- Decisions/rules: `CLAUDE.md`, `docs/RULES.md`
