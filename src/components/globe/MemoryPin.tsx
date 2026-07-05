import type { Memory } from "@/data/memories";

// Builds the DOM element globe.gl renders at each memory's lat/lng.
// Must return a plain HTMLElement (CSS2DRenderer owns the root transform).
export function createPinElement(
  memory: Memory,
  onSelect: (memory: Memory) => void,
): HTMLElement {
  const el = document.createElement("button");
  el.type = "button";
  el.className = "memory-pin";
  el.setAttribute("aria-label", `Open memory: ${memory.title}`);

  const dot = document.createElement("span");
  dot.className = "memory-pin__dot";
  dot.textContent = "♥";
  // Stagger the idle bob so pins don't move in lockstep.
  dot.style.animationDelay = `${(memory.id.charCodeAt(0) % 5) * 0.35}s`;
  el.appendChild(dot);

  el.addEventListener("click", (event) => {
    event.stopPropagation(); // don't let the globe's click-away handler fire
    onSelect(memory);
  });

  return el;
}
