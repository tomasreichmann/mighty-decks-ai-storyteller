import { useEffect, useMemo, useState } from "react";
import { Section } from "./common/Section";
import { Button } from "./common/Button";
import { ShareLinkOverlay } from "./ShareLinkOverlay";
import { cn } from "../utils/cn";
import { Label } from "./common/Label";
import { Text } from "./common/Text";

interface AdventureHeaderProps {
  adventureId: string;
  role?: "player" | "screen";
  phase?: string;
  connectionStatus?: "connected" | "reconnecting" | "offline";
}

const connectionStatusMeta: Record<
  NonNullable<AdventureHeaderProps["connectionStatus"]>,
  { label: string; dot: string; text: string }
> = {
  connected: {
    label: "Connected",
    dot: "bg-kac-monster-dark",
    text: "text-kac-monster-darker",
  },
  reconnecting: {
    label: "Reconnecting...",
    dot: "bg-kac-gold-dark",
    text: "text-kac-gold-darker",
  },
  offline: {
    label: "Offline",
    dot: "bg-kac-blood",
    text: "text-kac-blood-darker",
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

  const shareShortTitle =
    activeShareTarget === "player" ? titles.player.short : titles.screen.short;
  const shareTitle =
    activeShareTarget === "player" ? titles.player.long : titles.screen.long;
  const shareUrl = activeShareTarget ? shareLinks[activeShareTarget] : "";

  return (
    <>
      <Section className="flex flex-wrap items-center relative paper-shadow gap-x-4 gap-y-2">
        <Label rotate variant="gold">
          Adventure {phase}
        </Label>
        <Text as="span" variant="emphasised" color="iron">
          {adventureId}
        </Text>
        {statusMeta ? (
          <Text
            as="span"
            variant="emphasised"
            className={cn(
              "inline-flex items-baseline gap-2 text-base",
              statusMeta.text,
            )}
          >
            <span className={cn("h-3 w-3 rounded-full", statusMeta.dot)} />
            {statusMeta.label}
            {connectionStatus !== "offline" ? <> as {role}</> : null}
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
