// content/memories.csv is the CMS for the globe's memory cards.
// This script validates it and regenerates src/data/memories.generated.json.
// Run: npm run sync  (build, dev, and test run it automatically)
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const CSV_PATH = "content/memories.csv";
const OUT_PATH = "src/data/memories.generated.json";
const COLUMNS = ["id", "status", "lat", "lng", "location", "title", "caption", "date", "photo"];
const STATUSES = ["normal", "locked", "coming-soon"];

// Minimal RFC 4180 parser: quoted fields, escaped quotes, CRLF/LF.
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      if (row.some((f) => f !== "")) rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  row.push(field);
  if (row.some((f) => f !== "")) rows.push(row);
  return rows;
}

const [header, ...rows] = parseCSV(readFileSync(CSV_PATH, "utf8"));

if (header.join(",") !== COLUMNS.join(",")) {
  console.error(`✗ ${CSV_PATH} header must be exactly: ${COLUMNS.join(",")}`);
  process.exit(1);
}

const errors = [];
const seenIds = new Set();

const memories = rows.map((r, i) => {
  const rec = Object.fromEntries(COLUMNS.map((col, j) => [col, (r[j] ?? "").trim()]));
  const line = i + 2; // 1-based, after header

  if (!rec.id) errors.push(`line ${line}: missing id`);
  if (seenIds.has(rec.id)) errors.push(`line ${line}: duplicate id "${rec.id}"`);
  seenIds.add(rec.id);

  const status = rec.status || "normal";
  if (!STATUSES.includes(status)) {
    errors.push(`line ${line}: unknown status "${rec.status}" (use ${STATUSES.join(" | ")} or leave empty)`);
  }

  const lat = Number(rec.lat);
  const lng = Number(rec.lng);
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) errors.push(`line ${line}: bad lat "${rec.lat}"`);
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) errors.push(`line ${line}: bad lng "${rec.lng}"`);

  for (const col of ["location", "title", "caption", "date"]) {
    if (!rec[col]) errors.push(`line ${line}: missing ${col}`);
  }

  if (status === "normal" && !rec.photo) {
    errors.push(`line ${line}: normal memories need a photo (e.g. /memories/tokyo.webp)`);
  }
  if (rec.photo && !existsSync(join("public", rec.photo))) {
    errors.push(`line ${line}: photo ${rec.photo} not found under public/`);
  }

  const memory = {
    id: rec.id,
    lat,
    lng,
    location: rec.location,
    title: rec.title,
    caption: rec.caption,
    date: rec.date,
  };
  if (rec.photo) memory.photo = rec.photo;
  if (status !== "normal") memory.status = status;
  return memory;
});

if (errors.length) {
  console.error(`✗ ${CSV_PATH} has ${errors.length} problem(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

writeFileSync(OUT_PATH, JSON.stringify(memories, null, 2) + "\n");
console.log(`✓ Synced ${memories.length} memories → ${OUT_PATH}`);
