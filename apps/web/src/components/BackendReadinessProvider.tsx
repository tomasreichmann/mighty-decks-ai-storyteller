import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { ReadinessResponse } from "@mighty-decks/spec/readiness";
import { useBackendReadiness } from "../hooks/useBackendReadiness";
import type { BackendStatus } from "../lib/backendReadiness";

interface BackendReadinessContextValue {
  status: BackendStatus;
  elapsedMs: number;
  retry: () => void;
}

const BackendReadinessContext =
  createContext<BackendReadinessContextValue | null>(null);

export const BackendReadinessProvider = ({
  initialReadinessPromise,
  children,
}: {
  initialReadinessPromise: Promise<ReadinessResponse>;
  children: ReactNode;
}): JSX.Element => {
  const readiness = useBackendReadiness(initialReadinessPromise);
  const value = useMemo(
    () => readiness,
    [readiness.elapsedMs, readiness.retry, readiness.status],
  );

  return (
    <BackendReadinessContext.Provider value={value}>
      {children}
    </BackendReadinessContext.Provider>
  );
};

export const useBackendReadinessContext = (): BackendReadinessContextValue => {
  const context = useContext(BackendReadinessContext);
  if (!context) {
    throw new Error("Backend readiness is unavailable outside its provider.");
  }
  return context;
};
