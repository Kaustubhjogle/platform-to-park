import { NextRequest, NextResponse } from "next/server";

const MAX_TEXT_LENGTH = 900;

export async function POST(request: NextRequest) {
  const apiKey = process.env.ELEVENLABS_API_KEY?.trim().replace(/^(["'])(.*)\1$/, "$2");

  if (!apiKey) {
    return NextResponse.json(
      { error: "Pocket Mode is not configured on this deployment." },
      { status: 503 },
    );
  }

  let text: unknown;
  try {
    ({ text } = (await request.json()) as { text?: unknown });
  } catch {
    return NextResponse.json({ error: "Invalid narration request." }, { status: 400 });
  }

  if (typeof text !== "string" || !text.trim() || text.length > MAX_TEXT_LENGTH) {
    return NextResponse.json(
      { error: "Mission text must be between 1 and 900 characters." },
      { status: 400 },
    );
  }

  const voiceId = process.env.ELEVENLABS_VOICE_ID ?? "JBFqnCBsd6RMkjVDRZzb";
  const modelId = process.env.ELEVENLABS_MODEL ?? "eleven_flash_v2_5";

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_22050_32`,
      {
        method: "POST",
        headers: {
          Accept: "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
        },
        body: JSON.stringify({
          text: text.trim(),
          model_id: modelId,
          voice_settings: { stability: 0.55, similarity_boost: 0.7 },
        }),
        signal: AbortSignal.timeout(30_000),
      },
    );

    if (!response.ok) {
      const problem = await response.json().catch(() => null) as {
        detail?: { status?: string; message?: string } | string;
      } | null;
      const problemCode = typeof problem?.detail === "object" ? problem.detail.status : undefined;

      if (response.status === 401 || problemCode === "invalid_api_key") {
        return NextResponse.json(
          { error: "ElevenLabs rejected the API key. Create a valid key with Text to Speech access, update ELEVENLABS_API_KEY, then restart the app." },
          { status: 401 },
        );
      }

      if (response.status === 403) {
        return NextResponse.json(
          { error: "This ElevenLabs key cannot use Text to Speech. Check its feature and IP restrictions." },
          { status: 403 },
        );
      }

      if (problemCode === "quota_exceeded" || response.status === 429) {
        return NextResponse.json(
          { error: "The ElevenLabs credit limit has been reached." },
          { status: 429 },
        );
      }

      if (problemCode === "voice_not_found") {
        return NextResponse.json(
          { error: "The configured ElevenLabs voice was not found. Check ELEVENLABS_VOICE_ID." },
          { status: 400 },
        );
      }

      return NextResponse.json(
        { error: "Pocket Mode voice is temporarily unavailable." },
        { status: 502 },
      );
    }

    return new Response(await response.arrayBuffer(), {
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "audio/mpeg",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Pocket Mode voice is temporarily unavailable." },
      { status: 502 },
    );
  }
}
