"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Globe, { GlobeMethods } from "react-globe.gl";
import { memories, type Memory } from "@/data/memories";
import { createPinElement } from "./MemoryPin";
import MemoryCard from "./MemoryCard";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
const AUTO_ROTATE_RESUME_MS = 5000;

function prefersReducedMotion() {
  return window.matchMedia(REDUCED_MOTION).matches;
}

export default function MemoryGlobe() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const pinElements = useRef(new Map<string, HTMLElement>());
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const [selected, setSelected] = useState<Memory | null>(null);

  // Size the canvas to the wrapper (react-globe.gl defaults to the viewport).
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setSize({ width, height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(
    () => () => {
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
    },
    [],
  );

  const handleSelect = useCallback((memory: Memory) => {
    setSelected(memory);
    const globe = globeRef.current;
    if (!globe) return;
    globe.controls().autoRotate = false;
    globe.pointOfView(
      { lat: memory.lat, lng: memory.lng, altitude: 1.5 },
      prefersReducedMotion() ? 0 : 1000,
    );
  }, []);

  // Gold glow on whichever pin is open.
  useEffect(() => {
    pinElements.current.forEach((el, id) =>
      el.classList.toggle("memory-pin--selected", id === selected?.id),
    );
  }, [selected]);

  const handleGlobeReady = useCallback(() => {
    const globe = globeRef.current;
    if (!globe) return;
    globe.renderer().setPixelRatio(Math.min(window.devicePixelRatio, 2));
    globe.pointOfView({ lat: 20, lng: 0, altitude: 2.2 }, 0);

    const controls = globe.controls();
    controls.enablePan = false;
    controls.minDistance = 150; // ~country level (globe radius is 100 units)
    controls.maxDistance = 400; // whole globe comfortably in frame
    controls.autoRotate = !prefersReducedMotion();
    controls.autoRotateSpeed = 0.4;

    // Pause the idle spin while the user is interacting; resume after idle.
    controls.addEventListener("start", () => {
      controls.autoRotate = false;
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
    });
    controls.addEventListener("end", () => {
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
      resumeTimer.current = setTimeout(() => {
        if (!prefersReducedMotion()) controls.autoRotate = true;
      }, AUTO_ROTATE_RESUME_MS);
    });
  }, []);

  return (
    <div ref={wrapperRef} className="relative h-full w-full">
      {size && (
        <Globe
          ref={globeRef}
          width={size.width}
          height={size.height}
          backgroundColor="rgba(0,0,0,0)"
          globeImageUrl="/globe/watercolor-earth.png"
          atmosphereColor="#E8A5A0"
          atmosphereAltitude={0.18}
          htmlElementsData={memories as unknown as object[]}
          htmlAltitude={0.03}
          htmlElement={(d) => {
            const memory = d as Memory;
            const el = createPinElement(memory, handleSelect);
            pinElements.current.set(memory.id, el);
            return el;
          }}
          htmlElementVisibilityModifier={(el, isVisible) => {
            // Fade pins on the far side of the globe instead of popping.
            el.style.opacity = isVisible ? "1" : "0";
            el.style.pointerEvents = isVisible ? "auto" : "none";
            el.style.transition = "opacity 0.25s ease";
          }}
          onGlobeClick={() => setSelected(null)}
          onGlobeReady={handleGlobeReady}
        />
      )}
      {selected && (
        <MemoryCard memory={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
