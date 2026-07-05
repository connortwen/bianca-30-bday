"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Globe, { GlobeMethods } from "react-globe.gl";
import { AmbientLight } from "three";
import { memories, type Memory } from "@/data/memories";
import { fetchUnlockedIds, loadUnlockedIds, saveUnlockedIds } from "@/lib/unlocks";
import { createPinElement, wakePinElement } from "./MemoryPin";
import MemoryCard from "./MemoryCard";
import UnlockDialog from "./UnlockDialog";
import AuthorNoteDialog from "./AuthorNoteDialog";

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

function ControlButton({
  emoji,
  label,
  color,
  onClick,
}: {
  emoji: string;
  label: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="group flex flex-col items-center gap-1">
      <span
        className={`grid h-12 w-12 place-items-center rounded-full ${color} border-[3px] border-[#FFFDF8] text-xl shadow-md transition group-hover:-rotate-6 group-hover:scale-110 group-hover:shadow-lg`}
      >
        {emoji}
      </span>
      <span className="font-hand text-sm text-[#4A4238]/80">{label}</span>
    </button>
  );
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
  const [showUnlock, setShowUnlock] = useState(false);
  const [showNote, setShowNote] = useState(false);
  // Safe to read localStorage in the initializer: this component is client-only.
  const [unlocked, setUnlocked] = useState<Set<string>>(
    () => new Set(loadUnlockedIds()),
  );
  const unlockedRef = useRef(unlocked);
  useEffect(() => {
    unlockedRef.current = unlocked;
  }, [unlocked]);

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

  const handleUnlock = useCallback((id: string) => {
    setUnlocked((prev) => {
      const next = new Set(prev).add(id);
      saveUnlockedIds([...next]);
      return next;
    });
  }, []);

  // A correct code from the central dialog: record it, then fly to the pin
  // and pop the freshly revealed card.
  const handleCodeUnlocked = useCallback(
    (id: string) => {
      handleUnlock(id);
      setShowUnlock(false);
      const memory = memories.find((m) => m.id === id);
      if (memory) handleSelect(memory);
    },
    [handleUnlock, handleSelect],
  );

  // Merge in unlocks recorded on other devices (Vercel Blob via /api/unlocks).
  useEffect(() => {
    let cancelled = false;
    fetchUnlockedIds().then((ids) => {
      if (cancelled || !ids?.length) return;
      setUnlocked((prev) => {
        const next = new Set([...prev, ...ids]);
        saveUnlockedIds([...next]);
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Unlocked pins wake up with heart eyes.
  useEffect(() => {
    pinElements.current.forEach((el, id) => {
      if (unlocked.has(id)) wakePinElement(el);
    });
  }, [unlocked]);

  const handleGlobeReady = useCallback(() => {
    const globe = globeRef.current;
    if (!globe) return;
    globe.renderer().setPixelRatio(Math.min(window.devicePixelRatio, 2));
    // Vertical swipes should scroll the page (snap back to the hero), while
    // horizontal swipes rotate and pinches still reach OrbitControls.
    globe.renderer().domElement.style.touchAction = "pan-y";
    // Even, storybook lighting: replace the default ambient + directional pair
    // (which shades one side of the sphere) with a single white ambient.
    globe.lights([new AmbientLight(0xffffff, Math.PI)]);
    // Portrait screens crop the globe horizontally — start zoomed out enough
    // that the whole sphere is framed.
    const el = wrapperRef.current;
    const aspect = el ? el.clientWidth / Math.max(1, el.clientHeight) : 1;
    globe.pointOfView({ lat: 20, lng: 0, altitude: aspect < 0.75 ? 3 : 2.2 }, 0);

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
            // Pins are created after mount, so apply persisted unlocks here too.
            if (unlockedRef.current.has(memory.id)) wakePinElement(el);
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
      {/* Control dock: note / shuffle / unlock. stopPropagation keeps the
          click-away handler from closing whatever these open. */}
      <div
        className="absolute bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-1/2 z-20 flex -translate-x-1/2 items-end gap-6"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Each entry point closes anything already open, so the stage stays tidy. */}
        <ControlButton
          emoji="💌"
          label="a note"
          color="bg-[#F9CFCB]"
          onClick={() => {
            setSelected(null);
            setShowUnlock(false);
            setShowNote(true);
          }}
        />
        <ControlButton
          emoji="🎲"
          label="shuffle"
          color="bg-[#CFE3C4]"
          onClick={() => {
            setShowNote(false);
            setShowUnlock(false);
            handleSelect(memories[Math.floor(Math.random() * memories.length)]);
          }}
        />
        <ControlButton
          emoji="🗝️"
          label="unlock"
          color="bg-[#F4E3B2]"
          onClick={() => {
            setSelected(null);
            setShowNote(false);
            setShowUnlock(true);
          }}
        />
      </div>
      {/* Shown when a plain scroll passes over the globe, so the zoom gesture is discoverable. */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-x-0 bottom-20 z-20 flex justify-center transition-opacity duration-300 ${
          zoomHint ? "opacity-100" : "opacity-0"
        }`}
      >
        <span className="font-hand rounded-full bg-[#4A4238]/70 px-4 py-1.5 text-sm text-[#FFFDF8]">
          hold {isMac() ? "⌘" : "ctrl"} + scroll (or pinch) to zoom
        </span>
      </div>
      <div
        className="absolute bottom-6 right-4 z-20 flex flex-col gap-2 md:left-6 md:right-auto"
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
        <MemoryCard
          memory={selected}
          unlocked={unlocked.has(selected.id)}
          onRequestUnlock={() => {
            setSelected(null);
            setShowUnlock(true);
          }}
          onClose={() => setSelected(null)}
        />
      )}
      {showUnlock && (
        <UnlockDialog
          onUnlocked={handleCodeUnlocked}
          onClose={() => setShowUnlock(false)}
        />
      )}
      {showNote && <AuthorNoteDialog onClose={() => setShowNote(false)} />}
    </div>
  );
}
