import { io, Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "@mighty-decks/spec/events";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
const DEFAULT_LOCAL_DEV_SERVER_PORT = 8081;

const readConfiguredServerUrl = (): string | undefined => import.meta.env?.VITE_SERVER_URL;

const resolveLocalDevServerUrl = (pageUrl: URL): string => {
  // Browsers may resolve "localhost" to ::1, while local server binds on 127.0.0.1.
  const resolvedHost = pageUrl.hostname === "localhost" ? "127.0.0.1" : pageUrl.hostname;
  return `${pageUrl.protocol}//${resolvedHost}:${DEFAULT_LOCAL_DEV_SERVER_PORT}`;
};

export const resolveServerUrlForPageUrl = (
  pageUrl: URL,
  configuredServerUrl?: string,
): string => {
  if (configuredServerUrl) {
    return configuredServerUrl;
  }

  // Local/LAN dev commonly runs Vite on 5173 and server on 8081.
  if (pageUrl.port === "5173") {
    return resolveLocalDevServerUrl(pageUrl);
  }

  // Deployed single-service setup should use same-origin API + Socket.IO.
  return pageUrl.origin;
};

export const resolveServerUrl = (): string => {
  const configuredServerUrl = readConfiguredServerUrl();

  if (typeof window === "undefined") {
    return configuredServerUrl ?? `http://localhost:${DEFAULT_LOCAL_DEV_SERVER_PORT}`;
  }

  const pageUrl = new URL(window.location.href);
  return resolveServerUrlForPageUrl(pageUrl, configuredServerUrl);
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
  return io(serverUrl, {
    autoConnect: false,
    transports: ["polling", "websocket"],
    upgrade: true,
  });
};
