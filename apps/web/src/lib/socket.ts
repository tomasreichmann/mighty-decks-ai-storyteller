import { io, Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "@mighty-decks/spec/events";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

const resolveLocalDevServerUrl = (pageUrl: URL): string => `${pageUrl.protocol}//${pageUrl.hostname}:8080`;

export const resolveServerUrl = (): string => {
  if (typeof window === "undefined") {
    return import.meta.env.VITE_SERVER_URL ?? "http://localhost:8080";
  }

  const pageUrl = new URL(window.location.href);
  const configuredServerUrl = import.meta.env.VITE_SERVER_URL;

  if (configuredServerUrl) {
    try {
      const configuredUrl = new URL(configuredServerUrl, pageUrl.origin);
      // Prevent stale quick-tunnel URLs from breaking local/LAN Vite dev.
      if (
        pageUrl.port === "5173" &&
        configuredUrl.hostname.endsWith(".trycloudflare.com")
      ) {
        return resolveLocalDevServerUrl(pageUrl);
      }
    } catch {
      return configuredServerUrl;
    }

    return configuredServerUrl;
  }

  // Local/LAN dev commonly runs Vite on 5173 and server on 8080.
  if (pageUrl.port === "5173") {
    return resolveLocalDevServerUrl(pageUrl);
  }

  // Deployed single-service setup should use same-origin API + Socket.IO.
  return pageUrl.origin;
};

const isQuickCloudflareTunnel = (serverUrl: string): boolean => {
  try {
    const base = typeof window !== "undefined" ? window.location.href : "http://localhost";
    const parsed = new URL(serverUrl, base);
    return parsed.hostname.endsWith(".trycloudflare.com");
  } catch {
    return false;
  }
};

export const getServerUrlWarning = (serverUrl: string): string | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const pageUrl = new URL(window.location.href);
    const targetUrl = new URL(serverUrl, pageUrl.origin);

    if (pageUrl.protocol === "https:" && targetUrl.protocol === "http:") {
      return "This page is HTTPS but VITE_SERVER_URL uses HTTP. Mobile browsers can block mixed-content connections.";
    }

    if (
      !LOCAL_HOSTS.has(pageUrl.hostname) &&
      LOCAL_HOSTS.has(targetUrl.hostname)
    ) {
      return "Socket server URL points to localhost. Other devices cannot reach localhost on your computer.";
    }
  } catch {
    return "Socket server URL is invalid.";
  }

  return null;
};

export const createSocketClient = (): Socket<ServerToClientEvents, ClientToServerEvents> => {
  const serverUrl = resolveServerUrl();
  const usePollingOnly = isQuickCloudflareTunnel(serverUrl);

  return io(serverUrl, {
    autoConnect: false,
    transports: usePollingOnly ? ["polling"] : ["websocket", "polling"],
    upgrade: !usePollingOnly,
  });
};
