# QUICKSTART.md — Start the Project

Accounts already ready: GitHub, Supabase, Vercel.

## 1. Supabase (5 min)
1. New project → region **Mumbai (ap-south-1)** → save DB password.
2. Authentication → Providers → Email → **Confirm email: OFF**.
3. Settings → API → copy `Project URL`, `anon key`, `service_role key`.

## 2. Create app (5 min)
```bash
npx create-next-app@latest campus-carpool --ts --tailwind --app --src-dir --eslint --import-alias "@/*"
cd campus-carpool
npm i @supabase/supabase-js @supabase/ssr zod sonner date-fns motion
npm i -D supabase
npx shadcn@latest init
npx shadcn@latest add button card input select badge dialog table tabs skeleton
```
Skiper UI: free components → copy source from skiper-ui.com into `src/components/skiper/`; Pro → `npx shadcn@latest add @skiper-ui/<name>` (license needed). See TECH.md "Skiper UI".

Copy this docs pack (`CLAUDE.md`, `docs/`, `reports/`, `.agent/`) into the project root.

## 3. Env (keys never go to git)
```bash
cp .env.example .env.local     # fill real values
chmod +x start.sh stop.sh      # mac/Linux, once
```
`.gitignore` from the pack already blocks `.env*` (except `.env.example`), keys, ID docs, `.run/`.
Verify: `git ls-files | grep -iE "\.env|secret|\.pem|\.key"` → only `.env.example`.

## 3a. Storage bucket
Supabase → Storage → create bucket **`id-documents`**, **Private**, max 2 MB, MIME `image/jpeg,image/png,application/pdf` (or run migration `0004b`).

## 4. Database
```bash
npx supabase login
npx supabase link --project-ref <ref>
npx supabase db push              # runs supabase/migrations/*
psql "<connection-string>" -f supabase/seed/seed-demo-data.sql   # or paste in SQL editor
npx supabase gen types typescript --linked > src/types/database.types.ts
```
(No CLI? Paste each migration file into Supabase SQL Editor in order.)

## 5. Make yourself admin
```sql
update profiles set role = 'admin' where email = 'admin@test.com';
```

## 6. Run / stop (one command)
| OS | Start | Stop |
|---|---|---|
| mac / Linux / Git Bash | `./start.sh` | `./stop.sh` |
| Windows | `start.bat` (double-click) | `stop.bat` |

Start script: checks Node 20+, `.env.local`, installs deps if missing, (optional) starts local Supabase if `USE_LOCAL_SUPABASE=true`, runs Next.js in background, waits till ready, opens browser. Logs: `.run/next-dev.log`.
Stop script: kills the server process tree, frees the port, stops local Supabase if it was started.

## 7. Design
Put the design file (Figma link / PNGs / PDF) in `design/`. Agent builds UI only from it.

## 8. Deploy
GitHub push → Vercel import → add the 3 env vars → Deploy.

## Demo accounts (password `Test@1234`)
rahul@test.com · priya@test.com · aman@test.com (approved drivers) · neha@test.com (verification pending) · admin@test.com
