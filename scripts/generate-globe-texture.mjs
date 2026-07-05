// One-off generator for the Ghibli-style globe texture.
// Run: node scripts/generate-globe-texture.mjs
// Output: public/globe/watercolor-earth.png (2048x1024 equirectangular)
//
// Aim: a map that looks hand-painted — wobbly ink coastlines (turbulence
// displacement), watercolor meadow washes pooling over warm cream land,
// pale shallow water hugging the shores, and paper grain over everything.
// All feTurbulence filters use stitchTiles="stitch" with a full-image
// userSpace filter region so the texture wraps seamlessly at ±180° lng.
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { geoEquirectangular, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import sharp from "sharp";

const require = createRequire(import.meta.url);
const land110 = require("world-atlas/land-110m.json");

const W = 2048;
const H = 1024;

// Wash colors live inside the feColorMatrix values below (rows are R,G,B,A):
// sea wash #9CCAD1 · deep sea #5E9DAF · meadow #A2C796 · forest #79A271
const SEA = "#7FB6C4"; // muted teal
const SHALLOWS = "#C3E2DB"; // pale aqua hugging the coasts
const LAND = "#EFE3C8"; // parchment cream
const EDGE_POOL = "#D9BF9C"; // watercolor pigment pooling at coastline edges
const INK = "#6B5A48"; // warm sepia ink for the hand-drawn outline

const land = feature(land110, land110.objects.land);
const projection = geoEquirectangular()
  .translate([W / 2, H / 2])
  .scale(W / (2 * Math.PI));
const path = geoPath(projection);
const landPath = path(land);

const fullRegion = `filterUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <clipPath id="landClip"><path d="${landPath}"/></clipPath>

    <!-- Hand wobble: displaces the whole land group so fills + ink move together -->
    <filter id="wobble" ${fullRegion}>
      <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="3" seed="7" stitchTiles="stitch" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="7" xChannelSelector="R" yChannelSelector="G"/>
    </filter>

    <!-- Big soft watercolor blooms (alpha comes from noise, gently thresholded) -->
    <filter id="seaWash" ${fullRegion}>
      <feTurbulence type="fractalNoise" baseFrequency="0.004 0.008" numOctaves="3" seed="3" stitchTiles="stitch"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0.612  0 0 0 0 0.792  0 0 0 0 0.820  1.3 0 0 0 -0.45"/>
    </filter>
    <filter id="seaDeep" ${fullRegion}>
      <feTurbulence type="fractalNoise" baseFrequency="0.003 0.006" numOctaves="3" seed="5" stitchTiles="stitch"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0.369  0 0 0 0 0.616  0 0 0 0 0.686  1.2 0 0 0 -0.42"/>
    </filter>
    <filter id="meadow" ${fullRegion}>
      <feTurbulence type="fractalNoise" baseFrequency="0.006 0.011" numOctaves="3" seed="11" stitchTiles="stitch"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0.635  0 0 0 0 0.780  0 0 0 0 0.588  2.1 0 0 0 -0.42"/>
    </filter>
    <filter id="forest" ${fullRegion}>
      <feTurbulence type="fractalNoise" baseFrequency="0.014 0.022" numOctaves="4" seed="23" stitchTiles="stitch"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0.475  0 0 0 0 0.635  0 0 0 0 0.443  1.8 0 0 0 -0.68"/>
    </filter>

    <!-- Pale shallow water: dilated + blurred land silhouette, drawn under the land -->
    <filter id="shallows" ${fullRegion}>
      <feMorphology in="SourceAlpha" operator="dilate" radius="9" result="dil"/>
      <feGaussianBlur in="dil" stdDeviation="7" result="soft"/>
      <feFlood flood-color="${SHALLOWS}" flood-opacity="0.9" result="col"/>
      <feComposite in="col" in2="soft" operator="in"/>
    </filter>

    <filter id="soften"><feGaussianBlur stdDeviation="1.2"/></filter>

    <filter id="grain" ${fullRegion}>
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="41" stitchTiles="stitch"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0.29  0 0 0 0 0.26  0 0 0 0 0.22  0 0 0 0.05 0"/>
    </filter>
  </defs>

  <!-- Sea: base + deep pigment patches + lighter watercolor blooms -->
  <rect width="100%" height="100%" fill="${SEA}"/>
  <rect width="100%" height="100%" filter="url(#seaDeep)"/>
  <rect width="100%" height="100%" filter="url(#seaWash)"/>

  <!-- Shallow water glow along coasts -->
  <path d="${landPath}" filter="url(#shallows)"/>

  <!-- Land, wobbled as one group so paint and ink stay registered -->
  <g filter="url(#wobble)">
    <path d="${landPath}" fill="${LAND}" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round" stroke-opacity="0.85"/>
    <g clip-path="url(#landClip)">
      <rect width="100%" height="100%" filter="url(#meadow)"/>
      <rect width="100%" height="100%" filter="url(#forest)"/>
      <!-- Pigment pooling: inner half of a fat stroke, clipped to land -->
      <path d="${landPath}" fill="none" stroke="${EDGE_POOL}" stroke-width="9" stroke-opacity="0.4" filter="url(#soften)"/>
    </g>
  </g>

  <!-- Tiny hand-painted doodles in the open oceans: hearts and sparkles. -->
  <defs>
    <path id="doodle-heart" d="M8 13.5 C3 10 1.5 6.5 3.5 4.2 C5.2 2.4 7.4 3.4 8 5 C8.6 3.4 10.8 2.4 12.5 4.2 C14.5 6.5 13 10 8 13.5 Z"/>
    <path id="doodle-star" d="M8 0 L9.8 6.2 L16 8 L9.8 9.8 L8 16 L6.2 9.8 L0 8 L6.2 6.2 Z"/>
  </defs>
  <g>
    <use href="#doodle-heart" x="0" y="0" transform="translate(300 660) scale(1.5)" fill="#E8A5A0" opacity="0.55"/>
    <use href="#doodle-star" transform="translate(400 720) scale(1.1)" fill="#FFFDF8" opacity="0.65"/>
    <use href="#doodle-star" transform="translate(240 590) scale(0.8)" fill="#FFFDF8" opacity="0.6"/>
    <use href="#doodle-heart" transform="translate(150 400) scale(1.1)" fill="#E8A5A0" opacity="0.5"/>
    <use href="#doodle-star" transform="translate(830 380) scale(1.2)" fill="#FFFDF8" opacity="0.65"/>
    <use href="#doodle-heart" transform="translate(905 660) scale(1.4)" fill="#E8A5A0" opacity="0.55"/>
    <use href="#doodle-star" transform="translate(960 590) scale(0.9)" fill="#FFFDF8" opacity="0.6"/>
    <use href="#doodle-heart" transform="translate(1480 640) scale(1.3)" fill="#E8A5A0" opacity="0.55"/>
    <use href="#doodle-star" transform="translate(1560 700) scale(1)" fill="#FFFDF8" opacity="0.65"/>
    <use href="#doodle-star" transform="translate(1860 430) scale(1.2)" fill="#FFFDF8" opacity="0.6"/>
    <use href="#doodle-heart" transform="translate(1790 620) scale(1.1)" fill="#E8A5A0" opacity="0.5"/>
  </g>

  <!-- Pole caps: fade the top/bottom rows to a single flat tone. Every texture
       column converges to one point at each pole, so any variation there
       renders as a pinwheel artifact on the sphere. -->
  <linearGradient id="topFade" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#8FC0CB"/>
    <stop offset="1" stop-color="#8FC0CB" stop-opacity="0"/>
  </linearGradient>
  <linearGradient id="bottomFade" x1="0" y1="1" x2="0" y2="0">
    <stop offset="0" stop-color="#E9E2CB"/>
    <stop offset="1" stop-color="#E9E2CB" stop-opacity="0"/>
  </linearGradient>
  <rect x="0" y="0" width="100%" height="64" fill="url(#topFade)"/>
  <rect x="0" y="${H - 64}" width="100%" height="64" fill="url(#bottomFade)"/>

  <!-- Paper grain over everything -->
  <rect width="100%" height="100%" filter="url(#grain)"/>
</svg>`;

// --- Seam repair ------------------------------------------------------------
// The noise filters don't tile horizontally (librsvg ignores stitchTiles), so
// the texture's left/right edges mismatch — a visible line at ±180° longitude.
// Fix: roll the image half-way around (its edges become seamless, the mismatch
// moves to the center), feather-blur a strip across that centered seam, then
// roll back.

const half = W / 2;

async function roll(buffer) {
  const left = await sharp(buffer).extract({ left: 0, top: 0, width: half, height: H }).toBuffer();
  const right = await sharp(buffer).extract({ left: half, top: 0, width: half, height: H }).toBuffer();
  return sharp({ create: { width: W, height: H, channels: 3, background: "#7FB6C4" } })
    .composite([
      { input: right, left: 0, top: 0 },
      { input: left, left: half, top: 0 },
    ])
    .png()
    .toBuffer();
}

const raw = await sharp(Buffer.from(svg)).flatten({ background: SEA }).png().toBuffer();
const rolled = await roll(raw);

const STRIP = 160;
const blurredStrip = await sharp(rolled)
  .extract({ left: half - STRIP / 2, top: 0, width: STRIP, height: H })
  .blur(6)
  .toBuffer();
const featherMask = `<svg xmlns="http://www.w3.org/2000/svg" width="${STRIP}" height="${H}">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#fff" stop-opacity="0"/>
    <stop offset="0.35" stop-color="#fff" stop-opacity="1"/>
    <stop offset="0.65" stop-color="#fff" stop-opacity="1"/>
    <stop offset="1" stop-color="#fff" stop-opacity="0"/>
  </linearGradient></defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
</svg>`;
const featheredStrip = await sharp(blurredStrip)
  .ensureAlpha()
  .composite([{ input: Buffer.from(featherMask), blend: "dest-in" }])
  .png()
  .toBuffer();
const repaired = await sharp(rolled)
  .composite([{ input: featheredStrip, left: half - STRIP / 2, top: 0 }])
  .png()
  .toBuffer();
const final = await roll(repaired);

mkdirSync("public/globe", { recursive: true });
// Palette quantization keeps the file well under the 1 MB budget.
await sharp(final)
  .png({ palette: true, quality: 90, compressionLevel: 9 })
  .toFile("public/globe/watercolor-earth.png");
console.log("Wrote public/globe/watercolor-earth.png");
