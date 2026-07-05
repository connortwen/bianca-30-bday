// Prints the hash to paste into the `code` column of content/memories.csv.
// Usage: npm run code WAFFL
import { createHash } from "node:crypto";

const input = process.argv[2];
if (!input) {
  console.error("Usage: npm run code <SECRET-CODE>");
  process.exit(1);
}
// Same normalization the unlock form applies: trimmed, uppercased.
const normalized = input.trim().toUpperCase();
const hash = createHash("sha256").update(normalized).digest("hex");
console.log(`code:  ${normalized}`);
console.log(`hash:  ${hash}`);
