import type { CampaignDetail } from "@mighty-decks/spec/campaign";
import { Button } from "../common/Button";
import { ConnectionStatusPill } from "../common/ConnectionStatusPill";
import { Message } from "../common/Message";
import { Section } from "../common/Section";
import { Text } from "../common/Text";
import {
  formatSessionCreatedAt,
  resolveSessionStatusTone,
} from "../../lib/authoring/campaignStorytellerSession";

interface CampaignSessionsTabContentProps {
  campaignSlug: string;
  sessions: CampaignDetail["sessions"];
  creatingSession: boolean;
  onCreateSession: () => void;
}

export const CampaignSessionsTabContent = ({
  campaignSlug,
  sessions,
  creatingSession,
  onCreateSession,
}: CampaignSessionsTabContentProps): JSX.Element => {
  return (
    <Section className="stack gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="stack gap-1">
          <Text variant="body" color="iron-light" className="text-sm">
            Each session is a live or archived play instance of this campaign.
          </Text>
        </div>
        <Button
          color="gold"
          disabled={creatingSession}
          onClick={onCreateSession}
        >
          {creatingSession ? "Creating Session..." : "Create Session"}
        </Button>
      </div>
      {sessions.length > 0 ? (
        <div className="grid gap-3">
          {sessions.map((session) => (
            <Message
              key={session.sessionId}
              label={`Session ${session.sessionId}`}
              color="bone"
              contentClassName="stack gap-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Text variant="note" color="steel-dark" className="text-xs">
                  Created: {formatSessionCreatedAt(session.createdAtIso)}
                </Text>
                <ConnectionStatusPill
                  label="Status"
                  status={resolveSessionStatusTone(session.status)}
                  detail={session.status}
                />
              </div>
              <Text variant="body" color="iron-light" className="text-sm">
                Storytellers: {session.storytellerCount} | Players:{" "}
                {session.playerCount}
              </Text>
              <Text variant="body" color="iron-light" className="text-sm">
                {session.transcriptPreview ?? "No transcript yet."}
              </Text>
              <div className="flex flex-wrap gap-2">
                <div className="flex-1" />
                <Button
                  color="gold"
                  href={`/campaign/${encodeURIComponent(campaignSlug)}/session/${encodeURIComponent(session.sessionId)}`}
                >
                  Join
                </Button>
              </div>
            </Message>
          ))}
        </div>
      ) : (
        <Text variant="body" color="iron-light" className="text-sm">
          No sessions have been created yet.
        </Text>
      )}
    </Section>
  );
};
