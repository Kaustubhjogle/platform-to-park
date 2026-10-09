import { stations } from "../src/lib/stations.ts";

type OsmElement = { tags?: Record<string, string> };
type Observation = { taxon?: { iconic_taxon_name?: string } };

const natureGroups = new Set(["Plantae", "Aves", "Insecta"]);
const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function fetchJson<T>(url: URL | string): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { Accept: "application/json", "User-Agent": "PlatformToPark-Hacktoberfest/0.1" },
        signal: AbortSignal.timeout(20_000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json() as Promise<T>;
    } catch (error) {
      lastError = error;
      if (attempt < 3) await wait(attempt * 1_000);
    }
  }
  throw lastError;
}

const results: Array<{ station: string; park: string; observations: number; status: "PASS" | "FAIL"; detail: string }> = [];

for (const station of stations) {
  if (!station.verifiedPark) {
    results.push({ station: station.name, park: "Live discovery", observations: 0, status: "PASS", detail: "Already user-verified; park remains dynamically discovered" });
    continue;
  }

  try {
    const park = station.verifiedPark;
    const osm = await fetchJson<{ elements: OsmElement[] }>(`https://api.openstreetmap.org/api/0.6/${park.osmType}/${park.osmId}.json`);
    const tags = osm.elements.findLast((element) => element.tags)?.tags ?? {};
    const isGreenSpace = ["park", "garden", "playground"].includes(tags.leisure ?? "") || tags.landuse === "recreation_ground";
    if (!isGreenSpace) throw new Error("OSM element is not tagged as a supported green space");

    const observationsUrl = new URL("https://api.inaturalist.org/v1/observations");
    observationsUrl.search = new URLSearchParams({ lat: String(park.latitude), lng: String(park.longitude), radius: "1.5", quality_grade: "research", verifiable: "true", per_page: "80" }).toString();
    const observations = await fetchJson<{ results: Observation[] }>(observationsUrl);
    const natureObservationCount = observations.results.filter((observation) => natureGroups.has(observation.taxon?.iconic_taxon_name ?? "")).length;
    if (natureObservationCount === 0) throw new Error("No relevant research-grade iNaturalist observations nearby");

    results.push({ station: station.name, park: tags.name ?? park.name, observations: natureObservationCount, status: "PASS", detail: `${park.osmType}/${park.osmId}` });
  } catch (error) {
    results.push({ station: station.name, park: station.verifiedPark.name, observations: 0, status: "FAIL", detail: error instanceof Error ? error.message : "Unknown verification error" });
  }

  await wait(1_100);
}

console.table(results);
const failures = results.filter((result) => result.status === "FAIL");
if (failures.length > 0) {
  console.error(`\n${failures.length} station option(s) failed verification.`);
  process.exitCode = 1;
} else {
  console.log(`\nAll ${results.length} station options passed verification.`);
}
