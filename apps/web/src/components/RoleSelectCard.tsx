import { Button } from "./common/Button";
import { Section } from "./common/Section";
import { Text } from "./common/Text";

interface RoleSelectCardProps {
  onSelectRole: (role: "player" | "screen") => void;
}

export const RoleSelectCard = ({
  onSelectRole,
}: RoleSelectCardProps): JSX.Element => {
  return (
    <Section className="flex-1 stack justify-center items-center text-center">
      <Text as="h2" variant="h2" color="iron">
        Choose your role
      </Text>
      <Text variant="body" color="iron-light" className="mb-4">
        Use Player on phones and Screen on the shared display.
      </Text>
      <div className="flex gap-3 justify-center">
        <Button onClick={() => onSelectRole("player")}>Player</Button>
        <Button variant="solid" color="cloth" onClick={() => onSelectRole("screen")}>
          Screen
        </Button>
      </div>
    </Section>
  );
};
