"use client";

import { useCallback, useRef, useState } from "react";
import HeroSection from "@/components/HeroSection";
import GlobeSection from "@/components/globe/GlobeSection";

// Snap-scroll shell with a one-way cover: once you scroll past the hero,
// scrolling locks (the globe owns all gestures) and a home sticker in the
// top-left is the only way back to the cover.
export default function TourShell() {
  const mainRef = useRef<HTMLElement>(null);
  const [locked, setLocked] = useState(false);

  const handleScroll = useCallback(() => {
    const main = mainRef.current;
    if (!main) return;
    if (main.scrollTop >= main.clientHeight - 2) setLocked(true);
  }, []);

  const goHome = useCallback(() => {
    setLocked(false);
    // Programmatic scroll works regardless of the overflow lock.
    mainRef.current?.scrollTo({
      top: 0,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }, []);

  return (
    <main
      ref={mainRef}
      onScroll={handleScroll}
      className={`h-dvh snap-y snap-mandatory ${
        locked ? "tour-locked overflow-y-hidden" : "overflow-y-auto"
      }`}
    >
      <HeroSection />
      <GlobeSection />
      {locked && (
        <button
          type="button"
          onClick={goHome}
          aria-label="Back to the cover"
          className="group fixed left-4 top-[max(1rem,env(safe-area-inset-top))] z-30 flex flex-col items-center gap-1"
        >
          <span className="grid h-12 w-12 place-items-center rounded-full border-[3px] border-[#FFFDF8] bg-[#BFDDE8] text-xl shadow-md transition group-hover:-rotate-6 group-hover:scale-110 group-hover:shadow-lg">
            🏠
          </span>
          <span className="font-hand text-sm text-[#4A4238]/80">cover</span>
        </button>
      )}
    </main>
  );
}
