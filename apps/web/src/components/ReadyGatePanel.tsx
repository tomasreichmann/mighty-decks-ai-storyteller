import { Section } from "./common/Section";

interface ReadyGatePanelProps {
  connectedPlayers: number;
  readyPlayers: number;
}

export const ReadyGatePanel = ({ connectedPlayers, readyPlayers }: ReadyGatePanelProps): JSX.Element => {
  return (
    <Section className="stack">
      <h3 className="text-lg font-semibold text-kac-iron">Ready Gate</h3>
      <p className="text-kac-iron-light">
        {readyPlayers} / {connectedPlayers} connected players are ready.
      </p>
      <p className="text-sm text-kac-steel-dark">Phase advances when all connected player role clients are ready.</p>
    </Section>
  );
};

