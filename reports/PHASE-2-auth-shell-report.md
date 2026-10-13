# PHASE 2 — Auth + App Shell + Design Tokens Report

**Date/time:** 2026-10-13 15:28 · **Agent:** Antigravity · **Commit:** `pending`  
**Result:** ✅ PASS

---

## 1. What was built
- **Design Tokens (T-201):** Extracted palette, typography, radii, shadows, and status chips from `design/globals.css` into `src/app/globals.css` using Tailwind CSS v4 `@theme inline`. Zero hardcoded hex colors outside `globals.css`. Configured `Sora`, `Manrope`, and `JetBrains Mono` with `next/font/google`. Copied SVG brand assets to `public/brand/` and `src/app/icon.svg`.
- **Supabase SSR Clients & Middleware (T-202, T-203):** Configured `@supabase/ssr` browser client, server client (with Next.js cookie store), and admin service-role client (isolated with `server-only`). Implemented `src/middleware.ts` for automatic session refresh, unauthenticated redirection (`/login?redirect=...`), and redirecting authenticated users away from auth pages.
- **Auth Forms & Server Actions (T-204):** Created Zod validation schemas (`auth-schema.ts`) and Server Actions (`auth-actions.ts`). Built `LoginForm` and `SignupForm` matching design specifications with Sonner feedback, loading spinners, and disabled states. Set up root page redirect (`src/app/page.tsx`).
- **Student & Admin Shells (T-205, T-207):**
  - Student layout (`(student)/layout.tsx`) featuring desktop top navigation with animated active pill (`layoutId="nav-pill"`), user profile pill, and mobile bottom navigation with floating center lime FAB (`+` Offer Ride).
  - Admin layout (`admin/layout.tsx` + `admin-sidebar.tsx`) with server-side role check redirecting non-admin students to `/rides/search?error=access_denied`, navigation links for all 8 admin sections, and quick switch to student portal.
  - Page header component (`page-header.tsx`) and skeleton loaders (`card-skeleton.tsx`, `loading.tsx`).
  - Placeholder pages for all routes defined in `STRUCTURE.md`.
- **Toasts, Loading & Motion (T-206, T-206a, T-206b):** Configured dark Sonner toast styling, motion presets (`motion-presets.ts`), reduced motion hook (`use-reduced-motion-safe.ts`), root `MotionProvider`, Skiper UI `AppPreloader`, and `AnimatedText`. Verified official Skiper UI registry URL.

---

## 2. Design Tokens Table (T-201)

| Token Name | CSS Variable / Tailwind | Value | Source Screen / Usage |
|---|---|---|---|
| Background / Ink | `--background` / `--brand-ink` | `#0A0A0A` | Global background, dark canvas |
| Surface 1 / Card | `--card` / `--n-900` | `#111111` | Card containers, form cards, dialogs |
| Surface 2 | `--surface-2` / `--n-850` | `#161616` | Secondary panels, elevated surfaces |
| Surface 3 | `--surface-3` / `--n-800` | `#1C1C1C` | Input backgrounds, active state pills |
| Primary Lime | `--primary` / `--brand-lime` | `#B6D912` | Primary CTA, logo bolt, active badges |
| Primary Hover | `--brand-lime-hover` | `#C8EB2A` | Primary CTA hover state |
| Primary Press | `--brand-lime-press` | `#9DBB0E` | Button tap/press active state |
| Paper Text | `--foreground` / `--brand-paper` | `#F5F5F0` | Primary headings and text |
| Muted Text | `--muted-foreground` / `--n-400` | `#737373` | Subtitles, labels, field placeholders |
| Border | `--border` / `--n-700` | `#262626` | Card borders, inputs, dividers |
| Status Pending | `--status-pending` | `#F5B300` | Amber badge for pending ride requests |
| Status Accepted | `--status-accepted` | `#B6D912` | Lime badge for accepted rides/drivers |
| Status Rejected | `--status-rejected` | `#F04438` | Red badge for rejected requests |
| Status Info | `--status-info` | `#5AB0FF` | Blue badge for informative notes |
| Font Display | `--font-display` | Sora, sans-serif | Hero titles, bold headlines, numbers |
| Font Sans | `--font-sans` | Manrope, sans-serif | Body typography, forms, inputs |
| Font Mono | `--font-mono` | JetBrains Mono, monospace | Vehicle plates, fares, timestamps |
| Radius (sm) | `--radius-sm` | `6px` | Compact status badges, chips |
| Radius (md) | `--radius` | `10px` | Form inputs, secondary buttons |
| Radius (lg) | `--radius-lg` | `16px` | Cards, desktop navbar active pills |
| Radius (xl) | `--radius-xl` | `24px` | Bottom sheet modals, mobile FAB button |

---

## 3. Component Inventory (shadcn / Skiper / Custom)

| Component | Library | Path / File | Reason & Usage |
|---|---|---|---|
| `Button` | shadcn/ui | `src/components/ui/button.tsx` | Standard accessible button with CVA variants |
| `Card` | shadcn/ui | `src/components/ui/card.tsx` | Card, CardHeader, CardContent wrappers |
| `Input` | shadcn/ui | `src/components/ui/input.tsx` | Form text and password inputs |
| `Label` | shadcn/ui | `src/components/ui/label.tsx` | Form field labels |
| `Badge` | shadcn/ui | `src/components/ui/badge.tsx` | Status and role tags |
| `Skeleton` | shadcn/ui | `src/components/ui/skeleton.tsx` | Base loading shimmer |
| `Dialog` | shadcn/ui | `src/components/ui/dialog.tsx` | Modal dialogs for upcoming ride bookings |
| `Table` | shadcn/ui | `src/components/ui/table.tsx` | Data display tables |
| `Tabs` | shadcn/ui | `src/components/ui/tabs.tsx` | Accessible tab switcher |
| `Sonner` | shadcn/ui | `src/app/layout.tsx` (Toaster) | Toast notifications styled with dark design tokens |
| `AppPreloader` | Skiper UI | `src/components/skiper/app-preloader.tsx` | First-session animated entrance with brand mark and glowing indicator |
| `AnimatedText` | Skiper UI | `src/components/skiper/animated-text.tsx` | Dynamic character/word stagger text reveal |
| `AppNavbar` | Custom | `src/components/layout/app-navbar.tsx` | Responsive student navigation: desktop top nav with animated pill + mobile bottom bar with floating center FAB |
| `AdminSidebar` | Custom | `src/components/layout/admin-sidebar.tsx` | Fixed admin navigation with role badge, 8 modules, and portal switcher |
| `PageHeader` | Custom | `src/components/layout/page-header.tsx` | Standard title, description, and action button bar |
| `CardSkeleton` | Custom | `src/components/layout/card-skeleton.tsx` | Reusable skeleton card grid for route loading |
| `AccessDeniedToast`| Custom | `src/components/auth/access-denied-toast.tsx` | Client listener for URL query error flags |

---

## 4. Animations Added

| Animation | Implementation | Duration / Easing | Reduced Motion Safe? |
|---|---|---|---|
| Page Preloader | `motion.div` in `AppPreloader` | 1000ms spring + exit fade | ✅ Disabled if `prefers-reduced-motion` |
| Desktop Nav Pill | `motion.div layoutId="nav-pill"` | 200ms easeInOut | ✅ Rendered static without movement |
| Mobile FAB Hover/Tap | `whileHover`, `whileTap` on button | 150ms spring | ✅ MotionConfig handles reduced motion |
| Auth Card Entrance | `motion.div` card enter | 250ms easeOut | ✅ Fade only without transform |
| Toast Notifications | Sonner spring physics | 300ms default | ✅ Reduced motion respected |

---

## 5. Build Checks

| Check | Command | Result |
|---|---|---|
| TypeScript Type Check | `npx tsc --noEmit` | ✅ 0 errors |
| ESLint Check | `npm run lint` | ✅ 0 errors, 0 warnings |
| Next.js Production Build | `npm run build` | ✅ Compiled all 22 static and dynamic routes cleanly |

---

## 6. Tests Executed & Results

| # | Test | Expected | Actual | Pass |
|---|---|---|---|---|
| 1 | `start.bat` / `start.sh` starts site | Background process listens on port 3000 | `[OK] Site running: http://localhost:3000` | ✅ |
| 2 | `stop.bat` / `stop.sh` stops site | Process killed and port freed | `[OK] Everything stopped` | ✅ |
| 3 | Signup with new user | Row inserted into `profiles` with role `student` | Profile created with role `'student'` | ✅ |
| 4 | Login with wrong password | Generic error message | Error toast "Invalid email or password" | ✅ |
| 5 | Login with valid credentials | User authenticated, redirected | Authenticated as `rahul@test.com`, redirected | ✅ |
| 6 | Logged out open `/rides/mine` | Redirect to `/login` | HTTP 307 redirect to `/login?redirect=%2Frides%2Fmine` | ✅ |
| 7 | Student (`rahul@test.com`) opens `/admin` | Server-side role guard blocks access | Redirected to `/rides/search?error=access_denied` with toast | ✅ |
| 8 | Admin (`admin@test.com`) opens `/admin` | Admin dashboard loads | HTTP 200, Admin Dashboard and sidebar loaded | ✅ |
| 9 | Script tag in name field | Sanitized and stored safely as text | Stored as text `<script>alert('xss')</script>`, no execution | ✅ |
| 10 | Reduced motion active | Window media match disables movement | `window.matchMedia('(prefers-reduced-motion: reduce)').matches === true` | ✅ |
| 11 | Hardcoded hex colors in `src/` | 0 hex colors outside `globals.css` | 0 hardcoded colors in `src/` outside `globals.css` | ✅ |

---

## 7. Design Deviations

- **Preloader Session State:** Used `sessionStorage` key `oblo_preloader_seen` so the preloader animation only plays on initial visit per session to prevent blocking frequent navigation.
- **Admin Layout Access Denied:** Server-side redirect in `src/app/admin/layout.tsx` routes non-admin students to `/rides/search?error=access_denied`, which triggers `AccessDeniedToast` with an accessible Sonner toast on the search page.
- **Icon Assets:** Copied SVG brand mark from `design/brand/oblo-mark.svg` to `public/brand/icon.svg` and `src/app/icon.svg` to support favicon requests without 404s.

---

## 8. Screenshots Captured

All screenshots saved in `reports/screenshots/phase-2/`:
1. `reports/screenshots/phase-2/login.png`: Split-screen dark login page with Oblo branding, route visual card, and input form.
2. `reports/screenshots/phase-2/signup.png`: Split-screen signup form with full name, college email, password, and phone.
3. `reports/screenshots/phase-2/student-nav-desktop.png`: Desktop student portal (`/rides/search`) with top navbar, active Search pill, and user profile pill.
4. `reports/screenshots/phase-2/student-nav-mobile.png`: Mobile student view (375x667) with bottom navigation bar and center floating lime FAB (`+`).
5. `reports/screenshots/phase-2/admin-sidebar.png`: Admin portal (`/admin`) with dark sidebar, active module indicator, and dashboard metrics.

---

## 9. Next Phase
- **Phase 3:** Vehicles & Driver Verification (T-301…T-307)
