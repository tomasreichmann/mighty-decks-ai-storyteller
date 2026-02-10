import { Section } from "./common/Section";

interface ReadyGatePanelProps {
  connectedPlayers: number;
  readyPlayers: number;
}

export const ReadyGatePanel = ({ connectedPlayers, readyPlayers }: ReadyGatePanelProps): JSX.Element => {
  return (
    <Section className="stack">
      <h3 className="text-lg font-semibold text-ink">Ready Gate</h3>
      <p className="text-slate-700">
        {readyPlayers} / {connectedPlayers} connected players are ready.
      </p>
      <p className="text-sm text-slate-600">Phase advances when all connected player role clients are ready.</p>
    </Section>
  );
};

