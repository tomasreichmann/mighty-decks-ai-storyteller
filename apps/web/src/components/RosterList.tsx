import type { RosterEntry } from "@mighty-decks/spec/adventureState";
import { Section } from "./common/Section";
import { Message } from "./common/Message";
import { Text } from "./common/Text";

interface RosterListProps {
  roster: RosterEntry[];
}

export const RosterList = ({ roster }: RosterListProps): JSX.Element => {
  return (
    <Section className="stack">
      <Text as="h3" variant="h3" color="iron" className="text-lg">
        Roster
      </Text>
      <div className="stack gap-4">
        {roster.map((entry) => {
          const presenceLabel = entry.connected ? "connected" : "offline";
          const readyLabel =
            entry.role === "player"
              ? entry.ready
                ? "✔ Ready"
                : "❌ Not ready"
              : null;

          return (
            <Message label={entry.displayName} key={entry.playerId}>
              {presenceLabel}
              {readyLabel ? ` - ${readyLabel}` : ""}
            </Message>
          );
        })}
      </div>
    </Section>
  );
};
