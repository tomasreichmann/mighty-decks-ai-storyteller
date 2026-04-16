import { useEffect, useMemo, useState } from "react";
import type { AiCostMetrics } from "@mighty-decks/spec/adventureState";
import { Section } from "./common/Section";
import { Button } from "./common/Button";
import { ShareLinkOverlay } from "./ShareLinkOverlay";
import { Label } from "./common/Label";
import { Text } from "./common/Text";
import { ConnectionStatusPill } from "./common/ConnectionStatusPill";

interface AdventureHeaderProps {
  adventureId: string;
  role?: "player" | "screen";
  phase?: string;
  connectionStatus?: "connected" | "reconnecting" | "offline";
  costMetrics?: AiCostMetrics;
}

const connectionStatusMeta: Record<
  NonNullable<AdventureHeaderProps["connectionStatus"]>,
  { label: string }
> = {
  connected: {
    label: "Connected",
  },
  reconnecting: {
    label: "Reconnecting...",
  },
  offline: {
    label: "Offline",
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

const titles = {
  player: { short: "🙋‍♂️", long: "Invite Player" },
  screen: { short: "💻", long: "Share Screen" },
};

// OpenRouter usage is denominated in USD-based credits (1 credit ~= $1.00).
const USD_PER_CREDIT = 1;

const formatCredits = (value: number): string => {
  if (value >= 1) {
    return value.toFixed(2);
  }

  if (value >= 0.01) {
    return value.toFixed(4);
  }

  return value.toFixed(6);
};

const formatUsdEstimate = (creditCost: number): string =>
  `$${(creditCost * USD_PER_CREDIT).toFixed(3)}`;

export const AdventureHeader = ({
  adventureId,
  role,
  phase,
  connectionStatus,
  costMetrics,
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

  const shareShortTitle =
    activeShareTarget === "player" ? titles.player.short : titles.screen.short;
  const shareTitle =
    activeShareTarget === "player" ? titles.player.long : titles.screen.long;
  const shareUrl = activeShareTarget ? shareLinks[activeShareTarget] : "";
  const totalCostLabel = costMetrics
    ? `${formatCredits(costMetrics.totalCostCredits)} cr`
    : null;
  const totalUsdEstimateLabel = costMetrics
    ? formatUsdEstimate(costMetrics.totalCostCredits)
    : null;

  return (
    <>
      <Section className="flex flex-wrap items-center relative paper-shadow gap-x-4 gap-y-2">
        <Label rotate color="gold">
          Adventure {phase}
        </Label>
        <Text as="span" variant="emphasised" color="iron">
          {adventureId}
        </Text>
        {statusMeta && connectionStatus ? (
          <ConnectionStatusPill
            status={connectionStatus}
            label={statusMeta.label}
            detail={
              connectionStatus !== "offline" && role ? `as ${role}` : undefined
            }
            className="text-base"
          />
        ) : null}
        {costMetrics && totalCostLabel && totalUsdEstimateLabel ? (
          <Text as="span" variant="note">
            📈 {totalCostLabel} (est. {totalUsdEstimateLabel}) (
            {costMetrics.trackedRequestCount} req
            {costMetrics.missingCostRequestCount > 0
              ? `, ${costMetrics.missingCostRequestCount} missing`
              : ""}
            )
          </Text>
        ) : null}
        <div className="flex-1 shrink-0 basis-auto flex flex-wrap justify-end items-center relative paper-shadow gap-x-4">
          <Button
            variant="solid"
            color="cloth"
            size="sm"
            onClick={() => setActiveShareTarget("player")}
          >
            <span className="hidden md:inline">{titles.player.long}</span>
            <span className="md:hidden">{titles.player.short}</span>
          </Button>
          <Button
            variant="solid"
            color="bone"
            size="sm"
            onClick={() => setActiveShareTarget("screen")}
          >
            <span className="hidden md:inline">{titles.screen.long}</span>
            <span className="md:hidden">{titles.screen.short}</span>
          </Button>
        </div>
      </Section>
      <ShareLinkOverlay
        open={activeShareTarget !== null}
        title={shareTitle}
        shortTitle={shareShortTitle}
        url={shareUrl}
        onClose={() => setActiveShareTarget(null)}
      />
    </>
  );
};
