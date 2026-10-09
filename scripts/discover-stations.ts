type Candidate = { id: string; name: string; line: string; kind: "Rail"; latitude?: number; longitude?: number };
import { stations as existingStations } from "../src/lib/stations.ts";
type OsmElement = { id: number; type: "node" | "way" | "relation"; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> };
type Observation = { taxon?: { iconic_taxon_name?: string } };

const westernStations = ["Churchgate", "Marine Lines", "Charni Road", "Grant Road", "Mumbai Central", "Mahalaxmi", "Lower Parel", "Prabhadevi", "Dadar", "Matunga Road", "Mahim Junction", "Bandra", "Khar Road", "Santacruz", "Vile Parle", "Andheri", "Jogeshwari", "Ram Mandir", "Goregaon", "Malad", "Kandivali", "Borivali", "Dahisar", "Mira Road", "Bhayandar", "Naigaon", "Vasai Road", "Nallasopara", "Virar", "Vaitarna", "Saphale", "Kelve Road", "Palghar", "Umroli", "Boisar", "Vangaon", "Dahanu Road"];
const centralStations = ["CSMT", "Masjid", "Sandhurst Road", "Byculla", "Chinchpokli", "Currey Road", "Parel", "Dadar", "Matunga", "Sion", "Kurla", "Vidyavihar", "Ghatkopar", "Vikhroli", "Kanjurmarg", "Bhandup", "Nahur", "Mulund", "Thane", "Kalwa", "Mumbra", "Diva Junction", "Kopar", "Dombivli", "Thakurli", "Kalyan Junction", "Shahad", "Ambivli", "Titwala", "Khadavli", "Vasind", "Asangaon", "Atgaon", "Khardi", "Kasara", "Vithalwadi", "Ulhasnagar", "Ambernath", "Badlapur", "Vangani", "Shelu", "Neral", "Bhivpuri Road", "Karjat", "Kelavli", "Dolavli", "Lowjee", "Khopoli"];
const harbourStations = ["CSMT", "Masjid", "Sandhurst Road", "Dockyard Road", "Reay Road", "Cotton Green", "Sewri", "Wadala Road", "GTB Nagar", "Chunabhatti", "Kurla", "Tilak Nagar", "Chembur", "Govandi", "Mankhurd", "Vashi", "Sanpada", "Juinagar", "Nerul", "Seawoods–Darave", "CBD Belapur", "Kharghar", "Mansarovar", "Khandeshwar", "Panvel", "King's Circle", "Mahim Junction", "Bandra", "Khar Road", "Santacruz", "Vile Parle", "Andheri", "Jogeshwari", "Ram Mandir", "Goregaon"];
const transHarbourStations = ["Thane", "Airoli", "Rabale", "Ghansoli", "Kopar Khairane", "Turbhe", "Sanpada", "Vashi", "Juinagar", "Nerul", "Seawoods–Darave", "CBD Belapur", "Kharghar", "Mansarovar", "Khandeshwar", "Panvel"];
const uranStations = ["Nerul", "Seawoods–Darave", "Belapur CBD", "Bamandongri", "Kharkopar", "Targhar", "Gavhan", "Ranjanpada", "Nhava Sheva", "Dronagiri", "Uran"];

const slugify = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const stationGroups = [
  { names: westernStations, line: "Western Railway" },
  { names: centralStations, line: "Central Railway" },
  { names: harbourStations, line: "Harbour Line" },
  { names: transHarbourStations, line: "Trans-Harbour Line" },
  { names: uranStations, line: "Uran Line" },
];
const longestGroup = Math.max(...stationGroups.map((group) => group.names.length));
const interleavedCandidates: Candidate[] = Array.from({ length: longestGroup }, (_, index) => stationGroups.flatMap((group) => {
  const name = group.names[index];
  return name ? [{ id: slugify(name), name, line: group.line, kind: "Rail" as const }] : [];
})).flat();
const existingStationNames = new Set(existingStations.map((station) => slugify(station.name.replace(/\s*\([^)]*\)/g, ""))));
const candidates = [...interleavedCandidates.reduce((unique, candidate) => {
  if (!unique.has(candidate.id)) unique.set(candidate.id, candidate);
  return unique;
}, new Map<string, Candidate>()).values()].filter((candidate) => !existingStationNames.has(candidate.id));

const overpassEndpoints = ["https://overpass.kumi.systems/api/interpreter", "https://overpass-api.de/api/interpreter", "https://overpass.private.coffee/api/interpreter"];
const natureGroups = new Set(["Plantae", "Aves", "Insecta"]);
const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const toRadians = (value: number) => (value * Math.PI) / 180;
const distanceInM = (aLat: number, aLng: number, bLat: number, bLng: number) => {
  const earthRadius = 6_371_000;
  const latitudeDelta = toRadians(bLat - aLat);
  const longitudeDelta = toRadians(bLng - aLng);
  const a = Math.sin(latitudeDelta / 2) ** 2 + Math.cos(toRadians(aLat)) * Math.cos(toRadians(bLat)) * Math.sin(longitudeDelta / 2) ** 2;
  return Math.round(earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

async function fetchJson<T>(url: URL | string, timeout = 20_000): Promise<T> {
  const response = await fetch(url, { headers: { Accept: "application/json", "User-Agent": "PlatformToPark-Hacktoberfest/0.1" }, signal: AbortSignal.timeout(timeout) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json() as Promise<T>;
}

async function fetchRegionalSnapshot() {
  const bounds = "18.85,72.75,19.45,73.25";
  const query = `[out:json][timeout:60];(nwr["railway"~"^(station|halt)$"]["name"](${bounds});nwr["leisure"~"^(park|garden|playground)$"]["name"](${bounds});nwr["landuse"="recreation_ground"]["name"](${bounds}););out center tags;`;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    for (const endpoint of overpassEndpoints) {
      try {
        const url = new URL(endpoint);
        url.searchParams.set("data", query);
        return (await fetchJson<{ elements: OsmElement[] }>(url, 65_000)).elements;
      } catch {
        // Continue to the next public Overpass instance.
      }
    }
    await wait(attempt * 2_000);
  }
  throw new Error("Regional OpenStreetMap snapshot was unavailable");
}

const normalize = (name: string) => name.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, " ").replace(/\b(railway|station|junction)\b/g, "").replace(/\s+/g, " ").trim();
const aliases: Record<string, string[]> = {
  csmt: ["chhatrapati shivaji maharaj terminus", "chhatrapati shivaji terminus"],
  "gtb-nagar": ["guru tegh bahadur nagar"],
  "cbd-belapur": ["belapur cbd", "belapur"],
  "belapur-cbd": ["cbd belapur", "belapur"],
  "seawoods-darave": ["seawoods darave", "seawoods"],
  "dive-junction": ["diva"],
};

const snapshot = await fetchRegionalSnapshot();
const stationElements = snapshot.filter((element) => ["station", "halt"].includes(element.tags?.railway ?? ""));
const greenElements = snapshot.filter((element) => Boolean(element.tags?.name) && !["private", "no"].includes(element.tags?.access ?? "") && (["park", "garden", "playground"].includes(element.tags?.leisure ?? "") || element.tags?.landuse === "recreation_ground"));

const verified: Array<Record<string, unknown>> = [];
for (const candidate of candidates) {
  try {
    const acceptedNames = [candidate.name, ...(aliases[candidate.id] ?? [])].map(normalize);
    const stationElement = stationElements.find((element) => acceptedNames.includes(normalize(element.tags?.name ?? ""))) ?? stationElements.find((element) => acceptedNames.some((name) => normalize(element.tags?.name ?? "").includes(name) || name.includes(normalize(element.tags?.name ?? ""))));
    const stationLatitude = stationElement?.lat ?? stationElement?.center?.lat;
    const stationLongitude = stationElement?.lon ?? stationElement?.center?.lon;
    if (stationLatitude === undefined || stationLongitude === undefined) throw new Error("station not found in regional OSM snapshot");
    const locatedCandidate = { ...candidate, latitude: stationLatitude, longitude: stationLongitude };
    const parks = greenElements.map((element) => {
      const latitude = element.lat ?? element.center?.lat;
      const longitude = element.lon ?? element.center?.lon;
      if (latitude === undefined || longitude === undefined || !element.tags?.name) return null;
      return { name: element.tags.name, latitude, longitude, osmType: element.type, osmId: element.id, distanceM: distanceInM(stationLatitude, stationLongitude, latitude, longitude) };
    }).filter((park): park is NonNullable<typeof park> => park !== null && park.distanceM <= 1_500).sort((a, b) => a.distanceM - b.distanceM);
    const park = parks[0];
    if (!park) throw new Error("no named green space within 1.5 km");
    const observationsUrl = new URL("https://api.inaturalist.org/v1/observations");
    observationsUrl.search = new URLSearchParams({ lat: String(park.latitude), lng: String(park.longitude), radius: "1.5", quality_grade: "research", verifiable: "true", per_page: "80" }).toString();
    const observations = await fetchJson<{ results: Observation[] }>(observationsUrl);
    const observationCount = observations.results.filter((observation) => natureGroups.has(observation.taxon?.iconic_taxon_name ?? "")).length;
    if (observationCount === 0) throw new Error("no relevant iNaturalist observations");
    verified.push({ ...locatedCandidate, verifiedPark: { name: park.name, latitude: park.latitude, longitude: park.longitude, osmType: park.osmType, osmId: park.osmId }, observations: observationCount, distanceM: park.distanceM });
    console.log(`PASS  ${candidate.name} → ${park.name} (${park.distanceM} m, ${observationCount} observations)`);
  } catch (error) {
    console.log(`SKIP  ${candidate.name} → ${error instanceof Error ? error.message : "unknown error"}`);
  }
  await wait(1_250);
}

console.log("\nVERIFIED_STATIONS_JSON");
console.log(JSON.stringify(verified, null, 2));
if (verified.length === 0) {
  console.error("\nNo station candidates passed verification.");
  process.exitCode = 1;
} else {
  console.log(`\nDiscovered ${verified.length} verified station option(s).`);
}
