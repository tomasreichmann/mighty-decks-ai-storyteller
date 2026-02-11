import { useEffect, useMemo, useState } from "react";
import { Section } from "./common/Section";
import { Button } from "./common/Button";
import { ShareLinkOverlay } from "./ShareLinkOverlay";
import { cn } from "../utils/cn";
import { Label } from "./common/Label";

interface AdventureHeaderProps {
  adventureId: string;
  role?: "player" | "screen";
  phase?: string;
  connectionStatus?: "connected" | "reconnecting" | "offline";
}

const connectionStatusMeta: Record<
  NonNullable<AdventureHeaderProps["connectionStatus"]>,
  { label: string; dot: string; text: string; ring: string; bg: string }
> = {
  connected: {
    label: "Connected",
    dot: "bg-kac-monster-dark",
    text: "text-kac-monster-dark",
    ring: "ring-kac-monster-dark/25",
    bg: "bg-kac-monster-lightest/75",
  },
  reconnecting: {
    label: "Reconnecting",
    dot: "bg-kac-gold-dark",
    text: "text-kac-gold-darker",
    ring: "ring-kac-gold-dark/30",
    bg: "bg-kac-gold-light/30",
  },
  offline: {
    label: "Offline",
    dot: "bg-kac-blood-light",
    text: "text-kac-blood-dark",
    ring: "ring-kac-blood-light/25",
    bg: "bg-kac-blood-light/25",
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
  const statusMeta = connectionStatus
    ? connectionStatusMeta[connectionStatus]
    : null;

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
      <Section className="flex flex-wrap items-start justify-between gap-3 relative paper-shadow">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Label rotate variant="gold">
              Adventure {phase}
            </Label>
            {statusMeta ? (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1",
                  statusMeta.bg,
                  statusMeta.text,
                  statusMeta.ring,
                )}
              >
                <span className={cn("h-2 w-2 rounded-full", statusMeta.dot)} />
                {statusMeta.label}
                {connectionStatus !== "offline" ? <> as {role}</> : null}
              </span>
            ) : null}
          </div>
          <p className="text-lg font-semibold uppercase tracking-wide text-kac-iron">
            {adventureId}
          </p>
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
