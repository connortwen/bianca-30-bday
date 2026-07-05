import raw from "./memories.generated.json";

export type MemoryStatus = "normal" | "locked" | "coming-soon";

export type Memory = {
  id: string;
  lat: number;
  lng: number;
  location: string; // "Kyoto, Japan"
  title: string;
  caption: string;
  date: string; // display string, e.g. "April 2023"
  photo?: string; // "/memories/kyoto.webp" — required when status is "normal"
  status?: MemoryStatus; // defaults to "normal"
};

// Content is managed in content/memories.csv — edit that file, then run
// `npm run sync` (build, dev, and test do it automatically). Do not edit
// memories.generated.json by hand.
export const memories = raw as Memory[];
