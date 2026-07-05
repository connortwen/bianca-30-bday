import type { Memory } from "@/data/memories";

// Builds the DOM element globe.gl renders at each memory's lat/lng.
// Must return a plain HTMLElement (CSS2DRenderer owns the root transform).
const PIN_VARIANTS = {
  normal: { glyph: "♥", modifier: "", label: "Open memory" },
  locked: { glyph: "🔒", modifier: "memory-pin--locked", label: "Locked memory" },
  "coming-soon": { glyph: "✨", modifier: "memory-pin--coming-soon", label: "Coming soon" },
} as const;

export function createPinElement(
  memory: Memory,
  onSelect: (memory: Memory) => void,
): HTMLElement {
  const variant = PIN_VARIANTS[memory.status ?? "normal"];

  const el = document.createElement("button");
  el.type = "button";
  el.className = `memory-pin ${variant.modifier}`.trim();
  el.setAttribute("aria-label", `${variant.label}: ${memory.title}`);

  const dot = document.createElement("span");
  dot.className = "memory-pin__dot";
  dot.textContent = variant.glyph;
  // Stagger the idle bob so pins don't move in lockstep.
  dot.style.animationDelay = `${(memory.id.charCodeAt(0) % 5) * 0.35}s`;
  el.appendChild(dot);

  el.addEventListener("click", (event) => {
    event.stopPropagation(); // don't let the globe's click-away handler fire
    onSelect(memory);
  });

  return el;
}
