import { Section } from "./common/Section";
import { Text } from "./common/Text";

interface ReadyGatePanelProps {
  connectedPlayers: number;
  readyPlayers: number;
}

export const ReadyGatePanel = ({
  connectedPlayers,
  readyPlayers,
}: ReadyGatePanelProps): JSX.Element => {
  return (
    <Section className="stack">
      <Text as="h3" variant="h3" color="iron" className="text-lg">
        Ready Gate
      </Text>
      <Text variant="emphasised">
        {readyPlayers} / {connectedPlayers} connected players are ready.
      </Text>
      <Text
        variant="note"
        color="steel-dark"
        className="text-sm normal-case tracking-normal"
      >
        We will begin when all connected players are ready.
      </Text>
    </Section>
  );
};
