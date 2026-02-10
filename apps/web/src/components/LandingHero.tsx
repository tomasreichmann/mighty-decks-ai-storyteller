import { Section } from "./common/Section";

export const LandingHero = (): JSX.Element => {
  return (
    <Section className="stack">
      <p className="text-xs uppercase tracking-widest text-slate-500">
        Mighty Decks AI Storyteller
      </p>
      <h1 className="hero-title text-4xl font-black text-ink sm:text-5xl">
        A GM-less adventure table that runs on your phones and one shared
        screen.
      </h1>
      <p className="max-w-2xl text-base text-slate-700 sm:text-lg">
        Create one adventure, invite 1-5 players, vote on a pitch, and play
        narrative scenes with an AI storyteller.
      </p>
    </Section>
  );
};
