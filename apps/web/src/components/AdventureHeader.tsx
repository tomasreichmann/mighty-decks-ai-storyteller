import { useEffect, useMemo, useState } from "react";
import { Section } from "./common/Section";
import { Button } from "./common/Button";
import { ShareLinkOverlay } from "./ShareLinkOverlay";
import { cn } from "../utils/cn";

interface AdventureHeaderProps {
  adventureId: string;
  role?: "player" | "screen";
  phase?: string;
  connectionStatus?: "connected" | "reconnecting" | "offline";
}

const connectionStatusMeta: Record<
  NonNullable<AdventureHeaderProps["connectionStatus"]>,
  { label: string; dot: string; text: string; ring: string }
> = {
  connected: {
    label: "Connected",
    dot: "bg-emerald-500",
    text: "text-emerald-700",
    ring: "ring-emerald-200",
  },
  reconnecting: {
    label: "Reconnecting",
    dot: "bg-amber-500",
    text: "text-amber-700",
    ring: "ring-amber-200",
  },
  offline: {
    label: "Offline",
    dot: "bg-rose-500",
    text: "text-rose-700",
    ring: "ring-rose-200",
  },
};

const isLocalHost = (hostname: string): boolean =>
  hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";

const selectShareOrigin = (
  fallbackOrigin: string,
  candidates: string[],
): string => {
  try {
    const fallbackUrl = new URL(fallbackOrigin);
    const parsedCandidates = candidates
      .map((candidate) => {
        try {
          return new URL(candidate);
        } catch {
          return null;
        }
      })
      .filter((candidate): candidate is URL => candidate !== null)
      .filter((candidate) => candidate.protocol === fallbackUrl.protocol);

    const preferredCandidate =
      parsedCandidates.find((candidate) => !isLocalHost(candidate.hostname)) ??
      parsedCandidates[0];

    return preferredCandidate?.origin ?? fallbackOrigin;
  } catch {
    return fallbackOrigin;
  }
};

export const AdventureHeader = ({
  adventureId,
  role,
  phase,
  connectionStatus,
}: AdventureHeaderProps): JSX.Element => {
  const [shareOrigin, setShareOrigin] = useState(() => {
    if (typeof window === "undefined") {
      return "http://localhost:5173";
    }

    return window.location.origin;
  });
  const [activeShareTarget, setActiveShareTarget] = useState<
    "player" | "screen" | null
  >(null);
  const statusMeta = connectionStatus ? connectionStatusMeta[connectionStatus] : null;

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const currentOrigin = window.location.origin;
    setShareOrigin(currentOrigin);
    if (!isLocalHost(window.location.hostname)) {
      return;
    }

    let canceled = false;
    void fetch("/__dev__/share-origins", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          return null;
        }

        const payload = (await response.json()) as { origins?: unknown };
        if (!payload || !Array.isArray(payload.origins)) {
          return null;
        }

        const normalizedOrigins = payload.origins.filter(
          (value): value is string => typeof value === "string",
        );
        return selectShareOrigin(currentOrigin, normalizedOrigins);
      })
      .then((resolvedOrigin) => {
        if (!resolvedOrigin || canceled) {
          return;
        }

        setShareOrigin(resolvedOrigin);
      })
      .catch(() => {
        // Keep the current origin fallback when endpoint is unavailable.
      });

    return () => {
      canceled = true;
    };
  }, []);

  const shareLinks = useMemo(() => {
    return {
      player: `${shareOrigin}/adventure/${adventureId}/player`,
      screen: `${shareOrigin}/adventure/${adventureId}/screen`,
    };
  }, [adventureId, shareOrigin]);

  const shareTitle =
    activeShareTarget === "player" ? "Invite a Player" : "Share Screen";
  const shareUrl = activeShareTarget ? shareLinks[activeShareTarget] : "";

  return (
    <>
      <Section className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs uppercase tracking-wider text-slate-500">Adventure</p>
            {statusMeta ? (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1",
                  statusMeta.text,
                  statusMeta.ring,
                )}
              >
                <span className={cn("h-2 w-2 rounded-full", statusMeta.dot)} />
                {statusMeta.label}
              </span>
            ) : null}
          </div>
          <p className="text-lg font-semibold text-ink">{adventureId}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setActiveShareTarget("player")}
            >
              Invite a Player
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveShareTarget("screen")}
            >
              Share Screen
            </Button>
          </div>
          <div className="text-right text-sm text-slate-600">
            {role ? <p>Role: {role}</p> : null}
            {phase ? <p>Phase: {phase}</p> : null}
          </div>
        </div>
      </Section>
      <ShareLinkOverlay
        open={activeShareTarget !== null}
        title={shareTitle}
        url={shareUrl}
        onClose={() => setActiveShareTarget(null)}
      />
    </>
  );
};

