# Memory Globe Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** An interactive Ghibli-styled 3D globe section on the homepage with clickable memory pins that open photo cards.

**Architecture:** `react-globe.gl` (three.js) rendered client-only via `next/dynamic({ ssr: false })` inside a server-importable section wrapper. Pins use the globe's HTML-elements layer (real DOM, clickable). All data is a static TS module; photos and the globe texture live in `/public`. Spec: `docs/superpowers/specs/2026-07-04-memory-globe-design.md`.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS v4, react-globe.gl + three, vitest (data tests only), d3-geo + topojson-client + world-atlas + sharp (one-off texture generation script).

## Global Constraints

- Palette (use these exact hex values): sky `#BFDDE8`, horizon `#F6E7D3`, sea `#7FB6C4`, land `#EFE3C8`, meadow `#A8C69F`, blush `#E8A5A0`, gold `#E9C46A`, ink `#4A4238`, card white `#FFFDF8`. Never pure black text.
- Motion: everything floats, nothing snaps. Every animation must be disabled or near-instant under `prefers-reduced-motion: reduce`.
- Globe texture ≤ ~1 MB, 2048px wide. Pixel ratio capped at 2. No post-processing.
- No backend, no CMS. Content is placeholder-only (Connor supplies real memories later) — make placeholder copy obviously placeholder.
- Testing reality: this is a WebGL feature. Automated tests cover the data module only (vitest). Everything else is verified with `npm run build`, `npm run lint`, and explicit manual browser checks listed per task. Do not add jsdom/RTL component tests.
- All work happens in `/Users/connorwen/code/personal/bianca-30-bday` on `main`.

---

### Task 1: Dependencies, seed data module, data tests

**Files:**
- Modify: `package.json` (via npm install + one script)
- Create: `src/data/memories.ts`
- Create: `src/data/memories.test.ts`
- Create: `public/memories/placeholder-1.svg` … `placeholder-5.svg`

**Interfaces:**
- Consumes: nothing (first task)
- Produces: `type Memory = { id: string; lat: number; lng: number; location: string; title: string; caption: string; date: string; photo: string }` and `export const memories: Memory[]` from `@/data/memories` — every later task imports these exact names.

- [ ] **Step 1: Install runtime and dev dependencies**

```bash
npm install react-globe.gl three
npm install -D @types/three vitest
```

Expected: both succeed. If npm reports a peer-dependency conflict between react-globe.gl and React 19, stop and report it (do not use `--legacy-peer-deps` without flagging it).

- [ ] **Step 2: Add test script**

In `package.json` `"scripts"`, add:

```json
"test": "vitest run"
```

- [ ] **Step 3: Write the failing data test**

Create `src/data/memories.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { memories } from "./memories";

describe("memories data", () => {
  it("has at least 3 seed memories", () => {
    expect(memories.length).toBeGreaterThanOrEqual(3);
  });

  it("has unique ids", () => {
    const ids = memories.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has valid coordinates", () => {
    for (const m of memories) {
      expect(m.lat).toBeGreaterThanOrEqual(-90);
      expect(m.lat).toBeLessThanOrEqual(90);
      expect(m.lng).toBeGreaterThanOrEqual(-180);
      expect(m.lng).toBeLessThanOrEqual(180);
    }
  });

  it("points every photo at an existing file under public/", () => {
    for (const m of memories) {
      expect(m.photo.startsWith("/memories/")).toBe(true);
      expect(existsSync(join(process.cwd(), "public", m.photo))).toBe(true);
    }
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — cannot resolve `./memories`.

- [ ] **Step 5: Create the data module**

Create `src/data/memories.ts`:

```ts
export type Memory = {
  id: string;
  lat: number;
  lng: number;
  location: string; // "Kyoto, Japan"
  title: string;
  caption: string;
  date: string; // display string, e.g. "April 2023"
  photo: string; // "/memories/kyoto.webp"
};

// Placeholder seed data — replace with real memories (photos in /public/memories).
export const memories: Memory[] = [
  {
    id: "tokyo",
    lat: 35.68,
    lng: 139.69,
    location: "Tokyo, Japan",
    title: "Placeholder: Tokyo",
    caption: "Placeholder caption — swap with the real story.",
    date: "Month 20XX",
    photo: "/memories/placeholder-1.svg",
  },
  {
    id: "paris",
    lat: 48.86,
    lng: 2.35,
    location: "Paris, France",
    title: "Placeholder: Paris",
    caption: "Placeholder caption — swap with the real story.",
    date: "Month 20XX",
    photo: "/memories/placeholder-2.svg",
  },
  {
    id: "nyc",
    lat: 40.71,
    lng: -74.01,
    location: "New York, USA",
    title: "Placeholder: New York",
    caption: "Placeholder caption — swap with the real story.",
    date: "Month 20XX",
    photo: "/memories/placeholder-3.svg",
  },
  {
    id: "sydney",
    lat: -33.87,
    lng: 151.21,
    location: "Sydney, Australia",
    title: "Placeholder: Sydney",
    caption: "Placeholder caption — swap with the real story.",
    date: "Month 20XX",
    photo: "/memories/placeholder-4.svg",
  },
  {
    id: "lisbon",
    lat: 38.72,
    lng: -9.14,
    location: "Lisbon, Portugal",
    title: "Placeholder: Lisbon",
    caption: "Placeholder caption — swap with the real story.",
    date: "Month 20XX",
    photo: "/memories/placeholder-5.svg",
  },
];
```

- [ ] **Step 6: Create 5 placeholder photos**

Create `public/memories/placeholder-1.svg` through `placeholder-5.svg`. Same markup, rotating `fill` through `#A8C69F`, `#BFDDE8`, `#E8A5A0`, `#E9C46A`, `#7FB6C4`, and matching number in the text. Template (this is #1):

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <rect width="800" height="600" fill="#A8C69F"/>
  <text x="400" y="300" font-family="sans-serif" font-size="36" fill="#4A4238" text-anchor="middle" dominant-baseline="middle">placeholder photo 1</text>
</svg>
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `npm test`
Expected: 4 tests PASS.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json src/data public/memories
git commit -m "feat: add globe deps, seed memory data with tests"
```

---

### Task 2: Watercolor globe texture

**Files:**
- Create: `scripts/generate-globe-texture.mjs`
- Create (generated): `public/globe/watercolor-earth.png`
- Modify: `package.json` (dev deps)

**Interfaces:**
- Consumes: nothing
- Produces: `/globe/watercolor-earth.png` — the exact URL Task 5 passes to `globeImageUrl`.

- [ ] **Step 1: Install script dependencies**

```bash
npm install -D d3-geo topojson-client world-atlas sharp
```

- [ ] **Step 2: Write the generation script**

Create `scripts/generate-globe-texture.mjs`:

```js
// One-off generator for the Ghibli-style globe texture.
// Run: node scripts/generate-globe-texture.mjs
// Output: public/globe/watercolor-earth.png (2048x1024 equirectangular)
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { geoEquirectangular, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import sharp from "sharp";

const require = createRequire(import.meta.url);
const land110 = require("world-atlas/land-110m.json");

const W = 2048;
const H = 1024;
const SEA = "#7FB6C4";
const LAND = "#EFE3C8";

const land = feature(land110, land110.objects.land);
const projection = geoEquirectangular()
  .translate([W / 2, H / 2])
  .scale(W / (2 * Math.PI));
const path = geoPath(projection);
const landPath = path(land);

// Blurred layer underneath gives soft watercolor bleed; crisper layer on top keeps shapes readable.
// feTurbulence overlay adds faint paper grain.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <filter id="soften" x="-5%" y="-5%" width="110%" height="110%">
      <feGaussianBlur stdDeviation="3.5"/>
    </filter>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0.29  0 0 0 0 0.26  0 0 0 0 0.22  0 0 0 0.05 0"/>
    </filter>
  </defs>
  <rect width="100%" height="100%" fill="${SEA}"/>
  <path d="${landPath}" fill="${LAND}" filter="url(#soften)"/>
  <path d="${landPath}" fill="${LAND}" opacity="0.85"/>
  <rect width="100%" height="100%" filter="url(#grain)"/>
</svg>`;

mkdirSync("public/globe", { recursive: true });
await sharp(Buffer.from(svg)).png().toFile("public/globe/watercolor-earth.png");
console.log("Wrote public/globe/watercolor-earth.png");
```

- [ ] **Step 3: Run it and verify output**

Run: `node scripts/generate-globe-texture.mjs && ls -la public/globe/`
Expected: prints the "Wrote" line; `watercolor-earth.png` exists, roughly 100 KB–1 MB. If over 1 MB, re-run with a quality cap: change the sharp line to `.png({ compressionLevel: 9 })`.

- [ ] **Step 4: Visually sanity-check the texture**

Open the PNG (Read tool or `open public/globe/watercolor-earth.png`). Expected: cream continents with soft edges on a muted-teal sea, faint grain, no artifacts. If the grain or blur filters rendered as blank/black regions (librsvg filter support varies), delete the `<rect ... #grain>` line and/or the blurred layer and re-run — a flat two-tone map is an acceptable fallback.

- [ ] **Step 5: Commit**

```bash
git add scripts public/globe package.json package-lock.json
git commit -m "feat: generate watercolor globe texture"
```

---

### Task 3: Pin element + globe CSS

**Files:**
- Create: `src/components/globe/MemoryPin.tsx`
- Modify: `src/app/globals.css` (append)

**Interfaces:**
- Consumes: `Memory` from `@/data/memories`
- Produces: `createPinElement(memory: Memory, onSelect: (m: Memory) => void): HTMLElement` — Task 5 calls this from the globe's `htmlElement` callback. CSS classes `memory-pin`, `memory-pin--selected` (Task 5 toggles the latter).

**Why DOM, not JSX:** globe.gl's HTML-elements layer expects a real `HTMLElement` per pin (it positions them with three.js CSS2DRenderer, which centers each element at its lat/lng and owns the element's `transform`). So the pin is built imperatively, and all pin animation uses `translate`/`scale`-via-inner-element — never `transform` on the root.

- [ ] **Step 1: Create the pin factory**

Create `src/components/globe/MemoryPin.tsx`:

```tsx
import type { Memory } from "@/data/memories";

// Builds the DOM element globe.gl renders at each memory's lat/lng.
// Must return a plain HTMLElement (CSS2DRenderer owns the root transform).
export function createPinElement(
  memory: Memory,
  onSelect: (memory: Memory) => void,
): HTMLElement {
  const el = document.createElement("button");
  el.type = "button";
  el.className = "memory-pin";
  el.setAttribute("aria-label", `Open memory: ${memory.title}`);

  const dot = document.createElement("span");
  dot.className = "memory-pin__dot";
  dot.textContent = "♥";
  // Stagger the idle bob so pins don't move in lockstep.
  dot.style.animationDelay = `${(memory.id.charCodeAt(0) % 5) * 0.35}s`;
  el.appendChild(dot);

  el.addEventListener("click", (event) => {
    event.stopPropagation(); // don't let the globe's click-away handler fire
    onSelect(memory);
  });

  return el;
}
```

- [ ] **Step 2: Append globe styles to `src/app/globals.css`**

```css
/* --- Memory globe ------------------------------------------------------- */

.memory-pin {
  padding: 4px;
  border: none;
  background: transparent;
  cursor: pointer;
  pointer-events: auto;
}

.memory-pin__dot {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 9999px;
  background: #e8a5a0;
  color: #fffdf8;
  font-size: 12px;
  line-height: 1;
  box-shadow: 0 2px 6px rgba(74, 66, 56, 0.25);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  animation: pin-bob 2.6s ease-in-out infinite;
}

.memory-pin:hover .memory-pin__dot,
.memory-pin:focus-visible .memory-pin__dot {
  transform: scale(1.15);
  box-shadow: 0 0 0 3px #e9c46a, 0 2px 8px rgba(74, 66, 56, 0.3);
}

.memory-pin--selected .memory-pin__dot {
  box-shadow: 0 0 0 3px #e9c46a, 0 0 14px 4px rgba(233, 196, 106, 0.65);
}

@keyframes pin-bob {
  0%, 100% { translate: 0 0; }
  50% { translate: 0 -4px; }
}

.memory-card {
  animation: card-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes card-pop {
  from { opacity: 0; scale: 0.92; }
  to { opacity: 1; scale: 1; }
}

.cloud {
  position: absolute;
  animation: cloud-drift var(--drift-duration, 80s) ease-in-out infinite alternate;
}

@keyframes cloud-drift {
  from { translate: 0 0; }
  to { translate: 60px 8px; }
}

@media (prefers-reduced-motion: reduce) {
  .memory-pin__dot,
  .memory-card,
  .cloud {
    animation: none;
  }
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: PASS (component is unused so far; this catches syntax/type errors).

- [ ] **Step 4: Commit**

```bash
git add src/components/globe/MemoryPin.tsx src/app/globals.css
git commit -m "feat: add memory pin element and globe styles"
```

---

### Task 4: MemoryCard component

**Files:**
- Create: `src/components/globe/MemoryCard.tsx`

**Interfaces:**
- Consumes: `Memory` from `@/data/memories`; `.memory-card` pop-in class from Task 3
- Produces: `export default function MemoryCard({ memory, onClose }: { memory: Memory; onClose: () => void })` — Task 5 renders it when a pin is selected.

- [ ] **Step 1: Create the card**

Create `src/components/globe/MemoryCard.tsx`:

```tsx
"use client";

import { useEffect } from "react";
import type { Memory } from "@/data/memories";

type Props = {
  memory: Memory;
  onClose: () => void;
};

// Polaroid-style memory card. Mobile: centered modal over a dimmed backdrop.
// Desktop (md+): panel anchored right of the globe, no backdrop, so the
// globe stays interactive while a card is open.
export default function MemoryCard({ memory, onClose }: Props) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Deterministic hand-placed tilt, ±2°.
  const rotation = (memory.id.charCodeAt(0) % 5) - 2;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-[#4A4238]/30 md:hidden"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-label={memory.title}
        className="memory-card fixed left-1/2 top-1/2 z-50 w-[min(88vw,20rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-[#FFFDF8] p-3 pb-5 shadow-xl md:absolute md:left-auto md:right-8 md:translate-x-0"
        style={{ rotate: `${rotation}deg` }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close memory"
          className="absolute -right-2 -top-2 grid h-8 w-8 place-items-center rounded-full bg-[#E8A5A0] text-[#FFFDF8] shadow-md"
        >
          ✕
        </button>
        {/* Placeholder SVGs + tiny gallery: plain img is the right tool here. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={memory.photo}
          alt={memory.title}
          className="aspect-[4/3] w-full rounded-xl object-cover"
        />
        <h3 className="font-hand mt-3 text-2xl text-[#4A4238]">{memory.title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-[#4A4238]/80">{memory.caption}</p>
        <p className="mt-3 text-xs uppercase tracking-wide text-[#4A4238]/60">
          📍 {memory.location} · {memory.date}
        </p>
      </div>
    </>
  );
}
```

Note: `rotate` (the standalone CSS property) composes with Tailwind's translate utilities — do not switch it to `transform`.

- [ ] **Step 2: Verify build + lint**

Run: `npm run build && npm run lint`
Expected: both PASS (the img warning is suppressed by the inline disable).

- [ ] **Step 3: Commit**

```bash
git add src/components/globe/MemoryCard.tsx
git commit -m "feat: add polaroid memory card"
```

---

### Task 5: MemoryGlobe client component

**Files:**
- Create: `src/components/globe/MemoryGlobe.tsx`

**Interfaces:**
- Consumes: `memories`, `Memory` (Task 1); `/globe/watercolor-earth.png` (Task 2); `createPinElement`, `.memory-pin--selected` (Task 3); `MemoryCard` (Task 4)
- Produces: `export default function MemoryGlobe()` — a client-only component filling its parent (parent must have a definite height). Task 6 dynamic-imports it.

- [ ] **Step 1: Create the globe component**

Create `src/components/globe/MemoryGlobe.tsx`:

```tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Globe, { GlobeMethods } from "react-globe.gl";
import { memories, type Memory } from "@/data/memories";
import { createPinElement } from "./MemoryPin";
import MemoryCard from "./MemoryCard";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
const AUTO_ROTATE_RESUME_MS = 5000;

function prefersReducedMotion() {
  return window.matchMedia(REDUCED_MOTION).matches;
}

export default function MemoryGlobe() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const pinElements = useRef(new Map<string, HTMLElement>());
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const [selected, setSelected] = useState<Memory | null>(null);

  // Size the canvas to the wrapper (react-globe.gl defaults to the viewport).
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setSize({ width, height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(
    () => () => {
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
    },
    [],
  );

  const handleSelect = useCallback((memory: Memory) => {
    setSelected(memory);
    const globe = globeRef.current;
    if (!globe) return;
    globe.controls().autoRotate = false;
    globe.pointOfView(
      { lat: memory.lat, lng: memory.lng, altitude: 1.5 },
      prefersReducedMotion() ? 0 : 1000,
    );
  }, []);

  // Gold glow on whichever pin is open.
  useEffect(() => {
    pinElements.current.forEach((el, id) =>
      el.classList.toggle("memory-pin--selected", id === selected?.id),
    );
  }, [selected]);

  const handleGlobeReady = useCallback(() => {
    const globe = globeRef.current;
    if (!globe) return;
    globe.renderer().setPixelRatio(Math.min(window.devicePixelRatio, 2));
    globe.pointOfView({ lat: 20, lng: 0, altitude: 2.2 }, 0);

    const controls = globe.controls();
    controls.enablePan = false;
    controls.minDistance = 150; // ~country level (globe radius is 100 units)
    controls.maxDistance = 400; // whole globe comfortably in frame
    controls.autoRotate = !prefersReducedMotion();
    controls.autoRotateSpeed = 0.4;

    // Pause the idle spin while the user is interacting; resume after idle.
    controls.addEventListener("start", () => {
      controls.autoRotate = false;
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
    });
    controls.addEventListener("end", () => {
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
      resumeTimer.current = setTimeout(() => {
        if (!prefersReducedMotion()) controls.autoRotate = true;
      }, AUTO_ROTATE_RESUME_MS);
    });
  }, []);

  return (
    <div ref={wrapperRef} className="relative h-full w-full">
      {size && (
        <Globe
          ref={globeRef}
          width={size.width}
          height={size.height}
          backgroundColor="rgba(0,0,0,0)"
          globeImageUrl="/globe/watercolor-earth.png"
          atmosphereColor="#E8A5A0"
          atmosphereAltitude={0.18}
          htmlElementsData={memories as unknown as object[]}
          htmlAltitude={0.03}
          htmlElement={(d) => {
            const memory = d as Memory;
            const el = createPinElement(memory, handleSelect);
            pinElements.current.set(memory.id, el);
            return el;
          }}
          htmlElementVisibilityModifier={(el, isVisible) => {
            // Fade pins on the far side of the globe instead of popping.
            el.style.opacity = isVisible ? "1" : "0";
            el.style.pointerEvents = isVisible ? "auto" : "none";
            el.style.transition = "opacity 0.25s ease";
          }}
          onGlobeClick={() => setSelected(null)}
          onGlobeReady={handleGlobeReady}
        />
      )}
      {selected && (
        <MemoryCard memory={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: PASS. If TypeScript rejects a prop name (e.g. `htmlElementVisibilityModifier` missing from installed typings), check the installed version's types in `node_modules/react-globe.gl/dist/react-globe.gl.d.ts` and adjust: the prop may be absent in older versions — in that case delete that prop (pins will pop instead of fade; acceptable) rather than casting to `any`.

- [ ] **Step 3: Commit**

```bash
git add src/components/globe/MemoryGlobe.tsx
git commit -m "feat: add interactive memory globe component"
```

---

### Task 6: GlobeSection wrapper, clouds, font, page integration

**Files:**
- Create: `src/components/globe/GlobeSection.tsx`
- Modify: `src/app/layout.tsx` (add Patrick Hand font)
- Modify: `src/app/globals.css` (register `--font-hand` in the `@theme inline` block)
- Modify: `src/app/page.tsx` (replace scaffold content)

**Interfaces:**
- Consumes: `MemoryGlobe` (Task 5)
- Produces: `export default function GlobeSection()` rendered by the homepage; `font-hand` Tailwind utility used by Tasks 4/6 markup.

- [ ] **Step 1: Add Patrick Hand to `src/app/layout.tsx`**

Add alongside the existing Geist imports (keep everything already there):

```tsx
import { Patrick_Hand } from "next/font/google";

const patrickHand = Patrick_Hand({
  weight: "400",
  variable: "--font-patrick-hand",
  subsets: ["latin"],
});
```

And add `patrickHand.variable` to the `<body>` className string, next to the existing font variables.

- [ ] **Step 2: Register the font utility in `src/app/globals.css`**

Inside the existing `@theme inline { ... }` block, add:

```css
--font-hand: var(--font-patrick-hand);
```

(Tailwind v4 turns this into the `font-hand` utility class used by MemoryCard and GlobeSection.)

- [ ] **Step 3: Create `src/components/globe/GlobeSection.tsx`**

```tsx
"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// three.js needs window — load the globe client-side only.
const MemoryGlobe = dynamic(() => import("./MemoryGlobe"), {
  ssr: false,
  loading: () => <GlobeStatus message="loading our little world…" />,
});

function GlobeStatus({ message }: { message: string }) {
  return (
    <div className="grid h-full w-full place-items-center">
      <p className="font-hand text-xl text-[#4A4238]/70">{message}</p>
    </div>
  );
}

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

// Howl's-sky cumulus clouds — decorative DOM, not in-canvas.
function Clouds() {
  const clouds = [
    { style: { top: "8%", left: "5%", "--drift-duration": "70s" }, scale: 1 },
    { style: { top: "16%", right: "8%", "--drift-duration": "95s" }, scale: 0.7 },
    { style: { top: "58%", left: "10%", "--drift-duration": "110s" }, scale: 0.5 },
  ] as const;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
      {clouds.map((cloud, i) => (
        <svg
          key={i}
          className="cloud"
          style={cloud.style as React.CSSProperties}
          width={220 * cloud.scale}
          height={80 * cloud.scale}
          viewBox="0 0 220 80"
          fill="#FFFDF8"
          opacity="0.8"
        >
          <ellipse cx="60" cy="55" rx="55" ry="24" />
          <ellipse cx="120" cy="42" rx="48" ry="28" />
          <ellipse cx="170" cy="56" rx="45" ry="20" />
        </svg>
      ))}
    </div>
  );
}

export default function GlobeSection() {
  // null = not yet checked (SSR-safe), then true/false after mount.
  const [webglOk, setWebglOk] = useState<boolean | null>(null);
  useEffect(() => setWebglOk(supportsWebGL()), []);

  return (
    <section
      aria-label="Memory globe"
      className="relative min-h-[85vh] w-full overflow-hidden bg-gradient-to-b from-[#BFDDE8] to-[#F6E7D3]"
    >
      <Clouds />
      <h2 className="font-hand relative z-10 pt-10 text-center text-3xl text-[#4A4238] sm:text-4xl">
        our little world
      </h2>
      <div className="relative z-10 h-[70vh] w-full">
        {webglOk === false ? (
          <GlobeStatus message="this globe needs WebGL — try another browser 🌍" />
        ) : webglOk === true ? (
          <MemoryGlobe />
        ) : (
          <GlobeStatus message="loading our little world…" />
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Replace `src/app/page.tsx`**

```tsx
import GlobeSection from "@/components/globe/GlobeSection";

export default function Home() {
  return (
    <main>
      <GlobeSection />
    </main>
  );
}
```

- [ ] **Step 5: Verify build + lint + tests**

Run: `npm run build && npm run lint && npm test`
Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app src/components/globe/GlobeSection.tsx
git commit -m "feat: add globe section with sky, clouds, and font"
```

---

### Task 7: End-to-end manual verification

**Files:** none (verification only; fix-forward commits allowed)

**Interfaces:**
- Consumes: everything above
- Produces: a verified, pushed feature.

- [ ] **Step 1: Start the dev server**

Run: `npm run dev` (background), open `http://localhost:3000`.

- [ ] **Step 2: Walk the checklist** (use Playwright browser tools or ask Connor to check manually; screenshot each state)

1. Section shows sky gradient, drifting clouds, heading; globe fades in (no layout shift, placeholder text shows first on a throttled reload).
2. Globe idles with a slow spin; watercolor texture + blush atmosphere visible.
3. Drag rotates 360°; spin pauses during drag and resumes ~5 s after release.
4. Scroll-zoom clamps at both ends (can't zoom inside the globe or out to a speck).
5. 5 pins visible, bobbing out of sync; far-side pins fade out; hover shows gold ring + scale-up.
6. Click a pin → camera glides to it (~1 s) → card pops in with photo, title, caption, location/date; pin glows gold.
7. Close via ✕, via Esc, and via clicking the globe background — all work; clicking another pin swaps the card.
8. Mobile emulation (iPhone-size viewport): swipe rotates, tap pin opens centered modal over dimmed backdrop, backdrop tap closes.
9. Emulate `prefers-reduced-motion: reduce` (devtools rendering tab, then reload): no auto-rotate, no pin bob, no cloud drift, fly-to is instant.

- [ ] **Step 3: Fix anything that fails**

Diagnose with superpowers:systematic-debugging, fix, and commit each fix separately (`fix: ...`). Re-run the failed checklist item.

- [ ] **Step 4: Final gate and push**

Run: `npm run build && npm run lint && npm test`
Expected: all PASS. Then:

```bash
git push
```
