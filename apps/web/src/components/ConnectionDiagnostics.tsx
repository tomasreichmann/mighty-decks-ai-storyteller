import { useEffect, useMemo, useState } from "react";
import { Message } from "./common/Message";
import { Text } from "./common/Text";
import { Button } from "./common/Button";

interface ActiveAdventureSummary {
  adventureId: string;
  phase: string;
  connectedPlayers: number | undefined;
  connectedScreens: number | undefined;
}

interface ConnectionDiagnosticsProps {
  connected: boolean;
  connectionError: string | null;
  disconnectedDueToInactivity: boolean;
  serverUrl: string;
  serverUrlWarning: string | null;
  onJoinAdventure?: (adventureId: string) => void;
  onReconnect?: () => void;
}

export const ConnectionDiagnostics = ({
  connected,
  connectionError,
  disconnectedDueToInactivity,
  serverUrl,
  serverUrlWarning,
  onJoinAdventure,
  onReconnect,
}: ConnectionDiagnosticsProps): JSX.Element | null => {
  const isAdventureCapError =
    connectionError?.toLowerCase().includes("active adventure cap reached") ??
    false;
  const isInactivityDisconnectError =
    connectionError?.toLowerCase().includes("disconnected") &&
    connectionError.toLowerCase().includes("inactivity");
  const showInactivityDisconnectCard =
    !connected &&
    Boolean(disconnectedDueToInactivity || isInactivityDisconnectError);
  const hasIssues =
    !connected || Boolean(connectionError) || Boolean(serverUrlWarning);
  const [activeAdventures, setActiveAdventures] = useState<
    ActiveAdventureSummary[]
  >([]);
  const [loadingAdventures, setLoadingAdventures] = useState(false);
  const [adventureListError, setAdventureListError] = useState<string | null>(
    null,
  );
  const [refreshKey, setRefreshKey] = useState(0);
  const serverOrigin = useMemo(() => {
    try {
      return new URL(serverUrl).origin;
    } catch {
      return null;
    }
  }, [serverUrl]);

  const origin =
    typeof window !== "undefined" ? window.location.origin : "unknown";
  const secureContextLabel =
    typeof window !== "undefined" && window.isSecureContext ? "yes" : "no";

  useEffect(() => {
    if (!isAdventureCapError || !serverOrigin) {
      setActiveAdventures([]);
      setAdventureListError(null);
      setLoadingAdventures(false);
      return;
    }

    let cancelled = false;
    setLoadingAdventures(true);
    setAdventureListError(null);

    void fetch(`${serverOrigin}/adventures`, {
      method: "GET",
      credentials: "include",
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(
            `Could not load active adventures (${response.status}).`,
          );
        }

        const payload = (await response.json()) as {
          adventures?: unknown;
        };
        if (!Array.isArray(payload.adventures)) {
          return [] as ActiveAdventureSummary[];
        }

        return payload.adventures
          .map((entry) => {
            if (!entry || typeof entry !== "object") {
              return null;
            }

            const candidate = entry as Record<string, unknown>;
            const adventureId =
              typeof candidate.adventureId === "string"
                ? candidate.adventureId
                : "";
            if (!adventureId) {
              return null;
            }

            return {
              adventureId,
              phase:
                typeof candidate.phase === "string"
                  ? candidate.phase
                  : "unknown",
              connectedPlayers:
                typeof candidate.connectedPlayers === "number"
                  ? candidate.connectedPlayers
                  : undefined,
              connectedScreens:
                typeof candidate.connectedScreens === "number"
                  ? candidate.connectedScreens
                  : undefined,
            };
          })
          .filter((entry): entry is ActiveAdventureSummary => entry !== null);
      })
      .then((entries) => {
        if (cancelled) {
          return;
        }

        setActiveAdventures(entries);
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }

        setAdventureListError(
          error instanceof Error
            ? error.message
            : "Could not load active adventures.",
        );
      })
      .finally(() => {
        if (cancelled) {
          return;
        }

        setLoadingAdventures(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAdventureCapError, refreshKey, serverOrigin]);

  if (!hasIssues) {
    return null;
  }

  if (showInactivityDisconnectCard) {
    return (
      <Message label="Disconnected" color="curse" className="stack gap-2">
        <Text variant="emphasised" color="curse" className="mt-2">
          You have been disconnected due to inactivity.
        </Text>
        {onReconnect ? (
          <Button
            variant="solid"
            color="cloth"
            size="sm"
            onClick={onReconnect}
            className="self-start"
          >
            Reconnect
          </Button>
        ) : null}
      </Message>
    );
  }

  return (
    <Message
      label="Connection diagnostics"
      color="curse"
      className="stack gap-2"
    >
      {!connected ? (
        <div className="stack gap-2">
          <Text variant="emphasised" color="curse" className="mt-2">
            Not connected to adventure server.
          </Text>
          {onReconnect ? (
            <Button
              variant="solid"
              color="cloth"
              size="sm"
              onClick={onReconnect}
              className="self-start"
            >
              Reconnect
            </Button>
          ) : null}
        </div>
      ) : null}
      {connectionError && !isAdventureCapError ? (
        <Message label="Error" color="curse" className="mt-4">
          {connectionError}
        </Message>
      ) : null}
      {isAdventureCapError ? (
        <div className="stack gap-2">
          <Text variant="emphasised">
            This server's limit for active active adventures has been reached.
            You can join an existing adventure.
          </Text>
          {loadingAdventures ? (
            <Text variant="note" className="normal-case tracking-normal">
              Loading active adventures...
            </Text>
          ) : null}
          {adventureListError ? (
            <Text
              variant="note"
              className="normal-case tracking-normal text-kac-blood"
            >
              {adventureListError}
            </Text>
          ) : null}
          {activeAdventures.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {activeAdventures.map((entry) => (
                <Button
                  key={entry.adventureId}
                  size="sm"
                  variant="solid"
                  color="cloth"
                  onClick={() => {
                    if (onJoinAdventure) {
                      onJoinAdventure(entry.adventureId);
                      return;
                    }

                    if (typeof window !== "undefined") {
                      window.location.assign(`/adventure/${entry.adventureId}`);
                    }
                  }}
                >
                  Join {entry.adventureId}
                </Button>
              ))}
            </div>
          ) : null}
          <Button
            size="sm"
            variant="solid"
            color="bone"
            onClick={() => setRefreshKey((current) => current + 1)}
            disabled={loadingAdventures}
            className="self-start"
          >
            Refresh adventures
          </Button>
        </div>
      ) : null}
      {serverUrlWarning ? (
        <Text variant="body" color="curse" className="text-sm">
          Warning: {serverUrlWarning}
        </Text>
      ) : null}
      {/* TODO: Show only in Debug mode */}
      <div className="mt-2">
        <Text variant="note" color="iron-light">
          Page origin: {origin}
        </Text>
        <Text variant="note" color="iron-light">
          Socket URL: {serverUrl}
        </Text>
        <Text variant="note" color="iron-light">
          Secure context: {secureContextLabel}
        </Text>
      </div>
    </Message>
  );
};
