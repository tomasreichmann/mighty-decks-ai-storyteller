import type { KeyboardEvent, ReactNode } from "react";
import type {
  CampaignDetail,
  CampaignSessionDetail,
  CampaignSessionTableTarget,
} from "@mighty-decks/spec/campaign";
import { CampaignSessionTranscriptFeed } from "../CampaignSessionTranscriptFeed";
import { Button } from "../common/Button";
import { DepressedInput } from "../common/DepressedInput";
import { Message } from "../common/Message";
import { Section } from "../common/Section";
import { Text } from "../common/Text";
import { CampaignSessionChatLayout } from "../session/CampaignSessionChatLayout";
import { CampaignSessionTable } from "../session/CampaignSessionTable";
import type { GameCardCatalogContextValue } from "../../lib/gameCardCatalogContext";

interface CampaignStorytellerSessionTabContentProps {
  campaign: CampaignDetail;
  session: CampaignSessionDetail | null;
  currentParticipantId?: string;
  storytellerRealtimeError: string | null;
  tableSelectionCount: number;
  chatDraft: string;
  messageInputTopRightControl: ReactNode;
  gameCardCatalogValue: GameCardCatalogContextValue;
  onChatDraftChange: (nextValue: string) => void;
  onStorytellerMessageKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onSendSelectionToTarget: (target: CampaignSessionTableTarget) => void;
  onRemoveStorytellerTableCard: (entryId: string) => void;
  onCloseSession: () => void;
  onSendMessage: () => void;
}

export const CampaignStorytellerSessionTabContent = ({
  campaign,
  session,
  currentParticipantId,
  storytellerRealtimeError,
  tableSelectionCount,
  chatDraft,
  messageInputTopRightControl,
  gameCardCatalogValue,
  onChatDraftChange,
  onStorytellerMessageKeyDown,
  onSendSelectionToTarget,
  onRemoveStorytellerTableCard,
  onCloseSession,
  onSendMessage,
}: CampaignStorytellerSessionTabContentProps): JSX.Element => {
  const sessionClosed = session?.status === "closed";

  return (
    <Section className="stack min-h-0 flex-1 gap-4 overflow-hidden">
      {storytellerRealtimeError ? (
        <Message label="Session Error" color="blood">
          {storytellerRealtimeError}
        </Message>
      ) : null}

      <CampaignSessionChatLayout
        tablePane={
          <CampaignSessionTable
            campaign={campaign}
            session={session}
            viewerRole="storyteller"
            currentParticipantId={currentParticipantId}
            hasStagedCards={tableSelectionCount > 0}
            onSendCardsToTarget={onSendSelectionToTarget}
            onRemoveEntry={onRemoveStorytellerTableCard}
            className="mx-2 sm:mx-3"
          />
        }
        chatPane={
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overflow-x-hidden px-2 sm:px-3">
            <CampaignSessionTranscriptFeed
              entries={session?.transcript ?? []}
              participants={session?.participants ?? []}
              currentParticipantId={currentParticipantId}
              gameCardCatalogValue={gameCardCatalogValue}
              className="min-h-[16rem] flex-1"
            />

            <div className="stack gap-2">
              <DepressedInput
                multiline
                label="Message"
                labelColor="gold"
                rows={4}
                value={chatDraft}
                onChange={(event) => onChatDraftChange(event.target.value)}
                onKeyDown={onStorytellerMessageKeyDown}
                placeholder="Share narration, rulings, or prompts with the table..."
                controlClassName="min-h-[7.5rem] pr-12"
                topRightControl={messageInputTopRightControl}
              />
              <div className="flex flex-wrap items-end gap-2 paper-shadow">
                <Button
                  variant="solid"
                  color="curse"
                  size="sm"
                  type="button"
                  disabled={sessionClosed}
                  onClick={onCloseSession}
                >
                  End Session
                </Button>
                <div className="flex-1" />
                <Button
                  color="gold"
                  disabled={sessionClosed || chatDraft.trim().length === 0}
                  onClick={onSendMessage}
                >
                  Send
                </Button>
              </div>
              <div className="flex min-h-[2.2em] flex-col items-end mt-2 paper-shadow">
                <Text
                  variant="note"
                  color="steel-dark"
                  className="normal-case tracking-normal"
                >
                  Press Enter to send. Shift+Enter for newline.
                </Text>
              </div>
            </div>
          </div>
        }
      />
    </Section>
  );
};
