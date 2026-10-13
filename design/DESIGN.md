# DESIGN.md — Oblo Rides · Booking Portal (Dark)

> Single UI source for the booking portal (`/rides/*`, `/requests/*`, `/vehicles`, `/verification`, `/help`, `/admin/*`).
> Agents: read this **before** any UI work. Tokens live in `src/app/globals.css` — never hardcode colours/fonts.
> Scope: **booking portal only.** Marketing home page is out of scope here; this file only borrows its theme (black + lime, logo, tone).

---

## 1. Brand

| | |
|---|---|
| Name | **Oblo Rides** (product of Team Jugaad Junction) |
| Promise | Same route, same college, split by km. |
| Personality | Fast, student, trustworthy, a bit cheeky (Hinglish copy). Not corporate, not neon-gamer. |
| Visual idea | **Black road + lime signal.** Everything is calm black/grey; lime appears only where the user should look or act — exactly like the pin and bolt in the logo. |

### 1.1 Logo files (`public/brand/`)
| File | Use |
|---|---|
| `oblo-logo-dark.svg` | **Default.** Off-white wordmark + lime pin/bolt, transparent bg. Navbar, auth screens, preloader. |
| `oblo-logo-light.svg` | Light surfaces only (PDF receipt, print). Black wordmark. |
| `oblo-mark.svg` | "O" with lime pin. Favicon, app icon, collapsed sidebar, empty states, map pins. |

Rules: min height 24 px (wordmark), 20 px (mark). Clear space = height of the "O" ÷ 4. Never recolour the lime, never put the logo on lime, never add shadow/gradient/outline.

---

## 2. Colour

Dark is the **only** theme. Lime ≤ 10 % of any screen.

| Token (Tailwind) | Hex | Use |
|---|---|---|
| `bg-background` | `#0A0A0A` | Page |
| `bg-surface-1` / `bg-card` | `#111111` | Cards, sidebar, table body |
| `bg-surface-2` / `bg-popover` | `#161616` | Dialogs, dropdowns, sheets |
| `bg-surface-3` / `bg-muted` | `#1C1C1C` | Inputs, hover rows, skeletons |
| `border-border` | `#262626` | All 1 px borders |
| `text-foreground` | `#F5F5F0` | Primary text |
| `text-muted-foreground` | `#A3A3A0` | Labels, meta, helper |
| `#737373` (`n-400`) | | Disabled text, placeholders |
| `bg-primary` / `bg-lime` | **`#B6D912`** | Primary CTA, active nav, selected state, focus ring, "Best match", seats available |
| `bg-lime-hover` | `#C8EB2A` | CTA hover |
| `bg-lime-press` | `#9DBB0E` | CTA active |
| `text-primary-foreground` | `#0A0A0A` | Text **on** lime (always black) |
| `bg-accent` | lime 14 % on black | Selected chip/row tint, active sidebar item bg |

### 2.1 Status colours (request lifecycle — used everywhere identically)
| Status | Token | Chip style |
|---|---|---|
| 🟡 Pending | `pending` `#F5B300` | `bg-pending/12 text-pending border-pending/30` + pulsing dot |
| 🟢 Accepted | `accepted` `#B6D912` | `bg-lime/12 text-lime border-lime/30` + check icon |
| 🔴 Rejected | `rejected` `#F04438` | `bg-rejected/12 text-rejected border-rejected/30` |
| ⚫ Cancelled | `cancelled` `#737373` | `bg-surface-3 text-muted-foreground` + strike icon |
| Full (ride) | — | `bg-surface-3 text-paper border-border` + lock icon, text "Full · 2/2 booked" |
| Info / verified | `info` `#5AB0FF` | Only for "ℹ" notes. Verified badge uses **lime**, not blue. |

Contrast checked: lime on `#0A0A0A` ≈ 12:1, black on lime ≈ 12:1, muted text on card ≥ 7:1. Never put lime text on white.

---

## 3. Typography (Google Fonts via `next/font`)

| Role | Font | Weights | Why |
|---|---|---|---|
| Display / headings | **Sora** | 600, 700 | Geometric, round — matches the chunky "OBLO" letterforms |
| Body / UI | **Manrope** | 400, 500, 600, 700 | Clean, compact, great at small sizes on dark |
| Numbers that matter (fare, plate, time, km, seats) | **JetBrains Mono** | 500 | Plates & ₹ read like tickets; add `.tabular` |

| Style | Size / line | Font | Use |
|---|---|---|---|
| `display` | 40/44 (mobile 30/34) | Sora 700, -0.02em | Search hero "Kahan jaana hai?" |
| `h1` | 28/34 | Sora 700 | Page titles |
| `h2` | 20/28 | Sora 600 | Section, card group titles |
| `h3` | 16/24 | Sora 600 | Card titles (owner name, route) |
| `body` | 15/22 | Manrope 500 | Default |
| `small` | 13/18 | Manrope 500 | Meta, helper |
| `label` | 12/16, uppercase, +0.06em | Manrope 700 | Field labels, table headers |
| `num-lg` | 24/28 | JetBrains Mono 500 | Fare on card ₹17 |
| `num` | 14/20 | JetBrains Mono 500 | Time 08:30, plate RJ14AB1234, 12 km |

```tsx
// src/app/layout.tsx (font part)
import { Sora, Manrope, JetBrains_Mono } from "next/font/google";
const sora = Sora({ subsets: ["latin"], weight: ["600","700"], variable: "--font-sora", display: "swap" });
const manrope = Manrope({ subsets: ["latin"], weight: ["400","500","600","700"], variable: "--font-manrope", display: "swap" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], weight: ["500"], variable: "--font-jetbrains", display: "swap" });
// <html lang="en" className={`dark ${sora.variable} ${manrope.variable} ${jetbrains.variable}`}>
```

---

## 4. Space, radius, elevation, icons

- **Spacing** 4 px grid: 4 · 8 · 12 · 16 · 20 · 24 · 32 · 48 · 64. Card padding 16 (mobile) / 20 (desktop). Gap between cards 12.
- **Radius**: chips/badges `rounded-pill` · inputs/buttons `rounded-md` (10) · cards `rounded-lg` (14) · dialogs/sheets/hero panel `rounded-xl` (20).
- **Elevation**: no grey drop shadows. Cards = `border border-border bg-card`. Popovers use `shadow-pop`. The *one* selected/best card gets `glow-lime` (1 px lime ring + soft glow).
- **Icons**: `lucide-react`, stroke 1.75, 18 px in UI / 16 px in chips. Vehicle icons: `Car`, `Bike` (lucide). Brand pin = `oblo-mark.svg`.
- **Breakpoints**: mobile first; `md` 768 (sidebar appears), `lg` 1024 (map panel appears), max content width 1200.

---

## 5. App shell (Booking CRM — "main home entry")

### Desktop (≥ md)
```
┌──────────┬───────────────────────────────────────────────────┐
│  LOGO    │  Topbar: page title · search (⌘K) · verify badge · avatar ▾ │
│──────────│───────────────────────────────────────────────────│
│ ◉ Search │                                                   │
│ ＋ Offer │              page content                          │
│ ⇄ My Rides (badge: pending count, lime)                      │
│ ✉ My Requests                                                │
│ 🚗 Vehicles                                                   │
│ ✔ Verification (amber dot if pending)                        │
│ ? Help                                                       │
│──────────│                                                   │
│ Admin ▸ (only admin)                                         │
│ user card + logout                                           │
└──────────┴───────────────────────────────────────────────────┘
```
- shadcn **`sidebar`** (collapsible to icon rail with `oblo-mark.svg`). Width 248 / 64 collapsed.
- Active item: `bg-accent text-lime` + 3 px lime left bar. Others `text-sidebar-foreground hover:bg-surface-3`.

### Mobile (< md)
- Top: logo-mark + page title + avatar.
- **Bottom nav** (5): Search · My Rides · **Offer (center lime FAB, 56 px)** · Requests · More (sheet: Vehicles, Verification, Help, Admin, Logout).
- Respect safe-area inset; bottom nav `bg-surface-1/90 backdrop-blur border-t`.

---

## 6. Screens (booking portal)

### 6.1 Search — home `/rides/search`
Layout desktop `lg`: **left 5/12 = search panel + results list, right 7/12 = sticky route map** (§7). Mobile: map collapses into a 160 px strip above results, tap → full-screen sheet.

**Search panel** (`bg-card rounded-xl bg-road-grid` header area):
- Display line: "Kahan jaana hai?" with `text-highlight` on "jaana".
- Fields (shadcn `combobox` = Popover + Command): **From college/stop** → swap button (⇅ icon, rotates 180°) → **To college/stop**; **Date** (Popover + Calendar, disables past); **Preferred time** (Select, 15-min slots); **Vehicle** (ToggleGroup: Any · 🚗 Car · 🏍️ Bike).
- CTA: `Search rides` full-width lime, 48 px.
- Filters live in URL params; quick chips under panel: "Today", "Tomorrow", "Morning", "Hide full" (Switch).

**Results**: grouped with small `label` headings **BEST MATCH · GOOD MATCH · OTHER RIDES**; Full rides last under "FULL".

### 6.2 Ride card (`ride-card.tsx`) — the most important component
```
┌───────────────────────────────────────────────────────┐
│ [Best match]                         ₹17  est.        │
│ (avatar) Rahul S.  ✔ Verified        num-lg mono      │
│ 🚗 Maruti Swift · White                               │
│                                                       │
│ 08:30 ●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━● 08:55?        │
│  Sector 62      Indirapuram   Vaishali   College      │
│         ◆ you board here ─────── ◆ you drop here      │
│                                                       │
│ [▮▮▯ 1/2 seats left]                 [ Request seat ] │
└───────────────────────────────────────────────────────┘
```
- Match label pill: Best = solid lime/black; Good = `bg-accent text-lime`; Other = `bg-surface-3 text-muted`.
- **Seats meter**: one 10×14 rounded block per seat, filled = lime, booked = `n-600`. Text `1/2 left`. Bike shows a single block.
- Route line: mini version of §7 (horizontal), rider's pickup→drop segment drawn lime, rest `n-600`.
- **No plate on this card** (privacy rule V9).
- Button states (never hide, always explain):
  | State | Button |
  |---|---|
  | available | `Request seat` lime |
  | own ride | ghost chip "Yeh aapki ride hai" |
  | already requested | status chip (Pending/Accepted…) + "View" link |
  | full | disabled `Full` with lock icon, card at 60 % opacity |
  | past | disabled "Ride nikal chuki" |
- Hover (desktop): border → `n-600`, map highlights this ride's route. Selected: `glow-lime`.
- Enter animation: fade+8 px rise, 40 ms stagger, max 8 cards (motion), off with reduced-motion.

### 6.3 Request seat — `request-seat-dialog.tsx`
- shadcn **Dialog** desktop / **Drawer** (vaul) mobile, `rounded-xl bg-popover`.
- Top: vehicle row + owner + verified badge. Pickup & Drop selects (pre-filled, only stops inside ride range, drop after pickup).
- Live **Fare breakdown card** (§6.6) under the selects; "Estimated — final after more riders join, it only goes down."
- Seats: stepper 1–N (doc says booking for friends is allowed) — **if DB still supports 1 seat per request, hide stepper** and log in FUTURE_SCOPE.
- Footer: `Cancel` ghost · `Send request` lime (spinner + disabled while pending).
- Success: dialog morphs into check state (lime ring draw, 600 ms) → toast "Request bhej di. Owner accept karega."

### 6.4 Rider view after booking — `/requests/mine`
- Tabs (shadcn **Tabs**, underline style lime): **Active** · Past.
- Each row = card: route mini-line, date/time (mono), vehicle, status chip, fare.
- **Status tracker** (horizontal stepper): `Requested → Pending → Accepted` (or ✕ Rejected). Current step lime dot with ping; done steps lime line; future `n-600`.
- **Accepted** → expands `ride-contact-card.tsx`:
  - Number plate rendered as an Indian plate: `bg-paper text-ink font-mono rounded-sm border-2 border-ink px-2` → `RJ14 AB 1234`.
  - Owner phone with `Call` and `WhatsApp` buttons (outline).
  - "Pay ₹17 to owner after ride" note.
- Pending → `Cancel request` (AlertDialog confirm). Rejected → reason text + `Find another ride` lime link (prefills search).

### 6.5 Driver / owner view — `/rides/mine` (rider view "after sending or accepting")
- Ride card header: route, date, time, vehicle + plate (owner sees own plate), status `Open` / `Full · 2/2 booked` / `Cancelled`.
- Big seats meter + "Total collection ₹96 · Your share ₹37" (mono).
- **Requests list** (`request-row-owner.tsx`): avatar, name, pickup→drop, est. fare, status chip, actions `Accept` (lime, small) / `Reject` (outline destructive). Accept disabled + tooltip "Seats khatam" at 0.
- When ride becomes Full: inline banner `bg-accent` "Ride full — baaki pending auto-reject ho gayi".
- Optimistic: row status flips instantly, buttons replaced by spinner; rollback + toast on error.
- Owner actions menu (DropdownMenu ⋯): Cancel ride (AlertDialog, destructive).

### 6.6 Fare breakdown card — `fare-breakdown-card.tsx`
```
Your fare                          ₹17
─────────────────────────────────────────
62 → Indirapuram   4 km × ₹8 = ₹32 ÷ 3   ₹10.67
Indirapuram → Vaishali  3 km × ₹8 = ₹24 ÷ 4   ₹6.00
─────────────────────────────────────────
Rounded                              ₹17
```
- `bg-surface-2 rounded-lg`, rows mono, divisor shown as small people-icons (driver icon outlined, riders filled lime).
- Under it: tiny bar showing segments proportional to km, rider's segments lime.

### 6.7 Offer ride `/rides/new` · Vehicles `/vehicles` · Verification `/verification`
- Forms: single column max-w 560, shadcn **Form** (react-hook-form + Zod), labels `label` style, helper text muted, error text `text-rejected` with icon. **No animations on forms.**
- Offer ride: vehicle as **RadioGroup cards** (icon, model, colour, plate). Bike → seats locked "1" with lock icon + helper "Bike pe sirf 1 seat". Car → ToggleGroup 1/2/3. Right column (lg) = live route map + "12 km · ₹96 · Driver + 2".
- Not verified → full-width `verification-status-banner.tsx` instead of form:
  | Status | Banner |
  |---|---|
  | not submitted | `bg-surface-2` + shield icon, "Ride dene ke liye pehle verification karein", lime CTA |
  | pending | `border-pending/40 bg-pending/8`, hourglass, "Verification pending — admin approve karega" |
  | rejected | `border-rejected/40 bg-rejected/8`, reason, "Dobara submit karein" |
  | approved | small lime chip "✔ Verified driver" only |
- Verification uploads: dashed dropzone `border-2 border-dashed border-n-600 rounded-lg`, drag-over → lime border + `bg-accent`. Shows file name, size, thumbnail (image) or PDF icon, remove ✕. Error "Sirf JPG, PNG ya PDF, max 2 MB".
- Vehicles: grid of `vehicle-card.tsx` (icon in 40 px lime-tinted circle, model, colour swatch dot, plate in plate style, "Car · up to 3 seats"). Add = Sheet from right.

### 6.8 FAQ & Help + chatbot `/help`
- Top: "Kuch help chahiye?" + search input filtering FAQs.
- "How it works" — 6 numbered steps (from doc content), horizontal on desktop, vertical timeline on mobile; number in lime circle, black text:
  1. Sign up / log in · 2. Search a ride · 3. Pick the best match · 4. Request a seat · 5. Split the fare · 6. Get going
- FAQ: shadcn **Accordion**, each item `border-b border-border`, open → question turns lime, chevron rotates.
- **Chatbot**: floating button bottom-right (mobile: above bottom nav) — 52 px lime circle with `oblo-mark` style chat icon. Opens shadcn **Sheet** (right, 400 px; mobile full-height). Bubbles: bot `bg-surface-3 rounded-lg rounded-tl-sm`, user `bg-lime text-ink rounded-lg rounded-tr-sm`. Quick-reply chips under first message ("Fare kaise calculate hota?", "Ride cancel kaise karein?", "Verification kitna time?"). Typing dots in lime. 🟡 priority — can be FAQ-matching only (no AI) for hackathon.

### 6.9 Admin (reuse same shell; plain, fast)
- shadcn **data-table** (TanStack) — no animation, dense rows 44 px, sticky header `bg-surface-1`, zebra off, hover `bg-surface-3`.
- Stats: 6 **Card**s, number `num-lg`, small trend label; one lime card for "Pending verifications".
- Verification review: two-column — doc previews (signed URL, 60 s countdown pill) | details + Approve (lime) / Reject (destructive, opens reason Textarea).
- Charts (if any): shadcn **chart** (Recharts) using `--chart-*`.

### 6.10 Auth `/login` `/signup`
- Split screen desktop: left 50 % = black panel with big `oblo-logo-dark.svg`, `bg-road-grid`, animated lime dashed route line drawing between 3 pins (Skiper text/line reveal); right = form card max-w 400. Mobile: logo on top, form below.
- Generic errors only ("Invalid email or password").

---

## 7. Map — what type

**Rule 35 says no real maps / GPS.** So the "map" is a **schematic route map** (metro-line style), drawn in **SVG from DB data** (`stops.stop_order`, `km_from_start`). Zero API keys, zero cost, instant load, works offline, looks premium on black.

`route-timeline.tsx` (two variants: `compact` for cards, `full` for map panel)

```
  Sector 62 ◉━━━━━━━━━━━━◯━━━━━━━━━◯━━━━━━━━━━━━━━━━◉ College
            0 km        4 km      7 km              12 km
            ▲ pickup ═══════════════▲ drop    (lime segment = your stretch)
            🚗 Rahul · 08:30        👥 3 on board on this segment
```

Spec:
- Base line 4 px `n-600`, rounded caps. Segment lengths **proportional to km**.
- Stops: 10 px circles `bg-background` + 2 px `n-500` ring; start/end = `oblo-mark` pin (16 px).
- Rider's stretch: line becomes lime 6 px with soft lime glow; pickup/drop = lime pins with labels.
- Per-segment occupancy (full variant): tiny people dots above each segment (driver = outline, riders = lime) → explains fare split visually.
- Full variant (map panel): vertical on mobile, horizontal on desktop; background `bg-road-grid`; multiple rides on the same route draw as parallel offset lines, hovered card's ride turns lime.
- Animation: stroke-dash draw 600 ms on mount (once), off for reduced-motion.
- Accessibility: SVG `role="img"` + `aria-label="Route: Sector 62 to College, 12 km, your stretch Sector 62 to Vaishali, 7 km"`; stop list also rendered as visually-hidden `<ol>`.
- Future (FUTURE_SCOPE): swap to MapLibre GL + a dark vector style (e.g. Carto Dark Matter) with lime route layer — same colours.

---

## 8. shadcn/ui components to use (and why)

```bash
npx shadcn@latest add button card input label textarea select badge dialog drawer sheet \
  table tabs skeleton sonner form popover command calendar toggle-group radio-group switch \
  accordion avatar tooltip dropdown-menu alert-dialog alert separator scroll-area sidebar \
  progress chart
npm i motion lucide-react
```

| Need | Use | Why better than custom |
|---|---|---|
| Stop/college picker | **Combobox** (Popover + Command) | Searchable list, keyboard nav — dropdown rule satisfied, no free text |
| Date | **Popover + Calendar** | Disable past days built-in |
| Vehicle filter / seats | **ToggleGroup** | Segmented control, accessible |
| Request on mobile | **Drawer** (vaul) | Native bottom-sheet feel |
| Request on desktop | **Dialog** | Focus trap, Esc |
| Confirm cancel/reject | **AlertDialog** | Proper destructive confirm |
| App shell | **Sidebar** | Collapsible, mobile sheet, cookie-persisted state |
| Admin tables | **data-table** (Table + TanStack) | Sort, filter, paginate |
| FAQ | **Accordion** | |
| Toasts | **Sonner** | `toast.success / toast.error(error.message)` |
| Loading | **Skeleton** | `ride-card-skeleton.tsx` mirrors card layout |
| Chatbot panel | **Sheet** | |
| Stats charts | **Chart** | Uses `--chart-*` tokens |

Restyle checklist for every primitive: radius from §4, `bg-card`/`bg-popover`, `border-border`, focus ring lime 2 px, disabled = 40 % opacity + `cursor-not-allowed`.

### 8.1 Button variants
| Variant | Style |
|---|---|
| `default` | `bg-lime text-ink hover:bg-lime-hover active:bg-lime-press font-semibold` h-11, `rounded-md` |
| `secondary` | `bg-surface-3 text-paper hover:bg-n-700` |
| `outline` | `border border-border bg-transparent hover:bg-surface-3` |
| `ghost` | `hover:bg-surface-3 text-muted-foreground hover:text-paper` |
| `destructive` | `bg-rejected/12 text-rejected border border-rejected/30 hover:bg-rejected/20` (solid red only inside AlertDialog) |
| `link` | `text-lime underline-offset-4 hover:underline` |
Sizes: `sm` h-9, `default` h-11, `lg` h-12 (mobile CTAs). Press: scale 0.98.

### 8.2 Inputs
`h-11 bg-surface-3 border-border rounded-md px-3 text-[15px] placeholder:text-n-400 focus:border-lime focus:ring-2 focus:ring-lime/30`. Error: `border-rejected`.

---

## 9. Skiper UI / motion (where allowed)
Allowed: preloader (logo mark pin drops + bolt flash, ≤ 1.2 s, first visit), auth hero line-draw, navbar active indicator (lime pill slides — `layoutId`), ride-card list enter, status chip change (crossfade), accept success check.
**Not** on: forms, admin tables, dialogs content. All via `next/dynamic`; reduced-motion → none. Footer attribution "UI components: Skiper UI". No third-party brand assets.

Durations: micro 120 ms, UI 200 ms, panels 320 ms, ease `--ease-out-soft`.

---

## 10. States & copy

- **Empty**: centred `oblo-mark` at 30 % opacity (64 px), title + one line + CTA.
  - Search: "Koi ride nahi mili" / "Time thoda aage-peeche karke dekho" / `Offer a ride`.
  - My Requests: "Abhi tak koi request nahi" / `Search rides`.
  - My Rides: "Aapne koi ride nahi di" / `Offer a ride`.
- **Loading**: skeletons only (no spinners for pages). Buttons show inline spinner.
- **Errors**: Sonner toast, red left bar, exact Hinglish text from `src/lib/constants/app-messages.ts` (USER_FLOW §12).
- Currency always `₹` + no decimals on totals (`format-currency-inr.ts`); breakdown can show 2 decimals.
- Time `08:30` 24h mono; dates "Tue, 14 Oct".

---

## 11. Accessibility
- Hit targets ≥ 44 px. Focus visible lime ring on every interactive element.
- Status never by colour alone — always icon + text.
- Disabled buttons keep a reason (tooltip or adjacent text).
- `lang="en"`, Hinglish strings fine; icons `aria-hidden`, icon-only buttons have `aria-label`.

## 12. Do / Don't
✅ Black canvas, lime only for action/selection/your-stretch · mono for numbers · one glowing card max · Hinglish micro-copy
❌ Lime backgrounds for big areas · gradients/neon purple · white cards · real map tiles · showing plate before Accepted · default shadcn zinc look

## 13. Files from this design pack
| File | Where |
|---|---|
| `DESIGN.md` | `design/DESIGN.md` |
| `globals.css` | `src/app/globals.css` (replace) |
| `oblo-logo-dark.svg`, `oblo-logo-light.svg`, `oblo-mark.svg` | `public/brand/` |
| Favicon | export `oblo-mark.svg` → `src/app/icon.svg` (Next auto-favicon) |

## 14. Open items
- Doc screenshots (Home page, Booking CRM main entry, user view after booking, rider view, FAQ, Help/chatbot) could not be read by the agent. **Compare each screen above against those screenshots and note deviations in the phase report** (RULES §C4).
- Multi-seat booking for friends (doc step 4) is not in PRD v1 (one request per user per ride) → logged as FUTURE_SCOPE unless PRD is updated.
