# design/ — Oblo Rides design pack (agent: read this first)

Everything for the UI is in this one folder.

| File | Agent must copy it to | Notes |
|---|---|---|
| `DESIGN.md` | stays here | The ONLY UI source. Read fully before any UI work. |
| `globals.css` | `src/app/globals.css` (replace) | Final tokens. Do not change values. Re-copy if `shadcn add` overwrites it. |
| `brand/oblo-logo-dark.svg` | `public/brand/` | Default logo (dark bg) |
| `brand/oblo-logo-light.svg` | `public/brand/` | Light bg / print only |
| `brand/oblo-mark.svg` | `public/brand/` | Icon, collapsed sidebar, empty states, map pins |
| `brand/icon.svg` | `src/app/icon.svg` | Favicon — delete `src/app/favicon.ico` |
| `screens/` | stays here | Reference screenshots from the Google Doc (if added). Match layouts; log differences in the phase report. |

Rules: dark theme only (black #0A0A0A + lime #B6D912), no hardcoded hex in components, no real maps (schematic SVG route map — DESIGN.md §7).
