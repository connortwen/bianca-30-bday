import type { Memory } from "@/data/memories";

// Kawaii sticker-blob faces, Pop-Mart style: soft pastel body, white sticker
// outline, dot eyes, blush cheeks. Each status is a different little guy.
const FACES = {
  // Blushing smiley — a happy memory.
  normal: `<svg viewBox="0 0 32 32" width="100%" height="100%">
    <circle cx="16" cy="16" r="14" fill="#F2A9A4" stroke="#FFFDF8" stroke-width="2.5"/>
    <circle cx="11" cy="14.5" r="1.9" fill="#4A4238"/>
    <circle cx="21" cy="14.5" r="1.9" fill="#4A4238"/>
    <circle cx="8" cy="18.5" r="2.4" fill="#E87F78" opacity="0.5"/>
    <circle cx="24" cy="18.5" r="2.4" fill="#E87F78" opacity="0.5"/>
    <path d="M12.5 19.5 Q16 22.8 19.5 19.5" stroke="#4A4238" stroke-width="1.7" fill="none" stroke-linecap="round"/>
  </svg>`,
  // Fast asleep, dreaming in lavender — wake it with the right code.
  locked: `<svg viewBox="0 0 32 32" width="100%" height="100%">
    <circle cx="16" cy="16" r="14" fill="#C3AEDC" stroke="#FFFDF8" stroke-width="2.5"/>
    <path d="M8.5 15 Q10.5 17 12.5 15" stroke="#4A4238" stroke-width="1.7" fill="none" stroke-linecap="round"/>
    <path d="M19.5 15 Q21.5 17 23.5 15" stroke="#4A4238" stroke-width="1.7" fill="none" stroke-linecap="round"/>
    <circle cx="8" cy="19" r="2.2" fill="#B18CD9" opacity="0.55"/>
    <circle cx="24" cy="19" r="2.2" fill="#B18CD9" opacity="0.55"/>
    <path d="M13.5 20.5 Q16 22 18.5 20.5" stroke="#4A4238" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <text x="22" y="9" font-size="7.5" font-family="sans-serif" font-weight="bold" fill="#4A4238">z</text>
    <text x="26" y="5.5" font-size="5.5" font-family="sans-serif" font-weight="bold" fill="#4A4238" opacity="0.7">z</text>
  </svg>`,
  // Wide awake with heart eyes — a freshly unlocked memory.
  unlocked: `<svg viewBox="0 0 32 32" width="100%" height="100%">
    <circle cx="16" cy="16" r="14" fill="#F2A9A4" stroke="#FFFDF8" stroke-width="2.5"/>
    <path d="M11 12.6 c-1.6-1.5-3.8-0.4-3.3 1.5 c0.4 1.4 2.2 2.5 3.3 3.2 c1.1-0.7 2.9-1.8 3.3-3.2 c0.5-1.9-1.7-3-3.3-1.5z" fill="#E0332C"/>
    <path d="M21 12.6 c-1.6-1.5-3.8-0.4-3.3 1.5 c0.4 1.4 2.2 2.5 3.3 3.2 c1.1-0.7 2.9-1.8 3.3-3.2 c0.5-1.9-1.7-3-3.3-1.5z" fill="#E0332C"/>
    <path d="M12 20.5 Q16 24.5 20 20.5" stroke="#4A4238" stroke-width="1.8" fill="none" stroke-linecap="round"/>
  </svg>`,
  // Dreamy star-eyes — an adventure that hasn't happened yet.
  "coming-soon": `<svg viewBox="0 0 32 32" width="100%" height="100%">
    <circle cx="16" cy="16" r="14" fill="#FFFDF8" stroke="#E8A5A0" stroke-width="2" stroke-dasharray="4 3"/>
    <path d="M11 11.2 l0.9 2.4 2.4 0.9 -2.4 0.9 -0.9 2.4 -0.9 -2.4 -2.4 -0.9 2.4 -0.9z" fill="#E9C46A"/>
    <path d="M21 11.2 l0.9 2.4 2.4 0.9 -2.4 0.9 -0.9 2.4 -0.9 -2.4 -2.4 -0.9 2.4 -0.9z" fill="#E9C46A"/>
    <circle cx="8.5" cy="18.5" r="2" fill="#E8A5A0" opacity="0.45"/>
    <circle cx="23.5" cy="18.5" r="2" fill="#E8A5A0" opacity="0.45"/>
    <path d="M13 20.5 Q16 23 19 20.5" stroke="#4A4238" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  </svg>`,
} as const;

const PIN_VARIANTS = {
  normal: { face: FACES.normal, modifier: "", label: "Open memory" },
  locked: { face: FACES.locked, modifier: "memory-pin--locked", label: "Locked memory" },
  "coming-soon": {
    face: FACES["coming-soon"],
    modifier: "memory-pin--coming-soon",
    label: "Coming soon",
  },
} as const;

// Pins whose coordinates nearly coincide get a small screen-space nudge so
// the stickers fan apart visually — the underlying lat/lng stay honest.
// [x, y] in pixels, applied as margin (translate is owned by the bob animation).
const PIN_NUDGES: Record<string, [number, number]> = {
  "philadelphia": [-16, -12],
  "center-city": [14, 10],
  "440-webster": [-18, -10],
  "alamo-square": [14, 12],
};

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
  dot.innerHTML = variant.face;
  // Stagger the idle bob so pins don't move in lockstep.
  dot.style.animationDelay = `${(memory.id.charCodeAt(0) % 5) * 0.35}s`;
  const nudge = PIN_NUDGES[memory.id];
  if (nudge) {
    dot.style.marginLeft = `${nudge[0]}px`;
    dot.style.marginTop = `${nudge[1]}px`;
  }
  el.appendChild(dot);

  el.addEventListener("click", (event) => {
    event.stopPropagation(); // don't let the globe's click-away handler fire
    onSelect(memory);
  });

  return el;
}

// A locked pin wakes up with heart eyes once its code is entered.
export function wakePinElement(el: HTMLElement) {
  el.classList.remove("memory-pin--locked");
  const dot = el.querySelector(".memory-pin__dot");
  if (dot) dot.innerHTML = FACES.unlocked;
}
