// Vite configuration for TanStack Start
// Handles TanStack devtools, TanStack Start, React, Tailwind CSS, tsConfigPaths, and Nitro build target.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const env = process.env as Record<string, string | undefined>;
const nitroPreset = env["VERCEL"] ? "vercel" : env["NITRO_PRESET"];

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (SSR error wrapper)
    server: { entry: "server" },
  },
  ...(nitroPreset ? { nitro: { preset: nitroPreset } } : {}),
});
