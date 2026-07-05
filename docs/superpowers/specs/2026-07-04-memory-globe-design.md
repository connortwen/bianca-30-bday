# Memory Globe — Design Spec

**Date:** 2026-07-04
**Project:** bianca-30-bday
**Status:** Draft for review

## Overview

An interactive 3D globe section on the homepage of Bianca's 30th-birthday site.
Visitors can spin the globe 360° with mouse or touch, and click pins at
meaningful locations to open an Instagram-post-style memory card (photo +
caption + location + date).

The visual direction is **Studio Ghibli — specifically *Howl's Moving
Castle***: soft, dreamy, hand-painted, warm. The globe should feel like a
storybook world, not a data visualization.

## Goals

- 360° drag/swipe rotation, pinch/scroll zoom, on desktop and mobile
- Clickable pins that open a memory card with photo and description
- Ghibli-inspired art direction throughout the section
- Easy to add memories: edit one data file, drop a photo in `/public`
- No backend, no CMS — fully static, Vercel-friendly

## Non-Goals (v1)

- No CMS or admin UI for memories
- No arcs/travel-route animations between pins (nice-to-have later)
- No sound
- The rest of the site's theme — this spec covers the globe section only,
  though its palette may later seed the whole site

## Tech Approach

**Library: `react-globe.gl`** (wraps globe.gl / three.js).

Chosen over alternatives:
- **COBE** — beautiful but markers are non-interactive dots; can't do photo
  pins or click targets.
- **React Three Fiber from scratch** — full control but rebuilds what
  react-globe.gl ships for free (drag controls, HTML marker layer, camera
  fly-to).

Key integration notes:
- Client-only: imported via `next/dynamic({ ssr: false })`. The canvas needs
  `window`; the rest of the page stays statically rendered.
- three.js is a peer dependency (~150–200 KB gz total). Lazy-loaded so it
  doesn't block the initial page.
- Pins use the **HTML elements layer** (`htmlElementsData` / `htmlElement`) —
  arbitrary DOM per pin, styleable with Tailwind, clickable.
- `globeMaterial`, `atmosphereColor`, and `globeImageUrl` provide the theming
  levers; `globeRef` exposes raw three.js as an escape hatch.

## Architecture

```
src/components/globe/
  GlobeSection.tsx    Server-safe wrapper. Owns section layout, heading,
                      loading placeholder. Dynamic-imports MemoryGlobe.
  MemoryGlobe.tsx     Client component. react-globe.gl config: texture,
                      atmosphere, auto-rotate, pins, click handling,
                      camera fly-to. Holds "selected memory" state.
  MemoryPin.tsx       The pin markup rendered per location (see Pin Design).
  MemoryCard.tsx      The memory card overlay (see Card Design).
src/data/memories.ts  Typed pin data.
public/memories/      Photos (web-optimized JPEG/WebP).
public/globe/         Globe texture asset(s).
```

### Data model

```ts
type Memory = {
  id: string;
  lat: number;
  lng: number;
  location: string;   // "Kyoto, Japan"
  title: string;      // "Where we got matcha every morning"
  caption: string;    // longer description, IG-caption style
  date: string;       // "April 2023" — display string, not Date
  photo: string;      // "/memories/kyoto.webp"
};
```

Static import at build time. Adding a memory = one object + one photo file.

## Art Direction — "Howl's Sky"

Reference: *Howl's Moving Castle* — watercolor skies, puffy cumulus clouds,
alpine meadows, golden-hour warmth, hand-painted softness. Light spring
palette; earthy naturals with subtle pastels.

### Palette

| Token | Color | Use |
|---|---|---|
| `sky` | `#BFDDE8` soft powder blue | section background top |
| `horizon` | `#F6E7D3` warm cream | section background bottom (sky gradient) |
| `sea` | `#7FB6C4` muted teal | globe oceans |
| `land` | `#EFE3C8` parchment cream | globe continents |
| `meadow` | `#A8C69F` soft green | continent accents / hover states |
| `blush` | `#E8A5A0` dusty rose | pins, accents, atmosphere glow |
| `gold` | `#E9C46A` golden-hour | highlights, selected pin |
| `ink` | `#4A4238` warm charcoal | text (never pure black) |

### Globe surface

- **v1:** custom watercolor-style equirectangular texture — parchment-cream
  continents on muted-teal sea, soft edges, subtle paper grain. Generated or
  hand-adapted, committed to `/public/globe/`. (Interim during build: any
  stock texture, swapped before done.)
- Atmosphere: `atmosphereColor` in blush/pale gold — a warm halo like
  golden-hour light, not the default sci-fi blue.
- Background: CSS sky gradient (`sky` → `horizon`) behind a transparent-canvas
  globe, with 2–3 soft drifting cloud shapes (CSS/SVG, slow parallax drift —
  the Howl's cumulus motif). Clouds are decorative DOM, not in-canvas.

### Pin design

Cutesy, storybook: a small round bobbing marker — blush-colored with a tiny
heart or star glyph, gentle idle bob animation (CSS), slight scale-up +
golden ring on hover. Selected pin glows `gold`.

Pin markup lives in one component (`MemoryPin`), so upgrading to photo-bubble
pins later is a one-file change.

### Memory card

Polaroid/scrapbook style:
- Soft-white card, generous rounded corners, faint paper texture, slight
  random rotation (±2°) for a hand-placed feel
- Photo on top; below: `title` in a rounded/handwritten display font,
  `caption` in the body font, `location` + `date` in small caps with a tiny
  pin glyph
- Gentle pop-in animation (scale + fade, soft spring easing)
- Mobile: centered modal over a dimmed sky; Desktop: anchored panel beside
  the globe
- Dismiss: ✕ button, click-away, Esc

### Typography

- Display/handwritten accent: a rounded handwritten Google font (e.g.
  *Patrick Hand* or *Gaegu*) for card titles and the section heading
- Body: keep the site's existing Geist for captions/UI (final pairing is an
  implementation-time choice within this direction)

### Motion principles

Everything floats, nothing snaps: slow idle auto-rotate (pauses on
interaction, resumes after ~5 s idle), eased camera fly-tos (~1 s), bobbing
pins, drifting clouds. Respect `prefers-reduced-motion`: disable auto-rotate,
bob, and drift; keep functional transitions instant or near-instant.

## Interactions

1. Section scrolls into view → globe idles with slow rotation, pins bobbing
2. Drag/swipe rotates freely 360°; pinch/scroll zoom clamped (min: whole
   globe visible; max: ~country level)
3. Click/tap pin → camera glides to center it (`pointOfView`) → card pops in
4. Card dismissed → auto-rotate resumes after idle delay
5. While a card is open, globe interaction stays live (rotating away doesn't
   close the card; opening another pin replaces the card)

## Edge Cases & Performance

- **Loading:** fixed-height placeholder (the sky gradient + a soft "loading
  the world…" note) until the three.js chunk hydrates — zero layout shift
- **WebGL unavailable:** fallback message in the sky-gradient section
- **Photos:** pre-optimized (≤ ~200 KB each, WebP); lazy — only the clicked
  memory's photo loads on demand
- **Texture size:** globe texture ≤ ~1 MB, 2048px wide max
- **Mobile perf:** cap pixel ratio at 2; no post-processing effects in v1

## Testing / Verification

- `npm run build` + lint pass
- Manual: drag, zoom clamps, pin click → fly-to → card, dismiss paths
  (✕ / click-away / Esc), mobile touch via devtools emulation,
  `prefers-reduced-motion` emulation
- Seed data: 3–5 dummy memories at spread-out coordinates with placeholder
  photos so every interaction is exercisable before real content arrives

## Open Questions (deferred, non-blocking)

- Final globe texture art (custom paint vs. adapted stock) — settled during
  implementation; the interface (`globeImageUrl`) doesn't change
- Real memory content (photos, captions, coordinates) — Connor supplies later
- Whether the globe palette becomes the whole site's theme — separate effort
