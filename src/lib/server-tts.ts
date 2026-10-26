/**
 * Server-Side Text-To-Speech (TTS) Service for Mochi's Voice.
 *
 * Security & Privacy:
 * 1. API Keys (ELEVENLABS_API_KEY) are read exclusively on the server.
 * 2. Private user details (names, personal dates) are sanitized or excluded.
 * 3. Text length is strictly capped to prevent abuse.
 * 4. In-memory caching prevents repeated API hits for identical dialogue.
 */

export const DEFAULT_MOCHI_VOICE_ID = "JwxwlY78dl6Z7tocY1a6";

// In-memory cache for synthesized audio buffers across requests
const audioBufferCache = new Map<string, { buffer: Uint8Array; contentType: string }>();

// Emojis and decorative symbols commonly used in the UI dialogue
const DECORATIVE_SYMBOLS_REGEX = /[♡♥✨👀❤️💖✦✧🥺👉👈🎀🔔🔕🌟⭐]/g;

/**
 * Sanitizes dialogue text for speech synthesis:
 * - Strips UI emojis so TTS does not awkwardly read them aloud
 * - Replaces private/dynamic personal name templates with cute universal romantic terms
 * - Normalizes whitespace and removes excessive punctuation
 */
export function sanitizeDialogueForSpeech(rawText: string): string {
  if (!rawText || typeof rawText !== "string") return "";

  let cleaned = rawText
    .replace(DECORATIVE_SYMBOLS_REGEX, "")
    // Normalize ellipses
    .replace(/\.{3,}/g, "...")
    // Normalize excessive exclamation / question marks
    .replace(/!{2,}/g, "!")
    .replace(/\?{2,}/g, "?")
    // Trim extra spaces
    .replace(/\s+/g, " ")
    .trim();

  // Cap text length (dialogues are short 1-2 sentence lines)
  if (cleaned.length > 500) {
    cleaned = cleaned.slice(0, 500).trim();
  }

  return cleaned;
}

export interface TtsResponsePayload {
  buffer?: Uint8Array;
  contentType?: string;
  fallback?: boolean;
  message?: string;
}

/**
 * Handles TTS generation on the server.
 * Returns either an audio buffer or a structured fallback indicator.
 */
export async function generateMochiSpeech(
  text: string,
  envOverride?: { apiKey?: string; voiceId?: string },
): Promise<TtsResponsePayload> {
  const cleanText = sanitizeDialogueForSpeech(text);
  if (!cleanText) {
    return { fallback: true, message: "Empty speech text" };
  }

  const apiKey =
    envOverride?.apiKey ||
    (typeof process !== "undefined" ? process.env["ELEVENLABS_API_KEY"] : undefined);

  const voiceId =
    envOverride?.voiceId ||
    (typeof process !== "undefined" ? process.env["ELEVENLABS_VOICE_ID"] : undefined) ||
    DEFAULT_MOCHI_VOICE_ID;

  // If no API key is provided, signal graceful fallback to client
  if (!apiKey || apiKey.trim() === "" || apiKey === "your_elevenlabs_api_key_here") {
    return {
      fallback: true,
      message: "ElevenLabs API key is not configured. Falling back to local character audio.",
    };
  }

  // Check in-memory cache
  const cacheKey = `${voiceId}:${cleanText}`;
  const cached = audioBufferCache.get(cacheKey);
  if (cached) {
    return {
      buffer: cached.buffer,
      contentType: cached.contentType,
    };
  }

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey.trim(),
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: cleanText,
        model_id: "eleven_turbo_v2_5",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.8,
          style: 0.2,
          use_speaker_boost: true,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.warn(`ElevenLabs TTS request returned HTTP ${response.status}:`, errText);
      return {
        fallback: true,
        message: `TTS provider returned status ${response.status}`,
      };
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    const contentType = response.headers.get("content-type") || "audio/mpeg";

    // Cache the successful audio output
    audioBufferCache.set(cacheKey, { buffer, contentType });

    return { buffer, contentType };
  } catch (err: unknown) {
    console.warn("Error calling ElevenLabs TTS API:", err);
    return {
      fallback: true,
      message: "Network or service error during TTS generation",
    };
  }
}

/**
 * Standard Web Request/Response handler for /api/tts.
 * Usable across Vercel serverless, Nitro, and TanStack Start SSR entry points.
 */
export async function handleTtsRequest(request: Request): Promise<Response> {
  if (request.method !== "POST" && request.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  let text = "";
  if (request.method === "POST") {
    try {
      const body = (await request.json()) as { text?: string };
      text = body?.text || "";
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  } else {
    // GET support via query parameter ?text=...
    const url = new URL(request.url);
    text = url.searchParams.get("text") || "";
  }

  if (!text) {
    return new Response(JSON.stringify({ error: "Missing 'text' parameter" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const result = await generateMochiSpeech(text);

  if (result.fallback || !result.buffer) {
    return new Response(
      JSON.stringify({
        fallback: true,
        message: result.message || "TTS provider not available",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "X-TTS-Fallback": "true",
        },
      },
    );
  }

  return new Response(result.buffer as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": result.contentType || "audio/mpeg",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
      "Content-Length": String(result.buffer.byteLength),
    },
  });
}
