import { Label } from "./common/Label";
import { Section } from "./common/Section";
import { Text } from "./common/Text";

export const LandingHero = (): JSX.Element => {
  return (
    <Section className="stack items-center text-center">
      <Label className="self-start" size="lg">
        Mighty Decks AI Storyteller
      </Label>
      <Text
        variant="h1"
        color="iron"
        as="h1"
        className="mt-4 mb-8 mx-auto max-w-2xl font-md-title !leading-[0.8] rotate-[-2deg] skew-x-[-10deg]"
      >
        A GM-less adventure table that runs on your phones and one shared screen
      </Text>
      <Text
        variant="body"
        color="iron-light"
        className="max-w-2xl text-base sm:text-lg"
      >
        Start an adventure, invite 1-5 players, vote on a pitch, and play
        narrative scenes with an AI storyteller.
      </Text>
    </Section>
  );
};
