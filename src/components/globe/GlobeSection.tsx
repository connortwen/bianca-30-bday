"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";

// three.js needs window — load the globe client-side only.
const MemoryGlobe = dynamic(() => import("./MemoryGlobe"), {
  ssr: false,
  loading: () => <GlobeStatus message="loading our little world…" />,
});

function GlobeStatus({ message }: { message: string }) {
  return (
    <div className="grid h-full w-full place-items-center">
      <p className="font-hand text-xl text-[#4A4238]/70">{message}</p>
    </div>
  );
}

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

// Cache the check — getSnapshot must return a stable value across renders.
let webglSupport: boolean | undefined;
const subscribeNoop = () => () => {};
const getWebglSnapshot = () => (webglSupport ??= supportsWebGL());
const getWebglServerSnapshot = () => null;

// Howl's-sky cumulus clouds — decorative DOM, not in-canvas. The big one is
// asleep (very Pop Mart of it).
function Clouds() {
  const clouds = [
    { style: { top: "8%", left: "5%", "--drift-duration": "70s" }, scale: 1, face: true },
    { style: { top: "16%", right: "8%", "--drift-duration": "95s" }, scale: 0.7, face: false },
    { style: { top: "58%", left: "10%", "--drift-duration": "110s" }, scale: 0.5, face: false },
    { style: { top: "70%", right: "6%", "--drift-duration": "85s" }, scale: 0.45, face: false },
  ] as const;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
      {clouds.map((cloud, i) => (
        <svg
          key={i}
          className="cloud"
          style={cloud.style as React.CSSProperties}
          width={220 * cloud.scale}
          height={80 * cloud.scale}
          viewBox="0 0 220 80"
          opacity="0.85"
        >
          <g fill="#FFFDF8">
            <ellipse cx="60" cy="55" rx="55" ry="24" />
            <ellipse cx="120" cy="42" rx="48" ry="28" />
            <ellipse cx="170" cy="56" rx="45" ry="20" />
          </g>
          {cloud.face && (
            <g stroke="#4A4238" strokeWidth="2.4" strokeLinecap="round" fill="none" opacity="0.55">
              <path d="M100 48 q5 5 10 0" />
              <path d="M126 48 q5 5 10 0" />
              <path d="M112 57 q6 3 12 0" strokeWidth="2" />
            </g>
          )}
          {cloud.face && (
            <g fill="#E8A5A0" opacity="0.5">
              <circle cx="94" cy="56" r="4.5" />
              <circle cx="144" cy="56" r="4.5" />
            </g>
          )}
        </svg>
      ))}
    </div>
  );
}

// Twinkling sparkles scattered in the sky around the globe.
function Sparkles() {
  const sparkles = [
    { style: { top: "12%", left: "20%", animationDelay: "0s" }, size: 15 },
    { style: { top: "24%", right: "13%", animationDelay: "1.2s" }, size: 11 },
    { style: { top: "48%", left: "6%", animationDelay: "2s" }, size: 13 },
    { style: { top: "70%", right: "20%", animationDelay: "0.7s" }, size: 16 },
    { style: { top: "36%", right: "5%", animationDelay: "1.7s" }, size: 10 },
    { style: { top: "80%", left: "16%", animationDelay: "2.3s" }, size: 12 },
  ] as const;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
      {sparkles.map((s, i) => (
        <svg
          key={i}
          className="sparkle"
          style={s.style as React.CSSProperties}
          width={s.size}
          height={s.size}
          viewBox="0 0 16 16"
          fill="#E9C46A"
        >
          <path d="M8 0 L9.8 6.2 L16 8 L9.8 9.8 L8 16 L6.2 9.8 L0 8 L6.2 6.2 Z" />
        </svg>
      ))}
    </div>
  );
}

export default function GlobeSection() {
  // null on the server, true/false once the client renders.
  const webglOk = useSyncExternalStore(
    subscribeNoop,
    getWebglSnapshot,
    getWebglServerSnapshot,
  );

  return (
    <section
      aria-label="Memory globe"
      className="relative h-dvh w-full snap-start overflow-hidden bg-gradient-to-b from-[#BFDDE8] to-[#F6E7D3]"
    >
      <Clouds />
      <Sparkles />
      <div className="relative z-10 h-full w-full">
        {webglOk === false ? (
          <GlobeStatus message="this globe needs WebGL — try another browser 🌍" />
        ) : webglOk === true ? (
          <MemoryGlobe />
        ) : (
          <GlobeStatus message="loading our little world…" />
        )}
      </div>
    </section>
  );
}
