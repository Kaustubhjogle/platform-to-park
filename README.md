# Platform to Park

Turn a Mumbai train stop into one small reason to go outside.

Platform to Park combines verified community data with optional local open-weight generation:

1. OpenStreetMap supplies the station and nearby public green space.
2. iNaturalist supplies research-grade observations around that space.
3. The app always creates a grounded outdoor mission from those facts.
4. If Ollama is available, a local model rewrites it into a more distinctive mission.
5. The user closes the screen and takes the detour.

The model is deliberately prevented from inventing routes, access information, or species. It writes only from the open data supplied in its prompt.

## Why open innovation matters

The selected station and generated mission never need to be sent to a proprietary AI provider. The core open-data experience works without any model. When enabled, Ollama runs AI locally, and the model can be replaced through an environment variable. Neither the maps nor biodiversity layer requires a paid API.

## Run locally

The website works with only Node.js:

```bash
npm install
npm run dev
```

For locally generated AI missions, optionally install [Ollama](https://ollama.com) and download the default small open-weight model:

```bash
ollama pull gemma3:1b
```

Then start Ollama alongside the web app:

```bash
ollama serve
```

Open [http://localhost:3000](http://localhost:3000).

To swap models or use another Ollama host:

```bash
OLLAMA_MODEL=gemma3:4b OLLAMA_URL=http://127.0.0.1:11434 npm run dev
```

## Deploy on Render

The repository includes a Render Blueprint in `render.yaml`. It deploys the full Next.js application as a Node web service in Render's Singapore region and uses `/api/health` for deployment health checks.

1. Push this repository to GitHub, GitLab, or Bitbucket.
2. In Render, choose **New → Blueprint**.
3. Connect the repository and select `render.yaml`.
4. Review the `platform-to-park` service and deploy it.

The public service works through the built-in open-data mission fallback because it cannot reach Ollama running on a visitor's laptop. Local development automatically uses Gemma 3 when Ollama is available. To use hosted Gemma inference later, set `OLLAMA_URL` in Render to a reachable Ollama-compatible service.

## Data maintenance

```bash
npm run verify:data
npm run discover:data
```

`verify:data` checks configured park records against OpenStreetMap and nearby iNaturalist observations. `discover:data` scans the complete configured Mumbai suburban candidate list and prints every station that passes.

## Stack

- Next.js and TypeScript
- Ollama with an open-weight model
- OpenStreetMap
- iNaturalist

No database or paid AI/maps API is required.
