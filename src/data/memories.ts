export type Memory = {
  id: string;
  lat: number;
  lng: number;
  location: string; // "Kyoto, Japan"
  title: string;
  caption: string;
  date: string; // display string, e.g. "April 2023"
  photo: string; // "/memories/kyoto.webp"
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
    title: "Placeholder: Sydney",
    caption: "Placeholder caption — swap with the real story.",
    date: "Month 20XX",
    photo: "/memories/placeholder-4.svg",
  },
  {
    id: "lisbon",
    lat: 38.72,
    lng: -9.14,
    location: "Lisbon, Portugal",
    title: "Placeholder: Lisbon",
    caption: "Placeholder caption — swap with the real story.",
    date: "Month 20XX",
    photo: "/memories/placeholder-5.svg",
  },
];
