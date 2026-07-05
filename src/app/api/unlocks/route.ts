import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { list, put } from "@vercel/blob";
import { memories } from "@/data/memories";

// Cross-device unlock state in Vercel Blob: one empty marker blob per
// unlocked id under unlocks/<id>. The blob LIST API is strongly consistent,
// unlike blob-content reads which go through a CDN and can serve stale data
// right after a write — so we never read content, only pathnames. Writing
// one marker per unlock (instead of one shared JSON) also avoids a
// read-modify-write race between simultaneous unlocks.
const PREFIX = "unlocks/";

export const dynamic = "force-dynamic";

async function readIds(): Promise<string[]> {
  const { blobs } = await list({ prefix: PREFIX, limit: 1000 });
  return blobs.map((b) => b.pathname.slice(PREFIX.length)).filter(Boolean);
}

export async function GET() {
  try {
    return NextResponse.json({ ids: await readIds() });
  } catch {
    return NextResponse.json({ ids: [] }, { status: 503 });
  }
}

export async function POST(request: Request) {
  let body: { code?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const { code } = body;
  if (typeof code !== "string" || !code.trim()) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  // Central unlock: the code itself identifies which locked memory it opens.
  const hash = createHash("sha256").update(code.trim().toUpperCase()).digest("hex");
  const memory = memories.find((m) => m.codeHash === hash);
  if (!memory) {
    return NextResponse.json({ error: "wrong code" }, { status: 401 });
  }

  try {
    await put(`${PREFIX}${memory.id}`, "1", {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    return NextResponse.json({ unlockedId: memory.id, ids: await readIds() });
  } catch {
    return NextResponse.json({ error: "storage unavailable" }, { status: 503 });
  }
}
