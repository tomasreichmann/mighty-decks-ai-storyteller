import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AdventureHeader } from "../components/AdventureHeader";
import { ConnectionDiagnostics } from "../components/ConnectionDiagnostics";
import { DebugPanel } from "../components/DebugPanel";
import { GenericVotePanel } from "../components/GenericVotePanel";
import { LatencyMetricsCard } from "../components/LatencyMetricsCard";
import { ReadyGatePanel } from "../components/ReadyGatePanel";
import { RosterList } from "../components/RosterList";
import { RuntimeConfigPanel } from "../components/RuntimeConfigPanel";
import { SessionSummaryCard } from "../components/SessionSummaryCard";
import { TranscriptFeed } from "../components/TranscriptFeed";
import { useAdventureSession } from "../hooks/useAdventureSession";
import { Message } from "../components/common/Message";
import { Text } from "../components/common/Text";
import { Button } from "../components/common/Button";

type TranscriptVerbosity = "full" | "table" | "story";

export const ScreenPage = (): JSX.Element => {
  const navigate = useNavigate();
  const { adventureId } = useParams<{ adventureId: string }>();

  if (!adventureId) {
    return (
      <main className="app-shell py-10 gap-4">
        <Message label="Error" color="curse">
          Missing adventureId.
        </Message>
      </main>
    );
  }

  const {
    adventure,
    connected,
    connectionError,
    serverUrl,
    serverUrlWarning,
    thinking,
    updateRuntimeConfig,
    reconnect,
  } = useAdventureSession({
    adventureId,
    role: "screen",
  });

  const phase = adventure?.phase ?? "lobby";
  const connectedPlayers = useMemo(
    () =>
      adventure?.roster.filter(
        (entry) => entry.role === "player" && entry.connected,
      ).length ?? 0,
    [adventure],
  );
  const readyPlayers = useMemo(
    () =>
      adventure?.roster.filter(
        (entry) => entry.role === "player" && entry.connected && entry.ready,
      ).length ?? 0,
    [adventure],
  );
  const connectionStatus = connected ? "connected" : "reconnecting";
  const showLobbyState = phase === "lobby" && Boolean(adventure);
  const [transcriptVerbosity, setTranscriptVerbosity] =
    useState<TranscriptVerbosity>("table");
  const [showAiRequestDetails, setShowAiRequestDetails] = useState(false);
  const filteredTranscriptEntries = useMemo(() => {
    const entries = adventure?.transcript ?? [];
    if (!adventure?.debugMode || transcriptVerbosity === "full") {
      return entries;
    }

    const withoutAiDebug = entries.filter(
      (entry) => !(entry.kind === "system" && entry.author === "AI Debug"),
    );
    if (transcriptVerbosity === "table") {
      return withoutAiDebug;
    }

    return withoutAiDebug.filter((entry) => entry.kind !== "system");
  }, [adventure?.debugMode, adventure?.transcript, transcriptVerbosity]);

  return (
    <main className="app-shell stack py-6 gap-4">
      <AdventureHeader
        adventureId={adventureId}
        role="screen"
        phase={phase}
        connectionStatus={connectionStatus}
      />
      <ConnectionDiagnostics
        connected={connected}
        connectionError={connectionError}
        serverUrl={serverUrl}
        serverUrlWarning={serverUrlWarning}
        onReconnect={reconnect}
        onJoinAdventure={(nextAdventureId) => {
          navigate(`/adventure/${nextAdventureId}/screen`);
        }}
      />

      {showLobbyState ? (
        <>
          <RosterList roster={adventure?.roster ?? []} />
          <ReadyGatePanel
            connectedPlayers={connectedPlayers}
            readyPlayers={readyPlayers}
          />
        </>
      ) : null}
      {phase === "lobby" && !adventure ? (
        <section className="rounded-md border border-kac-steel/70 bg-kac-steel-light/70 p-4">
          <Text variant="body" color="iron-light" className="text-sm">
            Joining adventure session...
          </Text>
        </section>
      ) : null}

      {phase === "vote" && adventure?.activeVote ? (
        <>
          <GenericVotePanel
            vote={adventure.activeVote}
            onVote={() => undefined}
            disabled={true}
          />
          <RosterList roster={adventure.roster} />
        </>
      ) : null}

      {phase === "play" ? (
        <>
          {adventure?.debugMode ? (
            <Message label="Debug Controls" color="cloth">
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={
                    transcriptVerbosity === "full" ? "solid" : "ghost"
                  }
                  color="cloth"
                  onClick={() => setTranscriptVerbosity("full")}
                >
                  Full Transcript
                </Button>
                <Button
                  size="sm"
                  variant={
                    transcriptVerbosity === "table" ? "solid" : "ghost"
                  }
                  color="cloth"
                  onClick={() => setTranscriptVerbosity("table")}
                >
                  Hide AI Debug
                </Button>
                <Button
                  size="sm"
                  variant={
                    transcriptVerbosity === "story" ? "solid" : "ghost"
                  }
                  color="cloth"
                  onClick={() => setTranscriptVerbosity("story")}
                >
                  Story Only
                </Button>
                <Button
                  size="sm"
                  variant={showAiRequestDetails ? "solid" : "ghost"}
                  color="gold"
                  onClick={() =>
                    setShowAiRequestDetails((current) => !current)
                  }
                >
                  {showAiRequestDetails
                    ? "Hide AI Request Detail"
                    : "Show AI Request Detail"}
                </Button>
              </div>
            </Message>
          ) : null}
          {adventure?.activeVote ? (
            <GenericVotePanel
              vote={adventure.activeVote}
              onVote={() => undefined}
              disabled={true}
            />
          ) : null}
          <TranscriptFeed
            entries={filteredTranscriptEntries}
            scene={adventure?.currentScene}
            pendingLabel={thinking.active ? thinking.label : undefined}
          />
          {adventure ? (
            <RuntimeConfigPanel
              config={adventure.runtimeConfig}
              onApply={updateRuntimeConfig}
            />
          ) : null}
          {adventure ? (
            <LatencyMetricsCard metrics={adventure.latencyMetrics} />
          ) : null}
          {adventure?.debugMode && adventure.debugScene ? (
            <DebugPanel
              debug={adventure.debugScene}
              scene={adventure.currentScene}
              showAiRequestDetails={showAiRequestDetails}
            />
          ) : null}
        </>
      ) : null}

      {phase === "ending" ? (
        <>
          <TranscriptFeed
            entries={filteredTranscriptEntries}
            scene={adventure?.currentScene}
          />
          <SessionSummaryCard
            summary={adventure?.sessionSummary ?? "Session ended."}
          />
        </>
      ) : null}
    </main>
  );
};
