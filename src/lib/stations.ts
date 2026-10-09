export type Station = {
  id: string;
  name: string;
  line: string;
  kind: "Metro" | "Rail";
  latitude: number;
  longitude: number;
  verifiedPark?: {
    name: string;
    latitude: number;
    longitude: number;
    osmType: "node" | "way" | "relation";
    osmId: number;
  };
  fallback: {
    place: string;
    walk: string;
    species: string;
    prompt: string;
  };
};

// Approximate public station coordinates. OpenStreetMap becomes the source of
// nearby green spaces; these seeds only anchor the first radius search.
export const stations: Station[] = [
  { id: "borivali-west", name: "Borivali (West)", line: "Metro Line 2A", kind: "Metro", latitude: 19.2344, longitude: 72.8568, verifiedPark: { name: "Veer Savarkar Udyan", latitude: 19.2266751, longitude: 72.8501015, osmType: "way", osmId: 120521742 }, fallback: { place: "a mapped public garden in Borivali", walk: "Map data is loading", species: "a flowering plant or city bird", prompt: "Find one living thing you have never noticed on this route before." } },
  { id: "andheri", name: "Andheri", line: "Western Railway", kind: "Rail", latitude: 19.1197, longitude: 72.8464, verifiedPark: { name: "Chanai Park", latitude: 19.1216305, longitude: 72.8509955, osmType: "node", osmId: 11389401162 }, fallback: { place: "a mapped public green space near Andheri", walk: "Map data is loading", species: "a butterfly, crow, or flowering plant", prompt: "Pause for a minute with your phone in your pocket and listen for birds." } },
  { id: "churchgate", name: "Churchgate", line: "Western Railway", kind: "Rail", latitude: 18.9352, longitude: 72.8276, verifiedPark: { name: "Cross Maidan Garden", latitude: 18.9336931, longitude: 72.8295239, osmType: "way", osmId: 1288957913 }, fallback: { place: "a mapped garden near Fort", walk: "Map data is loading", species: "a tree, insect, or urban bird", prompt: "Take the long way once: notice three shades of green before you return." } },
  { id: "ghatkopar", name: "Ghatkopar", line: "Metro Line 1", kind: "Metro", latitude: 19.0869, longitude: 72.9081, fallback: { place: "a mapped public garden near Ghatkopar", walk: "Map data is loading", species: "a leaf, bird, or pollinator", prompt: "Look up for canopy, not down at notifications, for the next five minutes." } },
  { id: "dadar", name: "Dadar", line: "Western Railway", kind: "Rail", latitude: 19.0181, longitude: 72.8431, verifiedPark: { name: "Shivaji Park", latitude: 19.0272788, longitude: 72.8383977, osmType: "way", osmId: 113711205 }, fallback: { place: "a mapped public green space near Dadar", walk: "Map data is loading", species: "a city bird, tree, or butterfly", prompt: "Trade ten minutes of scrolling for ten minutes under an open sky." } },
  { id: "matunga-road", name: "Matunga Road", line: "Western Railway", kind: "Rail", latitude: 19.0273, longitude: 72.8464, verifiedPark: { name: "Garden D, Five Gardens", latitude: 19.0195374, longitude: 72.8537881, osmType: "way", osmId: 956193101 }, fallback: { place: "a mapped public garden near Matunga", walk: "Map data is loading", species: "a flowering tree or urban bird", prompt: "Notice one tree closely enough that you could recognise it tomorrow." } },
  { id: "vashi", name: "Vashi", line: "Harbour Line", kind: "Rail", latitude: 19.0631, longitude: 72.9986, verifiedPark: { name: "Jijamata Udyan", latitude: 19.0704347, longitude: 72.9960453, osmType: "node", osmId: 11422181454 }, fallback: { place: "a mapped public green space near Vashi", walk: "Map data is loading", species: "a wetland bird, insect, or plant", prompt: "Look for evidence that the city and the creek ecosystem overlap." } },
  { id: "csmt", name: "CSMT", line: "Central Railway", kind: "Rail", latitude: 18.9408329, longitude: 72.831861, verifiedPark: { name: "Azad Maidan", latitude: 18.9406482, longitude: 72.8312509, osmType: "relation", osmId: 20401140 }, fallback: { place: "Azad Maidan", walk: "Map data is loading", species: "a city bird, tree, or butterfly", prompt: "Step away from the rush and notice what shares this historic open space with you." } },
  { id: "thane", name: "Thane", line: "Central / Trans-Harbour", kind: "Rail", latitude: 19.186483, longitude: 72.9757664, verifiedPark: { name: "Hariyali Park", latitude: 19.185341, longitude: 72.9779251, osmType: "way", osmId: 883701454 }, fallback: { place: "Hariyali Park", walk: "Map data is loading", species: "a city bird, flowering plant, or butterfly", prompt: "Find one pocket of calm within sight of the city." } },
  { id: "nerul", name: "Nerul", line: "Harbour / Uran Line", kind: "Rail", latitude: 19.0335798, longitude: 73.0181584, verifiedPark: { name: "Annabhau Sathe Park", latitude: 19.0353694, longitude: 73.019987, osmType: "way", osmId: 563568596 }, fallback: { place: "Annabhau Sathe Park", walk: "Map data is loading", species: "a bird, insect, or flowering plant", prompt: "Spend five minutes following one sound from the park." } },
  { id: "marine-lines", name: "Marine Lines", line: "Western Railway", kind: "Rail", latitude: 18.945764, longitude: 72.8237193, verifiedPark: { name: "Shri Bhagwandas Todi Children Park", latitude: 18.9435924, longitude: 72.824318, osmType: "way", osmId: 97371054 }, fallback: { place: "Shri Bhagwandas Todi Children Park", walk: "Map data is loading", species: "a tree, insect, or coastal city bird", prompt: "Look for a living detail you would usually pass at commuter speed." } },
  { id: "masjid", name: "Masjid", line: "Central / Harbour", kind: "Rail", latitude: 18.9522949, longitude: 72.8381771, verifiedPark: { name: "SK Nizam Park", latitude: 18.949838, longitude: 72.8397419, osmType: "node", osmId: 3202779969 }, fallback: { place: "SK Nizam Park", walk: "Map data is loading", species: "a city bird, leaf, or pollinator", prompt: "Pause long enough to notice how nature fits into one of Mumbai’s busiest neighbourhoods." } },
  { id: "airoli", name: "Airoli", line: "Trans-Harbour Line", kind: "Rail", latitude: 19.1585231, longitude: 72.9994023, verifiedPark: { name: "Mindspace Garden", latitude: 19.1615587, longitude: 73.0024942, osmType: "way", osmId: 363282664 }, fallback: { place: "Mindspace Garden", walk: "Map data is loading", species: "a butterfly, bird, or flowering plant", prompt: "Find three different leaf shapes before returning to your route." } },
  { id: "seawoods-darave", name: "Seawoods–Darave", line: "Harbour / Uran Line", kind: "Rail", latitude: 19.0218192, longitude: 73.0191588, verifiedPark: { name: "Millenium Park", latitude: 19.0231333, longitude: 73.0215903, osmType: "way", osmId: 221347962 }, fallback: { place: "Millenium Park", walk: "Map data is loading", species: "a wetland bird, insect, or native plant", prompt: "Look for one sign that Navi Mumbai’s wetlands are close by." } },
  { id: "charni-road", name: "Charni Road", line: "Western Railway", kind: "Rail", latitude: 18.9518437, longitude: 72.8182401, verifiedPark: { name: "Bal Bhavan", latitude: 18.9524953, longitude: 72.8169128, osmType: "way", osmId: 288444822 }, fallback: { place: "Bal Bhavan", walk: "Map data is loading", species: "a tree, butterfly, or coastal bird", prompt: "Take one slow lap and notice how the air changes near the green space." } },
  { id: "sandhurst-road", name: "Sandhurst Road", line: "Central / Harbour", kind: "Rail", latitude: 18.9609243, longitude: 72.8393719, verifiedPark: { name: "Sitaram Shinoy Garden", latitude: 18.9616323, longitude: 72.8379518, osmType: "way", osmId: 72547777 }, fallback: { place: "Sitaram Shinoy Garden", walk: "Map data is loading", species: "a city bird, flowering plant, or insect", prompt: "Find the smallest living thing you can spot without touching it." } },
  { id: "rabale", name: "Rabale", line: "Trans-Harbour Line", kind: "Rail", latitude: 19.1366355, longitude: 73.0027822, verifiedPark: { name: "Airoli Sector 6 Garden", latitude: 19.1449005, longitude: 72.9978122, osmType: "way", osmId: 363282651 }, fallback: { place: "Airoli Sector 6 Garden", walk: "Map data is loading", species: "a butterfly, bird, or flowering plant", prompt: "Use the longer walk to identify one plant you have seen but never named." } },
];

export type OpenDataMission = {
  park: { name: string; latitude: number; longitude: number; distanceM: number; osmUrl: string };
  species: string[];
  source: { parks: "OpenStreetMap"; observations: "iNaturalist" };
  ai: {
    available: boolean;
    runtime: "Ollama" | "Built-in fallback";
    model: string;
    headline: string;
    action: string;
    notice: string;
  };
};
