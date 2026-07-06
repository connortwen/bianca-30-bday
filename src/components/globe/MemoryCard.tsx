"use client";

import { useEffect } from "react";
import type { Memory } from "@/data/memories";

type Props = {
  memory: Memory;
  unlocked: boolean;
  onRequestUnlock: () => void;
  onClose: () => void;
};

// The photo slot: a real photo for normal (or unlocked) memories, a locked
// panel pointing at the central unlock for locked ones, and a dashed teaser
// panel for coming-soon ones.
function CardMedia({
  memory,
  locked,
  onRequestUnlock,
}: {
  memory: Memory;
  locked: boolean;
  onRequestUnlock: () => void;
}) {
  if (locked) {
    return (
      <div className="grid aspect-[4/3] w-full place-items-center rounded-xl bg-[#4A4238]/10">
        <div className="text-center">
          <span className="text-3xl">🔒</span>
          <p className="font-hand mt-1 text-lg text-[#4A4238]/70">this one&apos;s locked</p>
          <button
            type="button"
            onClick={onRequestUnlock}
            className="font-hand mt-2 rounded-full bg-[#E8A5A0] px-4 py-1.5 text-lg text-[#FFFDF8] shadow-sm transition hover:brightness-105"
          >
            🗝️ enter the code
          </button>
        </div>
      </div>
    );
  }

  if ((memory.status ?? "normal") === "coming-soon") {
    return (
      <div className="grid aspect-[4/3] w-full place-items-center rounded-xl border-2 border-dashed border-[#E8A5A0] bg-[#FFFDF8]">
        <div className="text-center">
          <span className="text-3xl">✨</span>
          <p className="font-hand mt-1 text-lg text-[#4A4238]/60">coming soon…</p>
        </div>
      </div>
    );
  }

  return (
    // Placeholder SVGs + tiny gallery: plain img is the right tool here.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={memory.photo}
      alt={memory.title}
      className={`aspect-[4/3] w-full rounded-xl object-cover ${
        PHOTO_CROP[memory.id] ?? ""
      }`}
    />
  );
}

// Crop-window overrides for photos whose subjects sit away from center
// (object-cover defaults to a centered crop).
const PHOTO_CROP: Record<string, string> = {
  miami: "object-bottom",
};

export default function MemoryCard({ memory, unlocked, onRequestUnlock, onClose }: Props) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Deterministic hand-placed tilt, ±2°.
  const rotation = (memory.id.charCodeAt(0) % 5) - 2;

  const locked = (memory.status ?? "normal") === "locked" && !unlocked;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-[#4A4238]/30 md:hidden"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-label={locked ? `Locked memory in ${memory.location}` : memory.title}
        onClick={(event) => event.stopPropagation()}
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
        <CardMedia memory={memory} locked={locked} onRequestUnlock={onRequestUnlock} />
        {/* Never leak a locked memory's real title/caption before unlock. */}
        <h3 className="font-hand mt-3 text-2xl text-[#4A4238]">
          {locked ? "a secret memory" : memory.title}
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-[#4A4238]/80">
          {locked ? "Crack the code to open this one." : memory.caption}
        </p>
        <p className="mt-3 text-xs uppercase tracking-wide text-[#4A4238]/60">
          📍 {memory.location} · {memory.date}
        </p>
      </div>
    </>
  );
}
