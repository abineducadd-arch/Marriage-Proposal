import { handleTtsRequest } from "../src/lib/server-tts";

/**
 * Vercel Serverless Function entry point for /api/tts.
 * Handles incoming TTS requests securely on the server side using ELEVENLABS_API_KEY.
 */
export default async function handler(req: any, res?: any) {
  // If invoked with Node-style req and res
  if (res && typeof res.status === "function") {
    try {
      const protocol = req.headers["x-forwarded-proto"] || "http";
      const host = req.headers.host || "localhost";
      const url = `${protocol}://${host}${req.url}`;

      const request = new Request(url, {
        method: req.method,
        headers: req.headers,
        body: req.method === "POST" ? JSON.stringify(req.body) : undefined,
      });

      const response = await handleTtsRequest(request);

      res.status(response.status);
      response.headers.forEach((value: string, key: string) => {
        res.setHeader(key, value);
      });

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      return res.send(buffer);
    } catch (err: unknown) {
      console.error("Vercel serverless TTS handler error:", err);
      return res.status(500).json({ fallback: true, error: "Internal server error" });
    }
  }

  // If invoked with Web Standard Request
  return handleTtsRequest(req);
}
