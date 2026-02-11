import { Label } from "./common/Label";
import { Section } from "./common/Section";
import { Text } from "./common/Text";

export const LandingHero = (): JSX.Element => {
  return (
    <Section className="stack">
      <Label className="self-start" size="lg">
        Mighty Decks AI Storyteller
      </Label>
      <Text
        variant="h1"
        color="iron"
        as="h1"
        className="mt-4 !font-md-title text-4xl/8 sm:text-5xl/10"
      >
        A GM-less adventure table that runs on your phones and one shared
        screen.
      </Text>
      <Text
        variant="body"
        color="iron-light"
        className="max-w-2xl text-base sm:text-lg"
      >
        Create one adventure, invite 1-5 players, vote on a pitch, and play
        narrative scenes with an AI storyteller.
      </Text>
    </Section>
  );
};
