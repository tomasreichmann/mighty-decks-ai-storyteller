import { GameCardView } from "../adventure-module/GameCardView";
import type { ReactNode } from "react";
import { ActorCard } from "../cards/ActorCard";
import { AssetCard } from "../cards/AssetCard";
import { CounterCard } from "../cards/CounterCard";
import { CardBoundary } from "../common/CardBoundary";
import { Label } from "../common/Label";
import { Text } from "../common/Text";
import { resolveGameCard, type GameCardType } from "../../lib/markdownGameComponents";
import { DieMarker } from "./DieMarker";
import { ActorCompositionFigure, AssetCompositionFigure } from "./RulesCardComposition";
import { CompleteTableSetup, CoreActionLoop, ActorInitiative, ZonesAndRange } from "./RulesBoardIllustrations";
import styles from "./RulesRulebookContent.module.css";

const outcomeCardClassName = "w-[6rem]";
const trackingCardClassName = "w-[10rem]";
const fumbleCardClassName = "w-[6.5rem]";
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
    summary="A Fumble most likely fails, but the Storyteller may allow partial success with a serious Complication. The canonical example above gives the full rule text."
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

export const FumbleBranchesV2 = (): JSX.Element => (
  <RulebookFigure title="Two valid Fumbles" summary="A Fumble most likely fails, but the Storyteller may allow partial success with a serious Complication.">
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

export const rulebookIllustrationsBySectionId: Readonly<Record<string, () => JSX.Element>> = {
  "what-you-need-to-play": CompleteTableSetup,
  effect: EffectEquation,
  "characters-expertise-stunts-assets": PhysicalAssetComposition,
  "core-action-loop": CoreActionLoop,
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
  "building-an-asset-card": AssetCompositionFigure,
  "building-an-actor-card": ActorCompositionFigure,
  "example-two-valid-fumbles": FumbleBranchesV2,
};
