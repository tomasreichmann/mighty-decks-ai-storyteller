import { GameCardView } from "../adventure-module/GameCardView";
import type { ReactNode } from "react";
import { ActorCard } from "../cards/ActorCard";
import { AssetCard } from "../cards/AssetCard";
import { CounterCard } from "../cards/CounterCard";
import { OutcomeCard } from "../cards/OutcomeCard";
import { CardBoundary } from "../common/CardBoundary";
import { Label } from "../common/Label";
import { Token } from "../common/Token";
import { Text } from "../common/Text";
import { LocationCard } from "../styleguide/LocationCard";
import { resolveGameCard, type GameCardType } from "../../lib/markdownGameComponents";
import { DieMarker } from "./DieMarker";
import styles from "./RulesRulebookContent.module.css";

const actorToken = "/actors/base/guard-blue.png";
const outcomeCardClassName = "w-[6rem]";
const trackingCardClassName = "w-[10rem]";
const fumbleCardClassName = "w-[6.5rem]";
const tableSetupCardClassName = "w-[9rem]";
const locationExamples = [
  {
    title: "Castle Gate",
    imageUrl: "/rules/locations/castle-gate.png",
    occupant: { label: "Mira", roleLabel: "Player", symbol: "✦", color: "fire" },
  },
  {
    title: "Courtyard",
    imageUrl: "/rules/locations/courtyard.png",
    occupant: undefined,
  },
  {
    title: "Tower",
    imageUrl: "/rules/locations/tower.png",
    occupant: { label: "Bandit", roleLabel: "Enemy", symbol: "☠", color: "monster" },
  },
] as const;

const RulebookFigure = ({
  title,
  summary,
  children,
}: {
  title: string;
  summary: string;
  children: ReactNode;
}): JSX.Element => (
  <figure className="stack gap-3 py-3 print:break-inside-avoid">
    <div className="flex flex-wrap items-center gap-2">{children}</div>
    <figcaption>
      <Text variant="note" color="iron-light">
        <strong className="text-kac-iron">{title}.</strong> {summary}
      </Text>
    </figcaption>
  </figure>
);

const ResolvedCard = ({
  type,
  slug,
  modifierSlug,
  className = "w-[9rem] max-w-full",
}: {
  type: GameCardType;
  slug: string;
  modifierSlug?: string;
  className?: string;
}): JSX.Element | null => {
  const gameCard = resolveGameCard(
    type,
    slug,
    undefined,
    undefined,
    undefined,
    modifierSlug,
  );
  if (!gameCard) {
    return null;
  }
  return (
    <CardBoundary label={`${gameCard.type} illustration failed`}>
      <GameCardView gameCard={gameCard} className={className} />
    </CardBoundary>
  );
};

const RulebookCardFloat = ({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}): JSX.Element => (
  <aside aria-label={label} className={styles.cardFloat}>
    {children}
  </aside>
);

export const DistressCardIllustration = (): JSX.Element => (
  <RulebookCardFloat label="Distress card illustration">
    <ResolvedCard type="EffectCard" slug="distress" />
  </RulebookCardFloat>
);

export const StuntCardIllustration = (): JSX.Element => (
  <RulebookCardFloat label="Stunt card illustration">
    <ResolvedCard type="StuntCard" slug="safecracker" />
  </RulebookCardFloat>
);

export const AssetCardIllustration = (): JSX.Element => (
  <RulebookCardFloat label="Asset card illustration">
    <ResolvedCard type="AssetCard" slug="base_tools" />
  </RulebookCardFloat>
);

export const ConsumableCardIllustration = (): JSX.Element => (
  <RulebookCardFloat label="Consumable card illustration">
    <ResolvedCard type="AssetCard" slug="base_healing" />
  </RulebookCardFloat>
);

export const EffectEquation = (): JSX.Element => (
  <div className="flex flex-wrap items-center justify-center gap-2 text-center font-heading text-xl font-bold text-kac-iron">
    <ResolvedCard type="AssetCard" slug="base_tools" modifierSlug="base_empowered" className="w-[8rem]" />
    <span aria-hidden="true" className="text-2xl">+</span>
    <ResolvedCard type="StuntCard" slug="safecracker" className="w-[8rem]" />
    <span aria-hidden="true" className="text-2xl">+</span>
    <ResolvedCard type="OutcomeCard" slug="success" className="w-[8rem]" />
    <span aria-hidden="true" className="text-2xl">=</span>
    <span className="rounded border-2 border-kac-iron bg-kac-gold px-3 py-2">5 Effect</span>
  </div>
);

export const CompleteTableSetup = (): JSX.Element => (
  <RulebookFigure
    title="Complete table setup"
    summary="The shared scene, Outcome deck and hand, and player components stay visible in distinct rows at the table."
  >
    <div className={styles.tableSetupViewport}>
      <div className={styles.tableSetupCanvas}>
        <div className={styles.tableSetupShared} aria-label="Shared scene components">
          <LocationCard
            imageUrl="/rules/locations/castle-gate.png"
            imageAlt="Castle Gate location"
            title="Castle Gate"
            description="Shared scene location."
            className="w-[20rem]"
          />
          <div className={styles.tableSetupTrackedCard}>
            <CounterCard
              iconSlug="tracking"
              title="Reinforcements Coming"
              currentValue={2}
              maxValue={4}
              className={tableSetupCardClassName}
            />
            <DieMarker sides={4} value={2} className="!absolute right-2 top-2 z-20" />
          </div>
          <div className={styles.tableSetupTrackedCard}>
            <ActorCard
              baseLayerSlug="guard_blue"
              tacticalRoleSlug="brute"
              className={tableSetupCardClassName}
            />
            <DieMarker sides={4} value={3} className="!absolute right-2 top-2 z-20" />
          </div>
        </div>

        <div className={styles.tableSetupOutcomes} aria-label="Outcome deck and hand">
          <div className={styles.tableSetupOutcomeDeck}>
            <OutcomeCard card="success" face="back" className={tableSetupCardClassName} />
          </div>
          <div className={styles.tableSetupOutcomeHand}>
            <ResolvedCard type="OutcomeCard" slug="success" className={tableSetupCardClassName} />
            <ResolvedCard type="OutcomeCard" slug="fumble" className={tableSetupCardClassName} />
            <ResolvedCard type="OutcomeCard" slug="chaos" className={tableSetupCardClassName} />
          </div>
        </div>

        <div className={styles.tableSetupPlayer} aria-label="Player components">
          <ResolvedCard type="EffectCard" slug="injury" className={tableSetupCardClassName} />
          <ResolvedCard type="StuntCard" slug="marksman" className={tableSetupCardClassName} />
          <AssetCard
            kind="custom"
            noun="Throwing Knife"
            modifier="Returning"
            nounDescription="A light thrown weapon."
            adjectiveDescription="Returns after a throw."
            iconUrl="/assets/medieval/dagger.png"
            overlayUrl="/assets/base/empowered.png"
            className={tableSetupCardClassName}
          />
        </div>
      </div>
    </div>
  </RulebookFigure>
);

export const ComposedAssetEquation = (): JSX.Element => (
  <RulebookFigure
    title="Opening a locked place"
    summary="Tools and Empowered contribute 2 Effect on a Success; Safecracker adds 1 more, for 5 Effect when breaking into a locked place."
  >
    <EffectEquation />
  </RulebookFigure>
);

export const FumbleBranches = (): JSX.Element => (
  <RulebookFigure
    title="Two valid Fumbles"
    summary="A Fumble can miss cleanly, or it can hit while creating a fitting consequence. The canonical example above gives the full rule text."
  >
    <div className="grid w-full items-start gap-4 md:grid-cols-[minmax(0,0.7fr)_auto_minmax(0,1fr)_minmax(0,1fr)]">
      <div className="justify-self-center">
        <ResolvedCard type="OutcomeCard" slug="fumble" className="w-[8rem]" />
      </div>
      <span aria-hidden="true" className="hidden self-center font-heading text-2xl md:block">→</span>
      <div className="stack items-center gap-2 text-center">
        <Text variant="emphasised" color="blood">MISS</Text>
        <Text variant="note" color="iron-light">The arrow flies wide: no useful Effect.</Text>
      </div>
      <div className="stack items-center gap-2 text-center">
        <Text variant="emphasised" color="blood">HIT, BUT...</Text>
        <div className="flex flex-wrap justify-center gap-2">
          <ResolvedCard type="EffectCard" slug="injury" className="w-[6rem]" />
          <ResolvedCard type="AssetCard" slug="medieval_hunting_bow" className="w-[6rem]" />
          <ResolvedCard type="EffectCard" slug="complication" className="w-[6rem]" />
        </div>
        <Text variant="note" color="iron-light">1 Injury · Broken String · Action to repair</Text>
      </div>
    </div>
  </RulebookFigure>
);

export const CoreActionLoop = (): JSX.Element => (
  <RulebookFigure
    title="Core Action Loop"
    summary="Choose an Outcome, resolve it, refill the hand, then check the new hand for Catastrophe."
  >
    <ol className="sr-only">
      <li>Choose card from the three-card hand.</li>
      <li>Resolve Effect.</li>
      <li>Discard the played card.</li>
      <li>Draw replacement.</li>
      <li>Catastrophe check the refreshed hand.</li>
    </ol>
    <div className="grid w-full items-center gap-4 md:grid-cols-[minmax(18rem,1.5fr)_repeat(5,minmax(0,1fr))]">
      <div className="flex flex-wrap justify-center gap-2" aria-label="Three-card Outcome hand">
        <ResolvedCard type="OutcomeCard" slug="success" className="w-[5.5rem] -translate-y-2 ring-2 ring-kac-gold" />
        <ResolvedCard type="OutcomeCard" slug="partial-success" className="w-[5.5rem]" />
        <ResolvedCard type="OutcomeCard" slug="fumble" className="w-[5.5rem]" />
      </div>
      {[
        "Choose card",
        "Resolve Effect",
        "Discard",
        "Draw replacement",
        "Catastrophe check",
      ].map((step, index) => (
        <div key={step} className="flex min-h-16 flex-col items-center justify-center gap-1 text-center">
          {index > 0 ? <span aria-hidden="true" className="hidden font-heading text-xl md:block">→</span> : null}
          <Text variant="note" color="iron">{step}</Text>
        </div>
      ))}
    </div>
  </RulebookFigure>
);

export const ActorInitiative = (): JSX.Element => {
  const initiativeSlots = [
    { player: "Mira", actors: ["Guard", "Wolf"] },
    { player: "Aldren", actors: ["Bandit"] },
    { player: "Tomas", actors: [] },
  ] as const;

  return (
    <RulebookFigure
      title="Actor initiative"
      summary="Actors act immediately after the player they sit in front of. Multiple Actors may share a slot, and all act after that player."
    >
      <Text variant="emphasised" color="iron">Mira → Guard → Wolf → Aldren → Bandit → Tomas</Text>
      <ol className="sr-only">
        <li>Mira</li><li>Guard</li><li>Wolf</li><li>Aldren</li><li>Bandit</li><li>Tomas</li>
      </ol>
      <div className="grid w-full gap-4 md:grid-cols-3">
        {initiativeSlots.map((slot, index) => (
          <div key={slot.player} className="stack items-center gap-2 text-center">
            <Token
              imageUrl={actorToken}
              imageAlt={`${slot.player} player token`}
              label={slot.player}
              color={index === 0 ? "fire" : index === 1 ? "gold" : "cloth"}
              size="md"
            />
            <div className="flex flex-wrap justify-center gap-2">
              {slot.actors.map((actor) => (
                <div key={actor} className="stack items-center gap-1">
                  <ActorCard baseLayerSlug={actor === "Wolf" ? "animal_red" : "guard_blue"} tacticalRoleSlug="minion" className="w-[7rem]" />
                  <Text variant="note" color="iron">{actor}</Text>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </RulebookFigure>
  );
};

export const ZonesAndRange = (): JSX.Element => (
  <RulebookFigure
    title="Zones and range"
    summary="Castle Gate, Courtyard, and Tower are connected zones. A weapon's reach tells you how many zones away it can affect."
  >
    <ol className="sr-only"><li>Mira at Castle Gate: Sword reaches the same zone.</li><li>Throw reaches Courtyard.</li><li>Bow reaches Tower.</li></ol>
    <div className="grid w-full gap-3 sm:grid-cols-3">
      {locationExamples.map((location) => (
        <div key={location.title} className="relative">
          <LocationCard imageUrl={location.imageUrl} imageAlt={`${location.title} medieval location`} title={location.title} description="A connected scene zone." />
          {location.occupant ? (
            <div className="absolute inset-0 z-20 flex items-center justify-center" aria-label={`${location.occupant.label}, ${location.occupant.roleLabel}, at ${location.title}`}>
              <div className="stack items-center gap-1">
                <Token imageUrl={actorToken} imageAlt={`${location.occupant.label} at ${location.title}`} label={location.occupant.label} color={location.occupant.color} size="sm" />
                <span aria-hidden="true" className="rounded border border-kac-iron bg-kac-bone-light px-1 font-heading text-xs text-kac-iron">{location.occupant.symbol} {location.occupant.roleLabel}</span>
              </div>
            </div>
          ) : null}
        </div>
      ))}
    </div>
    <div className="flex w-full flex-wrap justify-center gap-3 font-heading text-sm text-kac-iron"><span>Sword ↻ Gate</span><span>Throw → Courtyard</span><span>Bow → Tower</span></div>
    <div className="flex w-full flex-wrap justify-center gap-x-4 gap-y-2 text-center">
      <Text variant="note" color="iron">Sword: same zone</Text>
      <Text variant="note" color="iron">Throw: +1 zone</Text>
      <Text variant="note" color="iron">Bow: +2 zones</Text>
      <Text variant="note" color="iron">Sniper: anywhere in sight</Text>
    </div>
  </RulebookFigure>
);

const toughnessStates = [
  [3, "3 Toughness — Starting"],
  [1, "1 Toughness — after 2 Injury"],
  [0, "Taken Out — after 1 Distress"],
] as const;

export const RemainingToughness = (): JSX.Element => (
  <RulebookFigure
    title="Remaining Toughness"
    summary="The same Actor moves from ready, to pressured, to Taken Out as its remaining Toughness is reduced."
  >
    <div className={styles.trackingGrid}>
      {toughnessStates.map(([value, label]) => (
        <div key={String(label)} className="stack items-center gap-2">
          <div className="relative inline-flex">
            <ActorCard baseLayerSlug="guard_blue" tacticalRoleSlug="brute" className="w-[8rem]" />
            <DieMarker sides={4} value={value} removed={value === 0} className="!absolute right-2 top-2 z-20" />
          </div>
          <Text variant="note" color="iron">Bandit</Text>
          <Text variant="emphasised" color={value === 0 ? "blood" : "iron"}>{label}</Text>
        </div>
      ))}
    </div>
  </RulebookFigure>
);

export const CounterTracking = (): JSX.Element => (
  <RulebookFigure
    title="Counter tracking"
    summary="The Counter card tells you what its value means; the Actor's remaining Toughness is tracked separately. Dice track values; they are not rolled."
  >
    <div className={styles.trackingGrid}>
      <div className="stack items-center gap-2">
        <div className="relative inline-flex">
          <CounterCard iconSlug="tracking" title="Ice Storm" currentValue={3} maxValue={4} className={trackingCardClassName} />
          <DieMarker sides={4} value={3} className="!absolute right-2 top-2 z-20" />
        </div>
        <Text variant="emphasised" color="iron">Counter value: 3 / 4</Text>
      </div>
      <div className="stack items-center gap-2">
        <div className="relative inline-flex">
          <ActorCard baseLayerSlug="guard_blue" tacticalRoleSlug="minion" className={trackingCardClassName} />
          <DieMarker sides={4} value={1} className="!absolute right-2 top-2 z-20" />
        </div>
        <Text variant="note" color="iron">Bandit</Text>
        <Text variant="emphasised" color="blood">Remaining Toughness: 1</Text>
      </div>
    </div>
  </RulebookFigure>
);

export const CatastropheFlow = (): JSX.Element => (
  <RulebookFigure
    title="Catastrophe flow"
    summary="Finish the current resolution, draw a replacement, then resolve three Fumbles as a dramatic crisis."
  >
    <ResolvedCard type="OutcomeCard" slug="success" className={outcomeCardClassName} />
    <span aria-hidden="true" className="font-heading text-2xl">→</span>
    <span className="rounded border-2 border-kac-iron bg-kac-bone-light px-3 py-2 font-ui text-sm">Draw replacement</span>
    <span aria-hidden="true" className="font-heading text-2xl">→</span>
    <div className="flex gap-1">
      {[0, 1, 2].map((index) => <ResolvedCard key={index} type="OutcomeCard" slug="fumble" className={outcomeCardClassName} />)}
    </div>
    <span aria-hidden="true" className="font-heading text-2xl">→</span>
    <span className="rounded border-2 border-kac-blood-dark bg-kac-fire-light px-3 py-2 font-ui text-sm">Injury / Asset Complication / Enemy Boost</span>
  </RulebookFigure>
);

export const StatusThresholds = (): JSX.Element => (
  <RulebookFigure title="Distress and Injury thresholds" summary="Status cards appear only when each track reaches its threshold; recovering Distress can step the character back down.">
    <ol className="sr-only">
      <li>Distress: 0–2 OK; 3 Distress + Panicked; 4 Distress + Hopeless.</li>
      <li>Injury: 0–3 OK; 4 Injury + Taken Out.</li>
    </ol>
    <div className={styles.statusThresholds}>
      <section aria-label="Distress thresholds" className={styles.statusLane}>
        <Text variant="emphasised" color="iron">Distress</Text>
        <div className={styles.statusSequence}>
          <div className={styles.statusMilestone}>
            <Label color="bone" rotate={false}>0–2</Label>
            <Text variant="note" color="iron">OK</Text>
          </div>
          <span aria-hidden="true" className={styles.statusArrow}>→</span>
          <div className={styles.statusMilestone}>
            <div className={styles.statusCardPair}>
              <div className={styles.countedStatusCard}>
                <ResolvedCard type="EffectCard" slug="distress" className="w-[5.75rem]" />
                <Label color="fire" size="sm" rotate={false} className={styles.statusCount}>×3</Label>
              </div>
              <ResolvedCard type="EffectCard" slug="panicked" className="w-[5.75rem]" />
            </div>
            <Text variant="emphasised" color="blood">3 Distress + Panicked</Text>
          </div>
          <div aria-hidden="true" className={styles.statusTransition}>
            <span className={styles.statusArrow}>→</span>
            <span>← recover 1</span>
          </div>
          <div className={styles.statusMilestone}>
            <div className={styles.statusCardPair}>
              <div className={styles.countedStatusCard}>
                <ResolvedCard type="EffectCard" slug="distress" className="w-[5.75rem]" />
                <Label color="blood" size="sm" rotate={false} className={styles.statusCount}>×4</Label>
              </div>
              <ResolvedCard type="EffectCard" slug="hopeless" className="w-[5.75rem]" />
            </div>
            <Text variant="emphasised" color="blood">4 Distress + Hopeless</Text>
          </div>
        </div>
      </section>
      <section aria-label="Injury thresholds" className={styles.statusLane}>
        <Text variant="emphasised" color="iron">Injury</Text>
        <div className={styles.statusSequence}>
          <div className={styles.statusMilestone}>
            <Label color="bone" rotate={false}>0–3</Label>
            <Text variant="note" color="iron">OK</Text>
          </div>
          <span aria-hidden="true" className={styles.statusArrow}>→</span>
          <div className={styles.statusMilestone}>
            <div className={styles.statusCardPair}>
              <div className={styles.countedStatusCard}>
                <ResolvedCard type="EffectCard" slug="injury" className="w-[5.75rem]" />
                <Label color="blood" size="sm" rotate={false} className={styles.statusCount}>×4</Label>
              </div>
              <ResolvedCard type="EffectCard" slug="taken-out" className="w-[5.75rem]" />
            </div>
            <Text variant="emphasised" color="blood">4 Injury + Taken Out</Text>
          </div>
        </div>
      </section>
    </div>
  </RulebookFigure>
);

export const PhysicalAssetComposition = (): JSX.Element => (
  <RulebookFigure title="Physical Asset composition" summary="A base Asset and its modifier remain a readable combined card; a Stunt sits beside it without becoming an Effect equation.">
    <AssetCard kind="custom" noun="Throwing Knife" modifier="Returning" nounDescription="A light thrown weapon." adjectiveDescription="Returns after a throw." iconUrl="/assets/medieval/dagger.png" overlayUrl="/assets/base/empowered.png" className="w-[10rem]" />
    <span aria-hidden="true" className="font-heading text-2xl">+</span>
    <ResolvedCard type="StuntCard" slug="marksman" className="w-[10rem]" />
  </RulebookFigure>
);

export const FumbleBranchesV2 = (): JSX.Element => (
  <RulebookFigure title="Two valid Fumbles" summary="A Fumble can miss cleanly, or hit while creating a fitting consequence.">
    <ol className="sr-only"><li>Fumble.</li><li>Miss: no useful Effect.</li><li>Hit, but: Bandit receives Injury and Bow receives Complication.</li></ol>
    <div className={styles.fumbleFork}>
      <div className={styles.fumbleSource}>
        <ResolvedCard type="OutcomeCard" slug="fumble" className={fumbleCardClassName} />
      </div>
      <div className={styles.fumbleBranches}>
        <section className={styles.fumbleBranch} aria-label="Miss: no useful Effect">
          <Text variant="emphasised" color="blood">MISS</Text>
          <Text variant="note" color="iron-light">The arrow flies wide. No useful Effect.</Text>
        </section>
        <section className={styles.fumbleBranch} aria-label="Hit with a fitting consequence">
          <Text variant="emphasised" color="blood">HIT, BUT...</Text>
          <div className={styles.fumbleConsequences}>
            <div className={styles.fumbleConsequence}>
              <div className={styles.fumbleCardPair}>
                <ActorCard baseLayerSlug="guard_blue" tacticalRoleSlug="minion" className={fumbleCardClassName} />
                <ResolvedCard type="EffectCard" slug="injury" className={fumbleCardClassName} />
              </div>
              <Text variant="note" color="blood">Bandit takes 1 Injury</Text>
            </div>
            <div className={styles.fumbleConsequence}>
              <div className={styles.fumbleCardPair}>
                <ResolvedCard type="AssetCard" slug="medieval_hunting_bow" className={fumbleCardClassName} />
                <ResolvedCard type="EffectCard" slug="complication" className={fumbleCardClassName} />
              </div>
              <Text variant="note" color="blood">Bow gains a Complication</Text>
            </div>
          </div>
        </section>
      </div>
    </div>
  </RulebookFigure>
);

export const CatastropheFlowV2 = (): JSX.Element => (
  <RulebookFigure title="Catastrophe flow" summary="The current action resolves before the replacement draw reveals a three-Fumble Catastrophe.">
    <ol className="sr-only"><li>Action resolves.</li><li>Draw replacement.</li><li>Three Fumbles.</li><li>Catastrophe.</li><li>Injury, Bow Complication, or Enemy Boost.</li></ol>
    <div className="grid w-full items-center gap-3 md:grid-cols-4"><div className="stack items-center"><Text variant="emphasised" color="iron">1. Action resolves</Text><ResolvedCard type="OutcomeCard" slug="success" className="w-[6rem]" /></div><div className="stack items-center"><span aria-hidden="true">→</span><Text variant="emphasised" color="iron">2. Draw replacement</Text></div><div className="stack items-center"><span aria-hidden="true">→</span><Text variant="emphasised" color="blood">3. Fumble + Fumble + Fumble</Text><div className="flex -space-x-6">{[1, 2, 3].map((value) => <ResolvedCard key={value} type="OutcomeCard" slug="fumble" className="w-[4.5rem]" />)}</div></div><div className="stack items-center"><span aria-hidden="true">→</span><Text variant="emphasised" color="blood">CATASTROPHE</Text></div></div>
    <div className="flex w-full flex-wrap justify-center gap-3"><div className="stack items-center"><ResolvedCard type="EffectCard" slug="injury" className="w-[6rem]" /><Text variant="note" color="blood">Injury</Text></div><div className="stack items-center"><ResolvedCard type="EffectCard" slug="complication" className="w-[6rem]" /><Text variant="note" color="blood">Bow Complication</Text></div><div className="stack items-center"><ResolvedCard type="EffectCard" slug="boost" className="w-[6rem]" /><Text variant="note" color="blood">Enemy Boost</Text></div></div>
  </RulebookFigure>
);

export const CoreActionLoopV2 = (): JSX.Element => (
  <RulebookFigure title="Core Action Loop" summary="A selected Success leaves the hand, is discarded, and is replaced before the Catastrophe check.">
    <ol className="sr-only"><li>Choose.</li><li>Play and resolve.</li><li>Discard.</li><li>Draw replacement.</li><li>Check Catastrophe.</li></ol>
    <div className="grid w-full gap-3 md:grid-cols-5">{[["1", "Choose", "Three-card Outcome hand"], ["2", "Play / resolve", "Selected Success"], ["3", "Discard", "Played card"], ["4", "Draw replacement", "Deck stack"], ["5", "Catastrophe check", "Refreshed hand"]].map(([number, label, detail]) => <div key={number} className="stack items-center gap-2 text-center"><span className="rounded-full bg-kac-gold px-2 font-heading">{number}</span><Text variant="emphasised" color="iron">{label}</Text><Text variant="note" color="iron-light">{detail}</Text></div>)}</div>
  </RulebookFigure>
);

export const rulebookIllustrationsBySectionId: Readonly<Record<string, () => JSX.Element>> = {
  "what-you-need-to-play": CompleteTableSetup,
  effect: EffectEquation,
  "characters-expertise-stunts-assets": PhysicalAssetComposition,
  "core-action-loop": CoreActionLoopV2,
  actors: RemainingToughness,
  "turn-based-play": ActorInitiative,
  "locations-zones-movement-range": ZonesAndRange,
  catastrophe: CatastropheFlowV2,
  counters: CounterTracking,
};

export const rulebookIllustrationsBySubsectionId: Readonly<Record<string, () => JSX.Element>> = {
  "7-2-distress": StatusThresholds,
  "9-2-stunts": StuntCardIllustration,
  "9-3-assets": AssetCardIllustration,
  "9-4-consumables": ConsumableCardIllustration,
  "example-two-valid-fumbles": FumbleBranchesV2,
};
