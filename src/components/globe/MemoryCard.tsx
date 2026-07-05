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
