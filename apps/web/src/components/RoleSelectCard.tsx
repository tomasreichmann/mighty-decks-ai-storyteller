import { Button } from "./common/Button";
import { Highlight } from "./common/Highlight";
import { Section } from "./common/Section";
import { Text } from "./common/Text";

interface RoleSelectCardProps {
  onSelectRole: (role: "player" | "screen") => void;
}

export const RoleSelectCard = ({
  onSelectRole,
}: RoleSelectCardProps): JSX.Element => {
  return (
    <Section className="flex-1 stack justify-center items-center text-center relative overflow-hidden max-w-[100vw] -mx-5">
      <div className="stack justify-center items-center text-center relative">
        <Text as="h2" variant="h2" color="iron">
          Choose your role
        </Text>
        <Text variant="emphasised" color="iron-light" className="mb-4">
          Use Player on phones and Screen on the shared display.
        </Text>
        <div className="flex gap-3 justify-center">
          <Button
            onClick={() => onSelectRole("player")}
            className="flex flex-col"
          >
            <span className="text-2xl">♟️</span>
            Player
          </Button>
          <Button
            variant="solid"
            color="cloth"
            onClick={() => onSelectRole("screen")}
            className="flex flex-col"
          >
            <span className="text-2xl">🖥️</span>
            Screen
          </Button>
        </div>
        <Highlight
          color="gold"
          animate="once"
          lineCount={4}
          canvasWidth={600}
          brushHeight={26}
          className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-[150%] h-[150%] opacity-50 -z-10"
        />
      </div>
    </Section>
  );
};
