import type { Plugin } from "vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

const DEV_SHARE_ORIGINS_PATH = "/__dev__/share-origins";

const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, "");

const devShareOriginsPlugin = (): Plugin => {
  let origins: string[] = [];

  const refreshOrigins = (
    localUrls: readonly string[] | undefined,
    networkUrls: readonly string[] | undefined,
  ): void => {
    const nextOrigins = [...(networkUrls ?? []), ...(localUrls ?? [])]
      .map((value) => trimTrailingSlash(value))
      .filter((value) => value.length > 0);
    origins = Array.from(new Set(nextOrigins));
  };

  return {
    name: "dev-share-origins",
    apply: "serve",
    configureServer(server) {
      server.httpServer?.once("listening", () => {
        refreshOrigins(server.resolvedUrls?.local, server.resolvedUrls?.network);
      });

      server.middlewares.use((req, res, next) => {
        const requestPath = req.url?.split("?")[0] ?? "";
        if (requestPath !== DEV_SHARE_ORIGINS_PATH) {
          next();
          return;
        }

        refreshOrigins(server.resolvedUrls?.local, server.resolvedUrls?.network);
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ origins }));
      });
    },
  };
};

export default defineConfig({
  plugins: [
    react(),
    devShareOriginsPlugin(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "Mighty Decks AI Storyteller",
        short_name: "Mighty Decks",
        description: "GM-less text-first AI storyteller for local multiplayer adventures.",
        theme_color: "#111827",
        background_color: "#f3f4f6",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "/favicon.svg",
            sizes: "192x192",
            type: "image/svg+xml",
          },
          {
            src: "/favicon.svg",
            sizes: "512x512",
            type: "image/svg+xml",
          }
        ]
      }
    })
  ],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    allowedHosts: true,
  },
});
