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

// Photos are placeholders — swap each for the real photo in /public/memories.
const placeholder = (n: number) => `/memories/placeholder-${(n % 5) + 1}.svg`;

const normalPin = (
  id: string,
  lat: number,
  lng: number,
  location: string,
  index: number,
): Memory => ({
  id,
  lat,
  lng,
  location,
  title: `Placeholder: ${location}`,
  caption: "Placeholder caption — swap with the real story.",
  date: "Month 20XX",
  photo: placeholder(index),
});

export const memories: Memory[] = [
  // — United States
  normalPin("philadelphia", 39.953, -75.164, "Philadelphia", 0),
  normalPin("san-francisco", 37.775, -122.419, "San Francisco", 1),
  normalPin("nyc-les", 40.715, -73.986, "Lower East Side, New York", 2),
  normalPin("miami", 25.762, -80.192, "Miami", 3),
  normalPin("rhode-island", 41.58, -71.477, "Rhode Island", 4),
  normalPin("big-sur", 36.27, -121.808, "Big Sur", 5),
  normalPin("pacific-palisades", 34.048, -118.526, "Pacific Palisades", 6),
  normalPin("cupertino", 37.323, -122.032, "Cupertino", 7),
  normalPin("salt-lake-city", 40.761, -111.891, "Salt Lake City", 8),
  normalPin("lake-tahoe", 39.097, -120.032, "Lake Tahoe", 9),
  // — International
  normalPin("singapore-orchard", 1.304, 103.832, "Orchard, Singapore", 10),
  normalPin("hong-kong", 22.28, 114.166, "Upper House, Hong Kong", 11),
  normalPin("niseko", 42.805, 140.687, "Niseko, Japan", 12),
  normalPin("tokyo", 35.68, 139.69, "Tokyo, Japan", 13),
  normalPin("taipei", 25.033, 121.565, "Taipei, Taiwan", 14),
  normalPin("copenhagen", 55.676, 12.568, "Copenhagen", 15),
  normalPin("barcelona", 41.387, 2.17, "Barcelona", 16),
  normalPin("lisbon", 38.722, -9.139, "Lisbon", 17),
  normalPin("puerto-rico", 18.466, -66.106, "Puerto Rico", 18),
  normalPin("cabo", 22.89, -109.917, "Cabo", 19),
  normalPin("dumaguete", 9.307, 123.307, "Dumaguete, Philippines", 20),
  normalPin("punta-fuego", 14.164, 120.588, "Punta Fuego, Philippines", 21),
  normalPin("uptown-bgc", 14.559, 121.055, "Uptown BGC, Philippines", 22),
  normalPin("cdmx", 19.433, -99.133, "CDMX", 23),

  // — Locked
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

  // — Coming soon
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
    id: "amanemu",
    lat: 34.284,
    lng: 136.772,
    location: "Amanemu, Japan",
    title: "Coming soon",
    caption: "A new adventure is brewing.",
    date: "someday soon",
    status: "coming-soon",
  },
];
