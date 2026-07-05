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

// Placeholder seed data — replace with real memories (photos in /public/memories).
export const memories: Memory[] = [
  {
    id: "tokyo",
    lat: 35.68,
    lng: 139.69,
    location: "Tokyo, Japan",
    title: "Placeholder: Tokyo",
    caption: "Placeholder caption — swap with the real story.",
    date: "Month 20XX",
    photo: "/memories/placeholder-1.svg",
  },
  {
    id: "paris",
    lat: 48.86,
    lng: 2.35,
    location: "Paris, France",
    title: "Placeholder: Paris",
    caption: "Placeholder caption — swap with the real story.",
    date: "Month 20XX",
    photo: "/memories/placeholder-2.svg",
  },
  {
    id: "nyc",
    lat: 40.71,
    lng: -74.01,
    location: "New York, USA",
    title: "Placeholder: New York",
    caption: "Placeholder caption — swap with the real story.",
    date: "Month 20XX",
    photo: "/memories/placeholder-3.svg",
  },
  {
    id: "sydney",
    lat: -33.87,
    lng: 151.21,
    location: "Sydney, Australia",
    title: "Placeholder: a locked memory",
    caption: "Placeholder teaser — this one stays secret for now.",
    date: "Month 20XX",
    status: "locked",
  },
  {
    id: "santorini",
    lat: 36.393,
    lng: 25.461,
    location: "Santorini, Greece",
    title: "Coming soon",
    caption: "A new adventure is brewing.",
    date: "someday soon",
    status: "coming-soon",
  },
  {
    id: "london",
    lat: 51.507,
    lng: -0.128,
    location: "London, England",
    title: "Coming soon",
    caption: "A new adventure is brewing.",
    date: "someday soon",
    status: "coming-soon",
  },
  {
    id: "breakfast-point",
    lat: -33.841,
    lng: 151.11,
    location: "Breakfast Point, Australia",
    title: "Coming soon",
    caption: "A new adventure is brewing.",
    date: "someday soon",
    status: "coming-soon",
  },
  {
    id: "shanghai",
    lat: 31.23,
    lng: 121.474,
    location: "Shanghai, China",
    title: "Coming soon",
    caption: "A new adventure is brewing.",
    date: "someday soon",
    status: "coming-soon",
  },
  {
    id: "hamajima",
    lat: 34.284,
    lng: 136.772,
    location: "Hamajima, Shima, Japan",
    title: "Coming soon",
    caption: "A new adventure is brewing.",
    date: "someday soon",
    status: "coming-soon",
  },
];
