import type { RosterEntry } from "@mighty-decks/spec/adventureState";
import { Section } from "./common/Section";

interface RosterListProps {
  roster: RosterEntry[];
}

export const RosterList = ({ roster }: RosterListProps): JSX.Element => {
  return (
    <Section className="stack">
      <h3 className="text-lg font-semibold text-kac-iron">Roster</h3>
      <ul className="grid gap-2">
        {roster.map((entry) => {
          const presenceLabel = entry.connected ? "connected" : "offline";
          const readyLabel =
            entry.role === "player" ? (entry.ready ? "ready" : "not ready") : null;

          return (
            <li
              key={entry.playerId}
              className="rounded-md border border-kac-steel/70 bg-kac-steel-light/90 p-2 text-sm text-kac-iron-light"
            >
              <strong>{entry.displayName}</strong> ({entry.role}) - {presenceLabel}
              {readyLabel ? ` - ${readyLabel}` : ""}
            </li>
          );
        })}
      </ul>
    </Section>
  );
};

