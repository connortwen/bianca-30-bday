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

const SEA = "#7FB6C4"; // muted teal
const SEA_WASH = "#9CCAD1"; // lighter watercolor blooms in open water
const SHALLOWS = "#C3E2DB"; // pale aqua hugging the coasts
const LAND = "#EFE3C8"; // parchment cream
const MEADOW = "#A8C69F"; // soft green fields
const FOREST = "#87A97F"; // deeper green woods
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

  <!-- Paper grain over everything -->
  <rect width="100%" height="100%" filter="url(#grain)"/>
</svg>`;

mkdirSync("public/globe", { recursive: true });
// Palette quantization keeps the file well under the 1 MB budget.
await sharp(Buffer.from(svg))
  .png({ palette: true, quality: 90, compressionLevel: 9 })
  .toFile("public/globe/watercolor-earth.png");
console.log("Wrote public/globe/watercolor-earth.png");
