import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";
import type { ProxyOptions } from "vite";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

const DEV_SHARE_ORIGINS_PATH = "/__dev__/share-origins";
const DEFAULT_LOCAL_DEV_SERVER_PORT = 8081;
const REPO_ROOT = fileURLToPath(new URL("../..", import.meta.url));

const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, "");

const normalizePort = (value?: string): number => {
  if (!value) {
    return DEFAULT_LOCAL_DEV_SERVER_PORT;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    return DEFAULT_LOCAL_DEV_SERVER_PORT;
  }

  return parsed;
};

export const resolveLocalDevProxyTarget = (portValue?: string): string =>
  `http://127.0.0.1:${normalizePort(portValue)}`;

const createLocalDevProxy = (
  target: string,
): Record<string, string | ProxyOptions> => ({
  "/adventures": {
    target,
    changeOrigin: true,
  },
  "/api": {
    target,
    changeOrigin: true,
  },
  "/health": {
    target,
    changeOrigin: true,
  },
  "/socket.io": {
    target,
    changeOrigin: true,
    ws: true,
  },
});

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

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, REPO_ROOT, "");
  const proxyTarget = resolveLocalDevProxyTarget(env.PORT);

  return {
    envDir: REPO_ROOT,
    plugins: [
      react(),
      devShareOriginsPlugin(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon.svg"],
        manifest: {
          name: "Mighty Decks AI Storyteller",
          short_name: "Mighty Decks",
          description:
            "GM-less text-first AI storyteller for local multiplayer adventures.",
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
            },
          ],
        },
      }),
    ],
    server: {
      host: true,
      port: 5173,
      strictPort: true,
      allowedHosts: true,
      proxy: createLocalDevProxy(proxyTarget),
    },
  };
});
