// Unlock state persists per-browser in localStorage — no backend needed.
const STORAGE_KEY = "bjw:unlocked";

export function loadUnlockedIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    return []; // private mode / storage disabled — unlocks just won't persist
  }
}

export function saveUnlockedIds(ids: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // best-effort
  }
}

export async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Same normalization `npm run code` applies when hashing.
export function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

// --- Cross-device state via /api/unlocks (Vercel Blob) ----------------------

export async function fetchUnlockedIds(): Promise<string[] | null> {
  try {
    const res = await fetch("/api/unlocks", { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data.ids) ? data.ids : null;
  } catch {
    return null;
  }
}

export type UnlockResult = "ok" | "wrong" | "error";

export async function requestUnlock(id: string, code: string): Promise<UnlockResult> {
  try {
    const res = await fetch("/api/unlocks", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, code }),
    });
    if (res.ok) return "ok";
    if (res.status === 401) return "wrong";
    return "error";
  } catch {
    return "error";
  }
}
