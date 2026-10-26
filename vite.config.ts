// Vite configuration for TanStack Start
// Handles TanStack devtools, TanStack Start, React, Tailwind CSS, tsConfigPaths, and Nitro build target.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const env = process.env as Record<string, string | undefined>;
const nitroPreset = env["VERCEL"] ? "vercel" : env["NITRO_PRESET"];

const ttsDevPlugin = {
  name: "tts-dev-middleware",
  configureServer(server: any) {
    server.middlewares.use("/api/tts", async (req: any, res: any) => {
      try {
        const { handleTtsRequest } = await server.ssrLoadModule("./src/lib/server-tts.ts");
        const protocol = req.headers["x-forwarded-proto"] || "http";
        const host = req.headers.host || "localhost";
        let body: any = undefined;
        if (req.method === "POST") {
          const buffers: any[] = [];
          for await (const chunk of req) {
            buffers.push(chunk);
          }
          body = Buffer.concat(buffers).toString("utf-8");
        }
        const request = new Request(`${protocol}://${host}/api/tts`, {
          method: req.method,
          headers: req.headers,
          body,
        });
        const response = await handleTtsRequest(request);
        res.statusCode = response.status;
        response.headers.forEach((val: string, key: string) => {
          res.setHeader(key, val);
        });
        const arrayBuf = await response.arrayBuffer();
        res.end(Buffer.from(arrayBuf));
      } catch (e: any) {
        console.error("Vite TTS dev middleware error:", e);
        res.statusCode = 500;
        res.end(JSON.stringify({ fallback: true, error: e?.message }));
      }
    });
  },
};

export default defineConfig({
  plugins: [ttsDevPlugin],
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (SSR error wrapper)
    server: { entry: "server" },
  },
  ...(nitroPreset ? { nitro: { preset: nitroPreset } } : {}),
});
