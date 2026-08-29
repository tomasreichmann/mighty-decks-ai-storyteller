import {
  readinessResponseSchema,
  type ReadinessResponse,
} from "@mighty-decks/spec/readiness";
import { resolveServerUrl } from "./socket";

export type BackendStatus = "checking" | "waking" | "ready" | "error";

export interface BackendWakeCopy {
  title: string;
  detail: string;
  canRetry: boolean;
}

export const requestBackendReadiness = async (): Promise<ReadinessResponse> => {
  const response = await fetch(new URL("/api/readiness", resolveServerUrl()), {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Readiness failed: ${response.status}`);
  }

  return readinessResponseSchema.parse(await response.json());
};

export const getBackendWakeCopy = (
  status: BackendStatus,
  elapsedMs: number,
): BackendWakeCopy => {
  if (status === "error") {
    return {
      title: "The Storyteller could not be reached",
      detail: "Check your connection, then try waking the server again.",
      canRetry: true,
    };
  }

  if (elapsedMs >= 60_000) {
    return {
      title: "The Storyteller is taking longer than usual",
      detail: "The server may still be waking. Try again to send a fresh request.",
      canRetry: true,
    };
  }

  if (elapsedMs >= 20_000) {
    return {
      title: "Still waking…",
      detail: "Free hosting sometimes needs about a minute after hibernation.",
      canRetry: false,
    };
  }

  if (status === "waking") {
    return {
      title: "The Storyteller is lighting the candles…",
      detail: "The free server may need up to a minute to wake after inactivity.",
      canRetry: false,
    };
  }

  return {
    title: "Loading Mighty Decks AI Storyteller…",
    detail: "Preparing the adventure table…",
    canRetry: false,
  };
};

export const isBackendDependentPath = (pathname: string): boolean =>
  !(
    pathname === "/" ||
    pathname === "/privacy-policy" ||
    pathname === "/terms-of-service" ||
    pathname === "/rules" ||
    pathname.startsWith("/rules/") ||
    pathname === "/styleguide" ||
    pathname.startsWith("/styleguide/")
  );
