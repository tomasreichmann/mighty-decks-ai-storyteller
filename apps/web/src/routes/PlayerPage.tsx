import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { PlayerSetup } from "@mighty-decks/spec/adventureState";
import { ActionComposer } from "../components/ActionComposer";
import { AdventureHeader } from "../components/AdventureHeader";
import { OutcomeHandPanel } from "../components/cards/OutcomeHandPanel";
import { CharacterSetupForm } from "../components/CharacterSetupForm";
import { ConnectionDiagnostics } from "../components/ConnectionDiagnostics";
import { GenericVotePanel } from "../components/GenericVotePanel";
import { SessionSummaryCard } from "../components/SessionSummaryCard";
import { TranscriptFeed } from "../components/TranscriptFeed";
import { useAdventureSession } from "../hooks/useAdventureSession";
import { cn } from "../utils/cn";
import { Label } from "../components/common/Label";
import { Message } from "../components/common/Message";
import { Text } from "../components/common/Text";
import { createAdventureId } from "../lib/ids";

const formatSetupForDebug = (setup: PlayerSetup | null | undefined): string => {
  if (!setup) {
    return "none";
  }

  return `${setup.characterName} (visual:${setup.visualDescription.length}, pref:${setup.adventurePreference.length})`;
};

export const PlayerPage = (): JSX.Element => {
  const navigate = useNavigate();
  const { adventureId } = useParams<{ adventureId: string }>();

  if (!adventureId) {
    return (
      <main className="app-shell py-10">
        <Text variant="body" className="text-red-700">
          Missing adventureId.
        </Text>
      </main>
    );
  }

  const {
    adventure,
    participant,
    connected,
    connectionError,
    disconnectedDueToInactivity,
    serverUrl,
    serverUrlWarning,
    thinking,
    identity,
    setupDebug,
    submitSetup,
    toggleReady,
    castVote,
    submitAction,
    playOutcomeCard,
    endSession,
    continueAdventure,
    reconnect,
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

    return (
      setup.characterName.trim().length > 0 &&
      setup.visualDescription.trim().length > 0
    );
  }, [participant?.setup]);
  const needsCharacterSetup = !hasCharacterSetup;
  const adventureGenerationInProgress =
    phase === "lobby" &&
    thinking.active &&
    thinking.label.toLowerCase().includes("generating adventure pitches");
  const showLateJoinSetup =
    phase === "play" &&
    !adventure?.activeVote &&
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
    !adventure?.activeOutcomeCheck &&
    hasCharacterSetup;
  const waitingForHighTensionTurn =
    phase === "play" &&
    adventure?.currentScene?.mode === "high_tension" &&
    Boolean(adventure.currentScene.activeActorPlayerId) &&
    adventure.currentScene.activeActorPlayerId !== identity.playerId;
  const activeOutcomeCheck = adventure?.activeOutcomeCheck;
  const activeOutcomeTarget = useMemo(
    () =>
      activeOutcomeCheck
        ? (activeOutcomeCheck.targets.find(
            (entry) => entry.playerId === identity.playerId,
          ) ?? null)
        : null,
    [activeOutcomeCheck, identity.playerId],
  );
  const requiresOutcomeSelection = Boolean(
    activeOutcomeTarget && !activeOutcomeTarget.playedCard,
  );
  const connectionStatus = connected ? "connected" : "reconnecting";
  const showLobbySetup = phase === "lobby" && Boolean(adventure);
  const [showPlayerDebugDetails, setShowPlayerDebugDetails] = useState(false);
  const playerDebugLines = useMemo(() => {
    if (!adventure?.debugMode) {
      return [];
    }

    const rosterSummary = adventure.roster
      .map((entry) =>
        [
          entry.playerId,
          entry.role,
          entry.connected ? "connected" : "disconnected",
          entry.setup ? "setup:yes" : "setup:no",
          `name:${entry.setup?.characterName ?? "-"}`,
        ].join("|"),
      )
      .join(" || ");

    return [
      `identity.playerId=${identity.playerId}`,
      `participant.playerId=${participant?.playerId ?? "missing"}`,
      `phase=${phase}`,
      `activeVote=${adventure.activeVote ? "true" : "false"}`,
      `participant.connected=${participant?.connected ? "true" : "false"}`,
      `hasCharacterSetup=${hasCharacterSetup ? "true" : "false"}`,
      `needsCharacterSetup=${needsCharacterSetup ? "true" : "false"}`,
      `showLateJoinSetup=${showLateJoinSetup ? "true" : "false"}`,
      `participant.setup=${formatSetupForDebug(participant?.setup)}`,
      `cachedSetup=${formatSetupForDebug(setupDebug.cachedSetup)}`,
      `pendingSetupOverride=${formatSetupForDebug(setupDebug.pendingSetupOverride)}`,
      `submitCount=${setupDebug.submitCount}`,
      `autoResubmitCount=${setupDebug.autoResubmitCount}`,
      `lastSubmitAt=${setupDebug.lastSubmitAtIso ?? "never"}`,
      `lastServerSetupAt=${setupDebug.lastServerSetupAtIso ?? "never"}`,
      `roster=${rosterSummary}`,
    ];
  }, [
    adventure,
    hasCharacterSetup,
    identity.playerId,
    needsCharacterSetup,
    participant?.connected,
    participant?.playerId,
    participant?.setup,
    phase,
    setupDebug.autoResubmitCount,
    setupDebug.cachedSetup,
    setupDebug.lastServerSetupAtIso,
    setupDebug.lastSubmitAtIso,
    setupDebug.pendingSetupOverride,
    setupDebug.submitCount,
    showLateJoinSetup,
  ]);

  return (
    <main
      className={cn(
        "app-shell py-6",
        phase === "play"
          ? "flex h-[100dvh] min-h-0 flex-col gap-3"
          : "stack gap-4",
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
        disconnectedDueToInactivity={disconnectedDueToInactivity}
        serverUrl={serverUrl}
        serverUrlWarning={serverUrlWarning}
        onReconnect={reconnect}
        onJoinAdventure={(nextAdventureId) => {
          navigate(`/adventure/${nextAdventureId}/player`);
        }}
      />

      {adventure?.debugMode ? (
        showPlayerDebugDetails ? (
          <Message
            label="Player Debug"
            color="curse"
            onLabelClick={() => setShowPlayerDebugDetails(false)}
            contentClassName="font-mono text-[11px] leading-4 max-h-[200px] overflow-y-auto"
          >
            {playerDebugLines.join("\n")}
            {setupDebug.trace.length > 0
              ? `\n\nsetup_trace:\n${setupDebug.trace.slice(-12).join("\n")}`
              : ""}
          </Message>
        ) : (
          <button
            type="button"
            onClick={() => setShowPlayerDebugDetails(true)}
            className="self-start bg-transparent p-0 text-left"
          >
            <Label variant="curse">Player Debug</Label>
          </button>
        )
      ) : null}

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
        <Message label="System" color="cloth">
          Joining adventure session...
        </Message>
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
          {activeOutcomeCheck && !activeOutcomeTarget ? (
            <Message label="System" color="cloth">
              Waiting for another player to choose an Outcome card before the
              turn resolves.
            </Message>
          ) : null}
          {activeOutcomeTarget?.playedCard ? (
            <Message label="System" color="cloth">
              Your Outcome card is locked in. Waiting for resolution.
            </Message>
          ) : null}
          {adventure?.activeVote ? (
            <GenericVotePanel
              vote={adventure.activeVote}
              onVote={castVote}
              disabled={!canVote}
            />
          ) : null}
          <div className="relative flex-1 basis-[50vh] shrink-0 min-h-[50vh] flex flex-col">
            <TranscriptFeed
              className="h-full"
              entries={adventure?.transcript ?? []}
              scene={adventure?.currentScene}
              scrollable={true}
              autoScrollToBottom={true}
              pendingLabel={thinking.active ? thinking.label : undefined}
            />
          </div>
          <div className="shrink-0 relative">
            <div className="relative">
              <OutcomeHandPanel
                check={activeOutcomeCheck}
                playerId={identity.playerId}
                disabled={!requiresOutcomeSelection}
                onPlayCard={(card) => {
                  if (!activeOutcomeCheck) {
                    return;
                  }

                  playOutcomeCard(activeOutcomeCheck.checkId, card);
                }}
              />
            </div>
            <div
              className={cn(
                "relative z-10 transition-transform duration-300",
                requiresOutcomeSelection ? "-mt-4" : "-mt-7",
              )}
            >
              <ActionComposer
                connected={connected}
                canSend={canSendAction && !waitingForHighTensionTurn}
                allowDrafting={hasCharacterSetup}
                onSend={submitAction}
                onEndSession={!adventure?.closed ? endSession : undefined}
              />
              {waitingForHighTensionTurn ? (
                <Message label="Turn Order" color="cloth">
                  Waiting for{" "}
                  {adventure?.currentScene?.activeActorName ??
                    "the active player"}{" "}
                  to act.
                </Message>
              ) : null}
            </div>
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
            forwardHook={adventure?.sessionForwardHook}
            onContinueAdventure={continueAdventure}
            onStartNewAdventure={() => {
              navigate(`/adventure/${createAdventureId()}/player`);
            }}
          />
        </>
      ) : null}
    </main>
  );
};
