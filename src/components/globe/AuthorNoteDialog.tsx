"use client";

import { useEffect } from "react";
import { authorNote } from "@/data/authorNote";

type Props = {
  onClose: () => void;
};

export default function AuthorNoteDialog({ onClose }: Props) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-[#4A4238]/30" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-label={authorNote.title}
        onClick={(event) => event.stopPropagation()}
        className="memory-card fixed left-1/2 top-1/2 z-50 w-[min(88vw,22rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-[#FFFDF8] p-6 shadow-xl"
        style={{ rotate: "-1deg" }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close note"
          className="absolute -right-2 -top-2 grid h-8 w-8 place-items-center rounded-full bg-[#E8A5A0] text-[#FFFDF8] shadow-md"
        >
          ✕
        </button>
        <span className="text-4xl">💌</span>
        <h3 className="font-hand mt-2 text-2xl text-[#4A4238]">{authorNote.title}</h3>
        <div className="mt-3 space-y-3">
          {authorNote.paragraphs.map((paragraph, i) => (
            <p key={i} className="text-sm leading-relaxed text-[#4A4238]/80">
              {paragraph}
            </p>
          ))}
        </div>
        <p className="font-hand mt-4 text-xl text-[#4A4238]">{authorNote.signature}</p>
      </div>
    </>
  );
}
