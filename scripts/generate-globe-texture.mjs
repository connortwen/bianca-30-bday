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
// Palette quantization keeps the flat watercolor art crisp while staying well under the 1 MB budget.
await sharp(Buffer.from(svg))
  .png({ palette: true, quality: 90, compressionLevel: 9 })
  .toFile("public/globe/watercolor-earth.png");
console.log("Wrote public/globe/watercolor-earth.png");
