import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import type {
  CampaignDetail,
  CampaignSessionDetail,
  WorldbuildingProposal,
} from "@mighty-decks/spec/campaign";
import { Button } from "../components/common/Button";
import { Message } from "../components/common/Message";
import { Section } from "../components/common/Section";
import { Text } from "../components/common/Text";
import { WorldbuildingBoard } from "../components/worldbuilding/WorldbuildingBoard";
import { useCampaignSession } from "../hooks/useCampaignSession";
import { getCampaignBySlug, getCampaignSession } from "../lib/campaignApi";
import { getCampaignSessionIdentity } from "../lib/campaignSessionIdentity";

const importableKinds = new Set<WorldbuildingProposal["kind"]>([
  "location",
  "actor",
  "asset",
  "encounter",
  "quest",
]);

const canImportProposal = (proposal: WorldbuildingProposal): boolean =>
  importableKinds.has(proposal.kind) &&
  proposal.status !== "rejected" &&
  proposal.status !== "imported";

export const CampaignWorldbuildingResultPage = (): JSX.Element => {
  const { campaignSlug = "", sessionId = "" } = useParams<{
    campaignSlug?: string;
    sessionId?: string;
  }>();
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [loadedSession, setLoadedSession] = useState<CampaignSessionDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedProposalIds, setSelectedProposalIds] = useState<string[]>([]);
  const identity = useMemo(
    () =>
      getCampaignSessionIdentity(
        campaignSlug || "campaign",
        sessionId || "worldbuilding",
        "storyteller",
      ),
    [campaignSlug, sessionId],
  );
  const {
    session,
    connected,
    error,
    campaignUpdatedAtIso,
    ensureSessionRole,
    importWorldbuildingResult,
  } = useCampaignSession({
    campaignSlug,
    sessionId,
    enabled: Boolean(campaignSlug && sessionId),
  });
  const effectiveSession = session ?? loadedSession;
  const worldbuilding = effectiveSession?.worldbuilding ?? null;
  const importableProposals = useMemo(
    () => worldbuilding?.proposals.filter(canImportProposal) ?? [],
    [worldbuilding],
  );

  useEffect(() => {
    if (!connected || !campaignSlug || !sessionId) {
      return;
    }
    ensureSessionRole({
      participantId: identity.participantId,
      displayName: identity.displayName,
      role: "storyteller",
    });
  }, [
    campaignSlug,
    connected,
    ensureSessionRole,
    identity.displayName,
    identity.participantId,
    sessionId,
  ]);

  useEffect(() => {
    if (!campaignSlug || !sessionId) {
      return;
    }
    let cancelled = false;
    setLoadError(null);
    void Promise.all([
      getCampaignBySlug(campaignSlug),
      getCampaignSession(campaignSlug, sessionId),
    ])
      .then(([nextCampaign, nextSession]) => {
        if (cancelled) {
          return;
        }
        setCampaign(nextCampaign);
        setLoadedSession(nextSession);
      })
      .catch((cause) => {
        if (cancelled) {
          return;
        }
        setLoadError(
          cause instanceof Error
            ? cause.message
            : "Could not load the worldbuilding result.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [campaignSlug, campaignUpdatedAtIso, sessionId]);

  useEffect(() => {
    setSelectedProposalIds(importableProposals.map((proposal) => proposal.proposalId));
  }, [importableProposals]);

  const toggleProposal = (proposalId: string): void => {
    setSelectedProposalIds((current) =>
      current.includes(proposalId)
        ? current.filter((candidate) => candidate !== proposalId)
        : [...current, proposalId],
    );
  };

  const handleImport = (): void => {
    if (selectedProposalIds.length === 0) {
      return;
    }
    importWorldbuildingResult(identity.participantId, selectedProposalIds);
  };

  if (!campaignSlug || !sessionId) {
    return (
      <div className="app-shell py-10">
        <Message label="Error" color="blood">
          Missing worldbuilding result route params.
        </Message>
      </div>
    );
  }

  return (
    <div className="flex min-h-full w-full max-w-none flex-1 flex-col gap-4 px-4 py-3 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="stack gap-1">
          <Text variant="h2" color="iron">
            Worldbuilding Result
          </Text>
          <Text variant="body" color="iron-light" className="max-w-3xl text-sm">
            Review the campaign-attached worldbuilding board, then import selected
            proposal cards into campaign content when the result is ready.
          </Text>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {campaign ? (
            <Button href={`/campaign/${campaign.index.slug}/sessions`} color="cloth">
              Sessions
            </Button>
          ) : null}
          <Button
            color="gold"
            disabled={selectedProposalIds.length === 0}
            onClick={handleImport}
          >
            Import Selected
          </Button>
        </div>
      </div>

      {!connected ? (
        <Message label="Connecting" color="cloth">
          Reconnecting to the worldbuilding session.
        </Message>
      ) : null}
      {error ? (
        <Message label="Session Error" color="blood">
          {error}
        </Message>
      ) : null}
      {loadError ? (
        <Message label="Load Error" color="blood">
          {loadError}
        </Message>
      ) : null}

      <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(22rem,1fr)]">
        <WorldbuildingBoard result={worldbuilding} className="min-h-[34rem]" />

        <Section className="stack min-h-0 gap-3 overflow-y-auto">
          <div className="stack gap-1">
            <Text variant="h3" color="iron">
              Proposal Cards
            </Text>
            <Text variant="body" color="iron-light" className="text-sm">
              Imported cards become normal campaign actors, assets, locations,
              encounters, or quests. Theme and motif cards remain result context.
            </Text>
          </div>

          {worldbuilding ? (
            <div className="stack gap-2">
              {worldbuilding.proposals.map((proposal) => {
                const importable = canImportProposal(proposal);
                const selected = selectedProposalIds.includes(proposal.proposalId);
                return (
                  <label
                    key={proposal.proposalId}
                    className="flex cursor-pointer items-start gap-3 rounded-sm border-2 border-kac-iron/15 bg-kac-bone-light/80 p-3 text-kac-iron"
                  >
                    <input
                      type="checkbox"
                      className="mt-1"
                      disabled={!importable}
                      checked={selected}
                      onChange={() => toggleProposal(proposal.proposalId)}
                    />
                    <span className="stack min-w-0 gap-1">
                      <span className="text-xs font-bold uppercase tracking-[0.08em]">
                        {proposal.kind} · {proposal.status}
                      </span>
                      <span className="font-bold">{proposal.title}</span>
                      <span className="text-sm leading-snug text-kac-iron/80">
                        {proposal.summary}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          ) : (
            <Text variant="body" color="iron-light" className="text-sm">
              No worldbuilding result is attached to this session yet.
            </Text>
          )}
        </Section>
      </div>
    </div>
  );
};
