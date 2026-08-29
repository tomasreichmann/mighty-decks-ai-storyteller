import { useCallback, useEffect, useRef, useState } from "react";
import {
  type BackendStatus,
  requestBackendReadiness,
} from "../lib/backendReadiness";
import type { ReadinessResponse } from "@mighty-decks/spec/readiness";

type ReadinessRequest = () => Promise<ReadinessResponse>;

export const useBackendReadiness = (
  initialReadinessPromise: Promise<ReadinessResponse>,
): {
  status: BackendStatus;
  elapsedMs: number;
  retry: () => void;
} => {
  const initialPromiseRef = useRef(initialReadinessPromise);
  const checkIdRef = useRef(0);
  const startedAtRef = useRef(Date.now());
  const [status, setStatus] = useState<BackendStatus>("checking");
  const [elapsedMs, setElapsedMs] = useState(0);

  const check = useCallback((request: ReadinessRequest): void => {
    const checkId = checkIdRef.current + 1;
    checkIdRef.current = checkId;
    startedAtRef.current = Date.now();
    setElapsedMs(0);
    setStatus("checking");

    const wakingTimer = window.setTimeout(() => {
      if (checkIdRef.current === checkId) {
        setStatus("waking");
      }
    }, 2_000);

    void request().then(
      () => {
        if (checkIdRef.current !== checkId) {
          return;
        }
        window.clearTimeout(wakingTimer);
        setElapsedMs(Date.now() - startedAtRef.current);
        setStatus("ready");
      },
      () => {
        if (checkIdRef.current !== checkId) {
          return;
        }
        window.clearTimeout(wakingTimer);
        setElapsedMs(Date.now() - startedAtRef.current);
        setStatus("error");
      },
    );
  }, []);

  useEffect(() => {
    check(() => initialPromiseRef.current);
  }, [check]);

  useEffect(() => {
    if (status === "ready" || status === "error") {
      return;
    }

    const timer = window.setInterval(() => {
      setElapsedMs(Date.now() - startedAtRef.current);
    }, 1_000);

    return () => {
      window.clearInterval(timer);
    };
  }, [status]);

  return {
    status,
    elapsedMs,
    retry: () => check(requestBackendReadiness),
  };
};
