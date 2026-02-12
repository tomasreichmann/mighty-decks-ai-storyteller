import { useNavigate } from "react-router-dom";
import { CreateAdventureCTA } from "../components/CreateAdventureCTA";
import { LandingHero } from "../components/LandingHero";
/* import { OutcomeCardShowcase } from "../components/OutcomeCardShowcase"; */
import { createAdventureId } from "../lib/ids";
import { Text } from "../components/common/Text";

export const LandingPage = (): JSX.Element => {
  const navigate = useNavigate();

  const handleCreateAdventure = (): void => {
    const adventureId = createAdventureId();
    navigate(`/adventure/${adventureId}`);
  };

  return (
    <main className="app-shell stack py-10 gap-4">
      <LandingHero />
      {/* 
      <OutcomeCardShowcase /> */}
      <div className="flex flex-row justify-center">
        <CreateAdventureCTA onCreate={handleCreateAdventure} />
      </div>

      <div className="flex flex-col min-w-0 gap-4 mt-4">
        <Text
          variant="h2"
          color="iron-light"
          className="text-center font-md-title tracking-normal rotate-[-2deg] skew-x-[-10deg]"
        >
          Sample adventure
        </Text>
        <section className="stack gap-2 mt-2">
          <div className="relative aspect-video overflow-hidden -m-1 border border-kac-steel-dark/40 bg-kac-steel skew-clip-mask">
            <img
              src="/sample-scene-image.png"
              alt="Scene visual"
              className="absolute h-full w-full object-cover"
            />
          </div>
          <section className="comic-panel relative p-1.5">
            <div className="flex-1 relative z-10 px-3 py-3 shadow-[inset_1px_1px_0_0_#fffaf0,inset_-1px_-1px_0_0_#d6c1a1] [background-color:white] bg-gradient-to-b from-kac-bone-light/50 to-kac-bone-light">
              <blockquote className="font-ui italic text-kac-iron text-base">
                The air thrums with the guttural war cries of a thousand
                goblins. You are Ralph Stoneshard, the first dwarf through the
                splintering barricade. Your maul swings, a blur of dwarven fury.
                The tunnel ahead teems with snarling green skin, a tide
                threatening to engulf your kin. There's no turning back.
              </blockquote>
            </div>
          </section>
        </section>
        <article className="px-2 py-2 pr-4 shadow-[4px_4px_0_0_#121b23] rounded-sm bg-[linear-gradient(179deg,var(--tw-gradient-stops))] from-kac-gold-light to-kac-bone border-2 border-kac-iron-dark min-w-0 max-w-full self-start">
          <div className="stack min-w-0 items-baseline gap-2 relative pt-4">
            <span className="inline-flex items-center border-2 border-kac-iron px-2 pt-1.5 pb-1 font-heading text-xs/none font-bold uppercase tracking-wide shadow-[3px_3px_0_0_#121b23] -rotate-[1.5deg] bg-kac-gold text-kac-iron absolute -top-4 -left-4">
              Storyteller
            </span>
            <div className="w-full flex-1 whitespace-pre-wrap text-sm leading-relaxed text-kac-iron-dark min-w-0">
              <p className="min-w-0 whitespace-pre-wrap text-base italic text-kac-iron-dark">
                <span>
                  Ralph, the horde surges! What's your immediate, brutal
                  response to carve a path, and why must you fight?
                </span>
              </p>
            </div>
          </div>
        </article>
        <article className="px-2 py-2 pr-4 shadow-[4px_4px_0_0_#121b23] rounded-sm bg-[linear-gradient(179deg,var(--tw-gradient-stops))] from-kac-fire-lightest to-kac-fire-light border-2 border-kac-iron-dark min-w-0 max-w-full self-end">
          <div className="stack min-w-0 items-baseline gap-2 relative pt-4">
            <span className="inline-flex items-center border-2 border-kac-iron px-2 pt-1.5 pb-1 font-heading text-xs/none font-bold uppercase tracking-wide shadow-[3px_3px_0_0_#121b23] -rotate-[1.5deg] bg-kac-fire-light text-kac-iron-dark absolute -top-4 -left-4">
              Ralph Stoneshard
            </span>
            <div className="w-full flex-1 whitespace-pre-wrap text-sm leading-relaxed text-kac-iron-dark min-w-0">
              <p className="min-w-0 whitespace-pre-wrap text-sm text-kac-iron-light">
                <span>
                  I will swing my maul around spinning into the goblin horde.
                  These goblins destroyed my tavern and I will have my vengence!
                </span>
              </p>
            </div>
          </div>
        </article>
        <article className="px-2 py-2 pr-4 shadow-[4px_4px_0_0_#121b23] rounded-sm bg-[linear-gradient(179deg,var(--tw-gradient-stops))] from-kac-gold-light to-kac-bone border-2 border-kac-iron-dark min-w-0 max-w-full self-start">
          <div className="stack min-w-0 items-baseline gap-2 relative pt-4">
            <span className="inline-flex items-center border-2 border-kac-iron px-2 pt-1.5 pb-1 font-heading text-xs/none font-bold uppercase tracking-wide shadow-[3px_3px_0_0_#121b23] -rotate-[1.5deg] bg-kac-gold text-kac-iron absolute -top-4 -left-4">
              Storyteller
            </span>
            <div className="w-full flex-1 whitespace-pre-wrap text-sm leading-relaxed text-kac-iron-dark min-w-0">
              <p className="min-w-0 whitespace-pre-wrap text-base italic text-kac-iron-dark">
                <span>
                  Ralph Stoneshard's maul whirled, a deadly arc through the
                  initial wave of goblins. The weapon connected with a sickening
                  crunch, sending smaller bodies tumbling. His rage, fueled by
                  the destruction of his tavern, propelled his every strike. The
                  sheer number of goblins, however, allowed them to absorb the
                  initial assault, their ranks only momentarily disrupted.
                </span>
              </p>
            </div>
          </div>
        </article>
        <article className="px-2 py-2 pr-4 shadow-[4px_4px_0_0_#121b23] rounded-sm bg-[linear-gradient(179deg,var(--tw-gradient-stops))] from-kac-fire-lightest to-kac-fire-light border-2 border-kac-iron-dark min-w-0 max-w-full self-end">
          <div className="stack min-w-0 items-baseline gap-2 relative pt-4">
            <span className="inline-flex items-center border-2 border-kac-iron px-2 pt-1.5 pb-1 font-heading text-xs/none font-bold uppercase tracking-wide shadow-[3px_3px_0_0_#121b23] -rotate-[1.5deg] bg-kac-fire-light text-kac-iron-dark absolute -top-4 -left-4">
              Ralph Stoneshard
            </span>
            <div className="w-full flex-1 whitespace-pre-wrap text-sm leading-relaxed text-kac-iron-dark min-w-0">
              <p className="min-w-0 whitespace-pre-wrap text-sm text-kac-iron-light">
                <span>
                  I want to charge through their ranks to attack their leader
                </span>
              </p>
            </div>
          </div>
        </article>
        <article className="px-2 py-2 pr-4 shadow-[4px_4px_0_0_#121b23] rounded-sm bg-[linear-gradient(179deg,var(--tw-gradient-stops))] from-kac-cloth-lightest/25 to-kac-cloth-light border-2 border-kac-iron-dark min-w-0 max-w-full self-start">
          <div className="stack min-w-0 items-baseline gap-2 relative pt-4">
            <span className="inline-flex items-center border-2 border-kac-iron px-2 pt-1.5 pb-1 font-heading text-xs/none font-bold uppercase tracking-wide shadow-[3px_3px_0_0_#121b23] -rotate-[1.5deg] bg-kac-cloth-light text-kac-iron-dark absolute -top-4 -left-4">
              System
            </span>
            <div className="w-full flex-1 whitespace-pre-wrap text-sm leading-relaxed text-kac-iron-dark min-w-0">
              <p className="min-w-0 whitespace-pre-wrap text-sm font-semibold text-kac-iron-light">
                <span>
                  Ralph Stoneshard, play an Outcome card. Charging through enemy
                  ranks to attack their leader is a high-risk, high-reward
                  action with immediate threat and uncertainty.
                </span>
              </p>
            </div>
          </div>
        </article>
        <article className="px-2 py-2 pr-4 shadow-[4px_4px_0_0_#121b23] rounded-sm bg-[linear-gradient(179deg,var(--tw-gradient-stops))] from-kac-cloth-lightest/25 to-kac-cloth-light border-2 border-kac-iron-dark min-w-0 max-w-full self-start">
          <div className="stack min-w-0 items-baseline gap-2 relative pt-4">
            <span className="inline-flex items-center border-2 border-kac-iron px-2 pt-1.5 pb-1 font-heading text-xs/none font-bold uppercase tracking-wide shadow-[3px_3px_0_0_#121b23] -rotate-[1.5deg] bg-kac-cloth-light text-kac-iron-dark absolute -top-4 -left-4">
              System
            </span>
            <div className="w-full flex-1 whitespace-pre-wrap text-sm leading-relaxed text-kac-iron-dark min-w-0">
              <p className="min-w-0 whitespace-pre-wrap text-sm font-semibold text-kac-iron-light">
                <span>Ralph Stoneshard played Fumble (-1 Effect).</span>
              </p>
            </div>
          </div>
        </article>
        <article className="px-2 py-2 pr-4 shadow-[4px_4px_0_0_#121b23] rounded-sm bg-[linear-gradient(179deg,var(--tw-gradient-stops))] from-kac-gold-light to-kac-bone border-2 border-kac-iron-dark min-w-0 max-w-full self-start">
          <div className="stack min-w-0 items-baseline gap-2 relative pt-4">
            <span className="inline-flex items-center border-2 border-kac-iron px-2 pt-1.5 pb-1 font-heading text-xs/none font-bold uppercase tracking-wide shadow-[3px_3px_0_0_#121b23] -rotate-[1.5deg] bg-kac-gold text-kac-iron absolute -top-4 -left-4">
              Storyteller
            </span>
            <div className="w-full flex-1 whitespace-pre-wrap text-sm leading-relaxed text-kac-iron-dark min-w-0">
              <p className="min-w-0 whitespace-pre-wrap text-base italic text-kac-iron-dark">
                <span>
                  Ralph Stoneshard attempts to charge, but his momentum fails. A
                  surge of goblins, momentarily broken, reforms and engulfs him,
                  their sheer numbers overwhelming his advance. He is now deeper
                  within their ranks, but further from their leader and
                  surrounded.
                </span>
              </p>
            </div>
          </div>
        </article>
        <article className="self-center px-2 py-2 pr-2 shadow-[4px_4px_0_0_#121b23] rounded-sm bg-[linear-gradient(179deg,var(--tw-gradient-stops))] from-kac-gold-light to-kac-bone border-2 border-kac-iron-dark min-w-0 max-w-full self-start">
          <div className="stack min-w-0 items-baseline gap-2 relative ">
            <div className="w-full flex-1 whitespace-pre-wrap text-sm leading-relaxed text-kac-iron-dark min-w-0">
              <p className="min-w-0 whitespace-pre-wrap text-base italic text-kac-iron-dark">
                <span>...</span>
              </p>
            </div>
          </div>
        </article>
        <div className="flex flex-row justify-center">
          <CreateAdventureCTA onCreate={handleCreateAdventure} />
        </div>
        <Text
          variant="emphasised"
          color="steel-dark"
          className="text-center mt-4"
        >
          Made by{" "}
          <a
            href="mailto:tomasreichmann@gmail.com"
            target="_blank"
            className="text-kac-gold-darker hover:underline"
          >
            Tomáš Reichmann
          </a>
          &nbsp;2026
        </Text>
      </div>
    </main>
  );
};
