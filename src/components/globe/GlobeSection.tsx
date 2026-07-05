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

// Howl's-sky cumulus clouds — decorative DOM, not in-canvas.
function Clouds() {
  const clouds = [
    { style: { top: "8%", left: "5%", "--drift-duration": "70s" }, scale: 1 },
    { style: { top: "16%", right: "8%", "--drift-duration": "95s" }, scale: 0.7 },
    { style: { top: "58%", left: "10%", "--drift-duration": "110s" }, scale: 0.5 },
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
          fill="#FFFDF8"
          opacity="0.8"
        >
          <ellipse cx="60" cy="55" rx="55" ry="24" />
          <ellipse cx="120" cy="42" rx="48" ry="28" />
          <ellipse cx="170" cy="56" rx="45" ry="20" />
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
      className="relative min-h-[85vh] w-full overflow-hidden bg-gradient-to-b from-[#BFDDE8] to-[#F6E7D3]"
    >
      <Clouds />
      <h2 className="font-hand relative z-10 pt-10 text-center text-3xl text-[#4A4238] sm:text-4xl">
        our little world
      </h2>
      <div className="relative z-10 h-[70vh] w-full">
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
