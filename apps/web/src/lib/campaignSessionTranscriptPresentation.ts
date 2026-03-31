import type {
  CampaignSessionParticipant,
  CampaignSessionParticipantRole,
  CampaignSessionTranscriptEntry,
} from "@mighty-decks/spec/campaign";
import type { MessageColor } from "../components/common/Message";

export interface PresentedCampaignSessionTranscriptEntry {
  label: string;
  color: MessageColor;
  text: string;
  align: "start" | "end";
}

interface PresentCampaignSessionTranscriptEntryOptions {
  entry: CampaignSessionTranscriptEntry;
  participants?: readonly CampaignSessionParticipant[];
  currentParticipantId?: string;
}

interface SessionParticipantPresentation {
  color: MessageColor;
  align: "start" | "end";
}

interface ResolvedParticipantPresentation extends SessionParticipantPresentation {
  label: string;
}

const participantJoinedPattern =
  /^(?<displayName>.+?) (?<mock>mock )?joined as (?<role>player|storyteller)\.$/;
const participantLeftPattern = /^(?<displayName>.+?) left the session\.$/;
const participantClaimedPattern = /^(?<displayName>.+?) claimed (?<target>.+)\.$/;
const participantCreatedPattern = /^(?<displayName>.+?) created (?<target>.+)\.$/;

const normalizeSessionParticipantRole = (
  value: string | undefined,
): CampaignSessionParticipantRole | null => {
  if (value === "player" || value === "storyteller") {
    return value;
  }

  return null;
};

const normalizeDisplayName = (value: string): string =>
  value.trim().replace(/\s+/g, " ").toLocaleLowerCase();

const resolveParticipantPresentation = (
  role: CampaignSessionParticipantRole | undefined,
  isCurrentParticipant: boolean,
): SessionParticipantPresentation => {
  if (role === "storyteller") {
    return {
      color: "gold",
      align: isCurrentParticipant ? "end" : "start",
    };
  }

  if (role === "player") {
    return {
      color: isCurrentParticipant ? "fire" : "fire-lightest",
      align: isCurrentParticipant ? "end" : "start",
    };
  }

  return {
    color: "cloth",
    align: "start",
  };
};

const resolveNamedParticipantPresentation = (
  displayName: string,
  role: CampaignSessionParticipantRole | undefined,
  participants: readonly CampaignSessionParticipant[],
  currentParticipantId: string | undefined,
): ResolvedParticipantPresentation => {
  const normalizedDisplayName = normalizeDisplayName(displayName);
  const matchingParticipants = participants.filter((participant) => {
    if (normalizeDisplayName(participant.displayName) !== normalizedDisplayName) {
      return false;
    }

    return !role || participant.role === role;
  });
  const currentMatch = matchingParticipants.find(
    (participant) => participant.participantId === currentParticipantId,
  );
  const resolvedParticipant = currentMatch ?? matchingParticipants[0];
  const presentation = resolveParticipantPresentation(
    role ?? resolvedParticipant?.role,
    resolvedParticipant?.participantId === currentParticipantId,
  );

  return {
    label: displayName,
    ...presentation,
  };
};

const presentKnownSystemEntry = (
  entry: CampaignSessionTranscriptEntry,
  participants: readonly CampaignSessionParticipant[],
  currentParticipantId: string | undefined,
): PresentedCampaignSessionTranscriptEntry | null => {
  const joinedMatch = entry.text.match(participantJoinedPattern);
  if (joinedMatch?.groups) {
    const role = normalizeSessionParticipantRole(joinedMatch.groups.role);
    const presentation = resolveNamedParticipantPresentation(
      joinedMatch.groups.displayName,
      role ?? undefined,
      participants,
      currentParticipantId,
    );

    return {
      ...presentation,
      text: joinedMatch.groups.mock ? "Joined (mock)" : "Joined",
    };
  }

  const leftMatch = entry.text.match(participantLeftPattern);
  if (leftMatch?.groups) {
    const presentation = resolveNamedParticipantPresentation(
      leftMatch.groups.displayName,
      undefined,
      participants,
      currentParticipantId,
    );

    return {
      ...presentation,
      text: "Left",
    };
  }

  const claimedMatch = entry.text.match(participantClaimedPattern);
  if (claimedMatch?.groups) {
    const presentation = resolveNamedParticipantPresentation(
      claimedMatch.groups.displayName,
      undefined,
      participants,
      currentParticipantId,
    );

    return {
      ...presentation,
      text: `Claimed ${claimedMatch.groups.target}`,
    };
  }

  const createdMatch = entry.text.match(participantCreatedPattern);
  if (createdMatch?.groups) {
    const presentation = resolveNamedParticipantPresentation(
      createdMatch.groups.displayName,
      undefined,
      participants,
      currentParticipantId,
    );

    return {
      ...presentation,
      text: `Created ${createdMatch.groups.target}`,
    };
  }

  return null;
};

export const presentCampaignSessionTranscriptEntry = ({
  entry,
  participants = [],
  currentParticipantId,
}: PresentCampaignSessionTranscriptEntryOptions): PresentedCampaignSessionTranscriptEntry => {
  if (entry.kind === "group_message") {
    const presentation = resolveParticipantPresentation(
      entry.authorRole,
      entry.participantId === currentParticipantId,
    );

    return {
      label: entry.authorDisplayName ?? "Player",
      color: presentation.color,
      text: entry.text,
      align: presentation.align,
    };
  }

  const knownSystemPresentation = presentKnownSystemEntry(
    entry,
    participants,
    currentParticipantId,
  );
  if (knownSystemPresentation) {
    return knownSystemPresentation;
  }

  return {
    label: "System",
    color: "cloth",
    text: entry.text,
    align: "start",
  };
};
