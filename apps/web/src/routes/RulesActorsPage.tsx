import { GameCard } from "@mighty-decks/components/react";
import { CardBoundary } from "../components/common/CardBoundary";
import { Heading } from "../components/common/Heading";
import { Text } from "../components/common/Text";
import { ActorCompositionFigure } from "../components/rules/RulesCardComposition";
import { rulesActorGroups } from "../data/rulesActors";

export const RulesActorsPage = (): JSX.Element => (
  <div className="stack gap-8">
    <div className="stack gap-3">
      <div className="stack gap-1">
        <Heading level="h2" color="iron">Actor Cards</Heading>
        <Text variant="body" color="iron-light" className="text-sm">
          Combine a base and tactical role to make a complete Actor; a tactical
          special is optional. NPC Actors use fixed Effects. <a className="underline" href="/rules#building-an-actor-card">Learn how Actor cards are assembled.</a>
        </Text>
      </div>
      <ActorCompositionFigure />
    </div>

    <nav aria-label="Actor card sections" className="flex flex-wrap gap-x-4 gap-y-2 font-ui text-sm font-bold text-kac-cloth-dark">
      {rulesActorGroups.map((group) => <a key={group.id} className="underline" href={`#${group.id}`}>{group.heading}</a>)}
    </nav>

    {rulesActorGroups.map((group) => (
      <section key={group.id} id={group.id} className="stack gap-3 scroll-mt-4">
        <div className="stack gap-1">
          <Heading level="h3" color="iron">{group.heading}</Heading>
          <Text variant="body" color="iron-light" className="text-sm">{group.description}</Text>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {group.cards.map((card) => (
            <CardBoundary key={card.id} resetKey={card.id} label={`${card.title} card failed`} className="mx-auto w-full max-w-[13rem]">
              <GameCard type={card.family} slug={card.slug} className="mx-auto" />
            </CardBoundary>
          ))}
        </div>
      </section>
    ))}
  </div>
);
