"use client";

import { useEffect, useState } from "react";
import { memories } from "@/data/memories";
import { normalizeCode, requestUnlock, sha256Hex } from "@/lib/unlocks";

type Props = {
  onUnlocked: (id: string) => void;
  onClose: () => void;
};

// Central code entry: whichever locked memory the code matches gets unlocked.
export default function UnlockDialog({ onUnlocked, onClose }: Props) {
  const [code, setCode] = useState("");
  const [wrong, setWrong] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const normalized = normalizeCode(code);
    if (!normalized || checking) return;
    setChecking(true);
    const response = await requestUnlock(normalized);
    let id = response.status === "ok" ? response.id : undefined;
    if (response.status === "error") {
      // API unreachable — verify locally against the hashes in the bundle.
      const hash = await sha256Hex(normalized);
      id = memories.find((m) => m.codeHash === hash)?.id;
    }
    setChecking(false);
    if (id) onUnlocked(id);
    else setWrong(true);
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-[#4A4238]/30" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-label="Unlock a memory"
        onClick={(event) => event.stopPropagation()}
        className="memory-card fixed left-1/2 top-1/2 z-50 w-[min(88vw,20rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-[#FFFDF8] p-6 text-center shadow-xl"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute -right-2 -top-2 grid h-8 w-8 place-items-center rounded-full bg-[#E8A5A0] text-[#FFFDF8] shadow-md"
        >
          ✕
        </button>
        <span className="text-4xl">🗝️</span>
        <h3 className="font-hand mt-2 text-2xl text-[#4A4238]">unlock a memory</h3>
        <p className="font-hand mt-1 text-lg text-[#4A4238]/60">
          got a secret code? type it in…
        </p>
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col items-center gap-2">
          <input
            value={code}
            onChange={(event) => {
              setCode(event.target.value);
              setWrong(false);
            }}
            onAnimationEnd={() => setWrong(false)}
            autoFocus
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            placeholder="CODE"
            aria-label="Secret code"
            className={`w-40 rounded-full border-2 border-[#4A4238]/25 bg-[#FFFDF8] px-4 py-2 text-center font-mono text-sm uppercase tracking-[0.2em] text-[#4A4238] outline-none focus:border-[#E9C46A] ${
              wrong ? "card-shake border-[#E8A5A0]" : ""
            }`}
          />
          <button
            type="submit"
            disabled={checking}
            className="font-hand rounded-full bg-[#E8A5A0] px-6 py-2 text-lg text-[#FFFDF8] shadow-sm transition hover:brightness-105 disabled:opacity-60"
          >
            {checking ? "checking…" : "unlock"}
          </button>
          <p
            aria-live="polite"
            className={`font-hand text-sm text-[#4A4238]/60 ${wrong ? "" : "invisible"}`}
          >
            hmm, that&apos;s not it…
          </p>
        </form>
      </div>
    </>
  );
}
