import { NextRequest, NextResponse } from "next/server";
import { OpenDataMission, stations } from "@/lib/stations";

type OverpassElement = { id: number; type: "node" | "way" | "relation"; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> };
type InatObservation = { taxon?: { preferred_common_name?: string; name?: string; iconic_taxon_name?: string }; species_guess?: string };
type GeneratedMission = { headline: string; action: string; notice: string };

const overpassEndpoints = [
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass-api.de/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

async function fetchParks(query: string) {
  for (const endpoint of overpassEndpoints) {
    try {
      const url = new URL(endpoint);
      url.searchParams.set("data", query);
      const response = await fetch(url, {
        headers: { Accept: "application/json", "User-Agent": "PlatformToPark-Hacktoberfest/0.1" },
        signal: AbortSignal.timeout(18_000),
        next: { revalidate: 600 },
      });
      if (response.ok) return (await response.json()) as { elements: OverpassElement[] };
    } catch {
      // Try the next public Overpass instance.
    }
  }
  throw new Error("All OpenStreetMap query services were unavailable");
}

const toRadians = (value: number) => (value * Math.PI) / 180;
const distanceInM = (fromLat: number, fromLng: number, toLat: number, toLng: number) => {
  const earthRadius = 6_371_000;
  const latitudeDelta = toRadians(toLat - fromLat);
  const longitudeDelta = toRadians(toLng - fromLng);
  const a = Math.sin(latitudeDelta / 2) ** 2 + Math.cos(toRadians(fromLat)) * Math.cos(toRadians(toLat)) * Math.sin(longitudeDelta / 2) ** 2;
  return Math.round(earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

async function generateLocalMission(input: { station: string; line: string; park: string; distanceM: number; species: string[] }) {
  const runtimeUrl = process.env.OLLAMA_URL ?? "http://127.0.0.1:11434";
  const model = process.env.OLLAMA_MODEL ?? "gemma3:1b";
  const response = await fetch(`${runtimeUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(45_000),
    body: JSON.stringify({
      model,
      stream: false,
      format: "json",
      options: { temperature: 0.65 },
      messages: [
        { role: "system", content: "You create tiny, safe outdoor missions for Mumbai commuters. Use only the supplied facts. Never invent opening hours, access, paths, safety, species, or walking directions. Return JSON with exactly three strings: headline, action, notice." },
        { role: "user", content: `Station: ${input.station}\nRail line: ${input.line}\nMapped green space: ${input.park}\nStraight-line distance: ${input.distanceM} metres\nNearby research-grade observations: ${input.species.length ? input.species.join(", ") : "none supplied"}\n\nWrite a headline under 10 words, a two-sentence outdoor action under 45 words, and a notice prompt under 18 words. Make it specific, calm, and screen-light.` },
      ],
    }),
  });
  if (!response.ok) throw new Error(`Local AI returned HTTP ${response.status}`);
  const payload = (await response.json()) as { message?: { content?: string } };
  const generated = JSON.parse(payload.message?.content ?? "") as Partial<GeneratedMission>;
  if (![generated.headline, generated.action, generated.notice].every((value) => typeof value === "string" && value.trim())) throw new Error("Local AI returned an invalid mission");
  return { available: true, runtime: "Ollama" as const, model, headline: generated.headline!.trim(), action: generated.action!.trim(), notice: generated.notice!.trim() };
}

function createOpenDataFallback(input: { station: string; park: string; distanceM: number; species: string[] }): OpenDataMission["ai"] {
  const nearestSpecies = input.species.slice(0, 2);
  return {
    available: false,
    runtime: "Built-in fallback",
    model: "No local model detected",
    headline: `Take a green detour from ${input.station}`,
    action: `Walk toward ${input.park}, roughly ${input.distanceM.toLocaleString()} metres away as a straight-line estimate. Put your phone away for five minutes when you arrive and notice what is living around you.`,
    notice: nearestSpecies.length ? `Look carefully for ${nearestSpecies.join(" or ")}, reported nearby.` : "Notice one plant, bird, or pollinator you usually pass without seeing.",
  };
}

export async function GET(request: NextRequest) {
  const station = stations.find((item) => item.id === request.nextUrl.searchParams.get("station"));
  if (!station) return NextResponse.json({ error: "Unknown station." }, { status: 400 });

  const query = `[out:json][timeout:18];(nwr["leisure"~"^(park|garden|playground)$"](around:1500,${station.latitude},${station.longitude});nwr["landuse"="recreation_ground"](around:1500,${station.latitude},${station.longitude}););out center tags;`;

  try {
    const parkData = station.verifiedPark ? null : await fetchParks(query);
    const discoveredParks = parkData?.elements
      .map((element) => {
        const latitude = element.lat ?? element.center?.lat;
        const longitude = element.lon ?? element.center?.lon;
        if (latitude === undefined || longitude === undefined) return null;
        return { name: element.tags?.name ?? "Unnamed mapped green space", latitude, longitude, distanceM: distanceInM(station.latitude, station.longitude, latitude, longitude), osmUrl: `https://www.openstreetmap.org/${element.type}/${element.id}` };
      })
      .filter((park): park is NonNullable<typeof park> => park !== null)
      .sort((a, b) => a.distanceM - b.distanceM) ?? [];

    const verifiedPark = station.verifiedPark ? {
      name: station.verifiedPark.name,
      latitude: station.verifiedPark.latitude,
      longitude: station.verifiedPark.longitude,
      distanceM: distanceInM(station.latitude, station.longitude, station.verifiedPark.latitude, station.verifiedPark.longitude),
      osmUrl: `https://www.openstreetmap.org/${station.verifiedPark.osmType}/${station.verifiedPark.osmId}`,
    } : null;

    const park = verifiedPark ?? discoveredParks[0];
    if (!park) return NextResponse.json({ error: "No mapped public green spaces were found in this search radius. Try another station." }, { status: 404 });

    const observationUrl = new URL("https://api.inaturalist.org/v1/observations");
    observationUrl.search = new URLSearchParams({ lat: String(park.latitude), lng: String(park.longitude), radius: "1.5", quality_grade: "research", verifiable: "true", per_page: "80", order_by: "observed_on", order: "desc" }).toString();
    const observationsResponse = await fetch(observationUrl, { headers: { "User-Agent": "PlatformToPark-Hacktoberfest/0.1" }, next: { revalidate: 600 } });
    const observations = observationsResponse.ok ? ((await observationsResponse.json()) as { results: InatObservation[] }).results : [];
    const species = [...new Set(observations
      .filter((observation) => ["Plantae", "Aves", "Insecta"].includes(observation.taxon?.iconic_taxon_name ?? ""))
      .map((observation) => observation.taxon?.preferred_common_name ?? observation.taxon?.name ?? observation.species_guess)
      .filter((name): name is string => Boolean(name)))]
      .slice(0, 5);

    let ai: OpenDataMission["ai"];
    try {
      ai = await generateLocalMission({ station: station.name, line: station.line, park: park.name, distanceM: park.distanceM, species });
    } catch {
      ai = createOpenDataFallback({ station: station.name, park: park.name, distanceM: park.distanceM, species });
    }

    const mission: OpenDataMission = { park, species, source: { parks: "OpenStreetMap", observations: "iNaturalist" }, ai };
    return NextResponse.json(mission, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Open data is temporarily unavailable. Please try again shortly." }, { status: 503 });
  }
}
