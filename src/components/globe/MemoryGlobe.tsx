"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Globe, { GlobeMethods } from "react-globe.gl";
import { AmbientLight } from "three";
import { memories, type Memory } from "@/data/memories";
import { createPinElement } from "./MemoryPin";
import MemoryCard from "./MemoryCard";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
const AUTO_ROTATE_RESUME_MS = 5000;
const ZOOM_HINT_MS = 1600;
// Camera altitude bounds, kept in sync with controls min/maxDistance
// (globe radius is 100 units; distance = radius * (1 + altitude)).
// Min is deep enough to separate close pin clusters (Bay Area, Manila).
const MIN_ALTITUDE = 0.1;
const MAX_ALTITUDE = 3;

function prefersReducedMotion() {
  return window.matchMedia(REDUCED_MOTION).matches;
}

function isMac() {
  return /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
}

export default function MemoryGlobe() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const pinElements = useRef(new Map<string, HTMLElement>());
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointerDownAt = useRef<{ x: number; y: number } | null>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const [selected, setSelected] = useState<Memory | null>(null);
  const [zoomHint, setZoomHint] = useState(false);

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
      if (hintTimer.current) clearTimeout(hintTimer.current);
    },
    [],
  );

  // Plain scroll should scroll the page, not zoom the globe. Only let wheel
  // events through to OrbitControls when ⌘/ctrl is held — trackpad pinches
  // report ctrlKey=true, so pinch-to-zoom keeps working naturally.
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) return;
      event.stopPropagation(); // starve OrbitControls; browser scrolls the page
      setZoomHint(true);
      if (hintTimer.current) clearTimeout(hintTimer.current);
      hintTimer.current = setTimeout(() => setZoomHint(false), ZOOM_HINT_MS);
    };
    el.addEventListener("wheel", onWheel, { capture: true, passive: true });
    return () => el.removeEventListener("wheel", onWheel, { capture: true });
  }, []);

  const zoomBy = useCallback((factor: number) => {
    const globe = globeRef.current;
    if (!globe) return;
    const { altitude } = globe.pointOfView();
    const next = Math.min(MAX_ALTITUDE, Math.max(MIN_ALTITUDE, altitude * factor));
    globe.pointOfView({ altitude: next }, prefersReducedMotion() ? 0 : 300);
  }, []);

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
    // Even, storybook lighting: replace the default ambient + directional pair
    // (which shades one side of the sphere) with a single white ambient.
    globe.lights([new AmbientLight(0xffffff, Math.PI)]);
    globe.pointOfView({ lat: 20, lng: 0, altitude: 2.2 }, 0);

    const controls = globe.controls();
    controls.enablePan = false;
    controls.minDistance = 110; // ~city-cluster level (globe radius is 100 units)
    controls.maxDistance = 400; // whole globe comfortably in frame
    controls.autoRotate = !prefersReducedMotion();
    controls.autoRotateSpeed = 0.4;

    // globe.gl re-tunes zoomSpeed to sqrt(altitude) * 0.5 on every camera
    // change, which feels sluggish. This listener registers after theirs,
    // so our snappier tuning wins.
    controls.addEventListener("change", () => {
      controls.zoomSpeed = Math.sqrt(globe.pointOfView().altitude) * 1.5;
    });

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

  // Click-away closes the card — but only for true clicks, not drag-rotations.
  // Pins, zoom buttons, and the card itself stop propagation before this fires.
  const handleClickAway = useCallback((event: React.MouseEvent) => {
    const down = pointerDownAt.current;
    if (down && Math.hypot(event.clientX - down.x, event.clientY - down.y) > 6) return;
    setSelected(null);
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="relative h-full w-full"
      onPointerDown={(event) => {
        pointerDownAt.current = { x: event.clientX, y: event.clientY };
      }}
      onClick={handleClickAway}
    >
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
          onGlobeReady={handleGlobeReady}
        />
      )}
      {/* Shown when a plain scroll passes over the globe, so the zoom gesture is discoverable. */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-x-0 bottom-6 z-20 flex justify-center transition-opacity duration-300 ${
          zoomHint ? "opacity-100" : "opacity-0"
        }`}
      >
        <span className="font-hand rounded-full bg-[#4A4238]/70 px-4 py-1.5 text-sm text-[#FFFDF8]">
          hold {isMac() ? "⌘" : "ctrl"} + scroll (or pinch) to zoom
        </span>
      </div>
      <div
        className="absolute bottom-6 left-6 z-20 flex flex-col gap-2"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => zoomBy(0.7)}
          aria-label="Zoom in"
          className="grid h-10 w-10 place-items-center rounded-full bg-[#FFFDF8]/90 text-xl text-[#4A4238] shadow-md transition hover:bg-[#FFFDF8]"
        >
          +
        </button>
        <button
          type="button"
          onClick={() => zoomBy(1.4)}
          aria-label="Zoom out"
          className="grid h-10 w-10 place-items-center rounded-full bg-[#FFFDF8]/90 text-xl text-[#4A4238] shadow-md transition hover:bg-[#FFFDF8]"
        >
          −
        </button>
      </div>
      {selected && (
        <MemoryCard memory={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
