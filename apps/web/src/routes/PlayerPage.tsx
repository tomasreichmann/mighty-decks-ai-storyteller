import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { ActionComposer } from "../components/ActionComposer";
import { AdventureHeader } from "../components/AdventureHeader";
import { CharacterSetupForm } from "../components/CharacterSetupForm";
import { ConnectionDiagnostics } from "../components/ConnectionDiagnostics";
import { GenericVotePanel } from "../components/GenericVotePanel";
import { SessionSummaryCard } from "../components/SessionSummaryCard";
import { TranscriptFeed } from "../components/TranscriptFeed";
import { useAdventureSession } from "../hooks/useAdventureSession";
import { cn } from "../utils/cn";

export const PlayerPage = (): JSX.Element => {
  const { adventureId } = useParams<{ adventureId: string }>();

  if (!adventureId) {
    return (
      <main className="app-shell py-10">
        <p className="text-red-700">Missing adventureId.</p>
      </main>
    );
  }

  const {
    adventure,
    participant,
    connected,
    connectionError,
    serverUrl,
    serverUrlWarning,
    thinking,
    submitSetup,
    toggleReady,
    castVote,
    submitAction,
    endSession,
  } = useAdventureSession({
    adventureId,
    role: "player",
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
  const hasCharacterSetup = useMemo(() => {
    const setup = participant?.setup;
    if (!setup) {
      return false;
    }

    return setup.characterName.trim().length > 0 && setup.visualDescription.trim().length > 0;
  }, [participant?.setup]);
  const needsCharacterSetup = !hasCharacterSetup;
  const adventureGenerationInProgress =
    phase === "lobby" &&
    thinking.active &&
    thinking.label.toLowerCase().includes("generating adventure pitches");
  const showLateJoinSetup =
    (phase === "vote" || phase === "play") &&
    !adventure?.closed &&
    Boolean(participant?.connected) &&
    needsCharacterSetup;

  const canVote =
    Boolean(adventure?.activeVote) &&
    phase !== "ending" &&
    !adventure?.closed &&
    Boolean(participant?.connected) &&
    !participant?.hasVoted;

  const canSendAction =
    phase === "play" &&
    Boolean(adventure?.currentScene) &&
    !adventure?.closed &&
    !thinking.active &&
    !adventure?.activeVote &&
    hasCharacterSetup;
  const connectionStatus = connected ? "connected" : "reconnecting";
  const showLobbySetup = phase === "lobby" && Boolean(adventure);

  return (
    <main
      className={cn(
        "app-shell py-6",
        phase === "play" ? "flex h-[100dvh] min-h-0 flex-col gap-3" : "stack",
      )}
    >
      <AdventureHeader
        adventureId={adventureId}
        role="player"
        phase={phase}
        connectionStatus={connectionStatus}
      />
      <ConnectionDiagnostics
        connected={connected}
        connectionError={connectionError}
        serverUrl={serverUrl}
        serverUrlWarning={serverUrlWarning}
      />

      {showLobbySetup ? (
        <>
          <CharacterSetupForm
            mode="ready_gate"
            isReady={participant?.ready ?? false}
            connectedPlayers={connectedPlayers}
            readyPlayers={readyPlayers}
            initialSetup={participant?.setup}
            adventureGenerationInProgress={adventureGenerationInProgress}
            onSubmit={submitSetup}
            onToggleReady={toggleReady}
          />
        </>
      ) : null}
      {phase === "lobby" && !adventure ? (
        <section className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          Joining adventure session...
        </section>
      ) : null}

      {showLateJoinSetup ? (
        <CharacterSetupForm
          mode="profile_only"
          isReady={false}
          connectedPlayers={connectedPlayers}
          readyPlayers={readyPlayers}
          initialSetup={participant?.setup}
          onSubmit={submitSetup}
          onToggleReady={toggleReady}
        />
      ) : null}

      {phase === "vote" && adventure?.activeVote ? (
        <GenericVotePanel
          vote={adventure.activeVote}
          onVote={castVote}
          disabled={!canVote}
        />
      ) : null}

      {phase === "play" ? (
        <>
          {adventure?.activeVote ? (
            <GenericVotePanel
              vote={adventure.activeVote}
              onVote={castVote}
              disabled={!canVote}
            />
          ) : null}
          <div className="min-h-0 flex-1">
            <TranscriptFeed
              entries={adventure?.transcript ?? []}
              scene={adventure?.currentScene}
              scrollable={true}
              autoScrollToBottom={true}
              pendingLabel={thinking.active ? thinking.label : undefined}
              className="h-full"
            />
          </div>
          <div className="shrink-0">
            <ActionComposer
              canSend={canSendAction}
              allowDrafting={hasCharacterSetup}
              onSend={submitAction}
              onEndSession={!adventure?.closed ? endSession : undefined}
            />
          </div>
        </>
      ) : null}

      {phase === "ending" ? (
        <>
          <TranscriptFeed
            entries={adventure?.transcript ?? []}
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
