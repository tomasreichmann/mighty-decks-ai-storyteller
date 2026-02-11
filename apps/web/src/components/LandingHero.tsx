import { Section } from "./common/Section";

export const LandingHero = (): JSX.Element => {
  return (
    <Section className="stack">
      <p className="text-xs uppercase tracking-widest text-kac-steel-dark/90">
        Mighty Decks AI Storyteller
      </p>
      <h1 className="hero-title text-4xl font-black text-kac-iron sm:text-5xl">
        A GM-less adventure table that runs on your phones and one shared
        screen.
      </h1>
      <p className="max-w-2xl text-base text-kac-iron-light sm:text-lg">
        Create one adventure, invite 1-5 players, vote on a pitch, and play
        narrative scenes with an AI storyteller.
      </p>
    </Section>
  );
};
