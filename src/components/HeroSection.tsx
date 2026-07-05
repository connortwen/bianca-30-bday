// Full-viewport poster hero, BTS-world-tour style: black condensed caps on
// torn red tape strips over white paper, three-circle logo, scroll cue.
export default function HeroSection() {
  return (
    <section
      aria-label="BJW World Tour: Turning Thirty"
      className="relative flex h-dvh w-full snap-start flex-col items-center justify-center bg-[#FDFCF8]"
    >
      <h1 className="font-tour flex flex-col items-center gap-2 text-5xl uppercase sm:gap-3 sm:text-7xl">
        <span className="tape tape-1">BJW</span>
        <span className="tape tape-2">World</span>
        <span className="tape tape-3">Tour</span>
        <span className="tape tape-4">Turning Thirty</span>
      </h1>
      <TourLogo />
      <div className="scroll-hint absolute bottom-8 flex flex-col items-center text-[#161412]">
        <span className="font-tour text-sm uppercase tracking-widest">scroll</span>
        <svg width="22" height="12" viewBox="0 0 22 12" aria-hidden>
          <path d="M1 1 L11 11 L21 1" fill="none" stroke="#161412" strokeWidth="2.5" />
        </svg>
      </div>
    </section>
  );
}

function TourLogo() {
  return (
    <div className="mt-8 flex items-center justify-center gap-4" aria-hidden>
      <svg width="52" height="52" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r="20" fill="#161412" />
      </svg>
      <svg width="52" height="52" viewBox="0 0 44 44">
        <clipPath id="tour-logo-clip">
          <circle cx="22" cy="22" r="20" />
        </clipPath>
        <circle cx="22" cy="22" r="20" fill="#161412" />
        <g clipPath="url(#tour-logo-clip)">
          <rect x="0" y="14.5" width="44" height="5" fill="#FDFCF8" />
          <rect x="0" y="24.5" width="44" height="5" fill="#FDFCF8" />
        </g>
      </svg>
      <svg width="52" height="52" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r="17" fill="none" stroke="#161412" strokeWidth="6" />
        <rect x="11" y="19" width="22" height="6" fill="#161412" />
      </svg>
    </div>
  );
}
