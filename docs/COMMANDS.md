# COMMANDS.md — Project Commands

## One-command local run
| Command | What it does |
|---|---|
| `./start.sh` / `start.bat` | Start whole site locally (deps, optional local Supabase, Next.js, opens browser) |
| `./stop.sh` / `stop.bat` | Stop everything, free port |
| `tail -f .run/next-dev.log` | Watch server logs |

## Secrets check (before every push)
| Command | What it does |
|---|---|
| `cp .env.example .env.local` | Create local env file |
| `git ls-files \| grep -iE "\.env\|secret\|\.pem\|\.key"` | Must print only `.env.example` |
| `git rm --cached .env.local` | If accidentally tracked (then rotate keys!) |

## App
| Command | What it does |
|---|---|
| `npm run dev` | Start dev server (localhost:3000) |
| `npm run build` | Production build (run before each phase report) |
| `npm run start` | Run production build locally |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Type check |

## Supabase
| Command | What it does |
|---|---|
| `npx supabase login` | Login CLI |
| `npx supabase link --project-ref <ref>` | Link local to project |
| `npx supabase migration new <what_it_does>` | New migration file |
| `npx supabase db push` | Apply migrations to remote |
| `npx supabase gen types typescript --linked > src/types/database.types.ts` | Regenerate DB types |
| `npx supabase db reset` | ⚠️ Local only — reset DB |

## shadcn
| Command | What it does |
|---|---|
| `npx shadcn@latest add <component>` | Add primitive (then restyle to design) |
| `npx shadcn@latest add @skiper-ui/<name>` | Add Skiper UI Pro component (license needed) |
| `npm i motion` | Animation engine for Skiper UI |

## Git
```bash
git checkout -b feat/<area>-<short>
git add . && git commit -m "feat(phase-N): <summary>"
git push -u origin HEAD
git checkout main && git pull && git merge feat/... 
```

## Deploy
| Command | What it does |
|---|---|
| `npx vercel` | Preview deploy |
| `npx vercel --prod` | Production deploy |

## Useful SQL
```sql
-- Seat check for a ride
select id, total_seats, seats_left from v_rides_with_seats where id = '<ride>';
-- Make admin
update profiles set role='admin' where email='admin@test.com';
-- Reset demo (admin)
select admin_reset_demo();
```
