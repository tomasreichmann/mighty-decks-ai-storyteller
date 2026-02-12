import type {
  ActiveOutcomeCheck,
  OutcomeCardType,
} from "@mighty-decks/spec/adventureState";
import { CSSProperties, useState } from "react";
import { Text } from "../common/Text";
import { Card } from "./Card";
import { ourcomeCardPropsMap } from "../../data/outcomeDeck";
import { cn } from "../../utils/cn";
import { Button } from "../common/Button";

interface OutcomeHandPanelProps {
  check?: ActiveOutcomeCheck;
  playerId: string;
  onPlayCard: (card: OutcomeCardType) => void;
  disabled?: boolean;
}

const outcomeCardSlugOrder = [
  "special-action",
  "success",
  "partial-success",
  "chaos",
  "fumble",
] as const;

const fanEdgeAngle = 15;
const fanZenithOffset = -50;
const getFanTransformStyle = (index: number, total: number): CSSProperties => {
  const fanStartAngle = -fanEdgeAngle;
  const fanEndAngle = fanStartAngle + 2 * fanEdgeAngle;
  const fanAnglePerCard = (fanEndAngle - fanStartAngle) / (total - 1);
  const angle = fanStartAngle + fanAnglePerCard * index;
  const offsetY = Math.sin((index / (total - 1)) * Math.PI) * fanZenithOffset;
  return {
    transform: `translateY(${offsetY}px) rotate(${angle}deg)`,
  };
};

export const OutcomeHandPanel = ({
  check,
  playerId,
  onPlayCard,
  disabled = false,
}: OutcomeHandPanelProps): JSX.Element => {
  const [manualExpanded, setManualExpanded] = useState(false);
  const target = check?.targets.find((entry) => entry.playerId === playerId);
  const playedCard = target?.playedCard;
  const selectionRequired = Boolean(target && !playedCard);
  const isExpanded = selectionRequired || manualExpanded;

  const panelLabel = selectionRequired && check?.prompt ? check.prompt : "";

  return (
    <div className={cn("relative")}>
      {!selectionRequired ? (
        <div className="absolute left-1/2 top-0 z-30 -translate-x-1/2 -translate-y-1/2">
          <Button
            variant="circle"
            color="gold"
            type="button"
            aria-label={
              isExpanded ? "Hide outcome cards" : "Show outcome cards"
            }
            onClick={() => setManualExpanded((current) => !current)}
            className=""
          >
            <span
              aria-hidden="true"
              className={cn(
                "block text-xs font-bold leading-none transition-transform duration-600",
                isExpanded && "rotate-180",
              )}
            >
              ▲
            </span>
          </Button>
        </div>
      ) : null}
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center pt-2 transition-opacity duration-200",
          isExpanded && panelLabel ? "opacity-100" : "opacity-0",
        )}
      >
        <div className="rounded-full border border-kac-gold-dark/40 bg-kac-bone-light/95 px-3 py-1 shadow-sm">
          <Text variant="emphasised" color="iron-light">
            {panelLabel}
          </Text>
        </div>
      </div>
      <div
        className={cn(
          "relative transition-[height,margin] overflow-hidden -mx-4 duration-300 ease-out",
          "[mask-image:linear-gradient(to_bottom,_black_0%,_black_90%,_transparent_100%)]",
          isExpanded
            ? "h-[180px] sm:h-[250px]  md:h-[330px] pb-0"
            : "h-[180px] sm:h-[200px]  md:h-[220px] -mb-[100px]",
        )}
      >
        <div
          className={cn(
            "absolute left-1/2 translate-x-[-50%] top-4 z-0 flex items-end justify-center transition-transform duration-500 ease-out",
            "scale-[0.4] translate-y-[3%] sm:scale-[0.6] sm:translate-y-[5%] md:scale-[0.8] md:translate-y-[8%] origin-top",
          )}
        >
          {outcomeCardSlugOrder.map((slug, index) => {
            const props = ourcomeCardPropsMap[slug];
            const isLockedSelection = Boolean(
              playedCard && playedCard === slug,
            );
            const canSelect = selectionRequired && !disabled;
            const cardDisabled = !canSelect;

            return (
              <div
                key={slug}
                className="relative -mx-11 shrink-0 transition-transform duration-300"
                style={getFanTransformStyle(index, outcomeCardSlugOrder.length)}
              >
                <button
                  type="button"
                  onClick={canSelect ? () => onPlayCard(slug) : undefined}
                  disabled={cardDisabled}
                  tabIndex={selectionRequired ? 0 : -1}
                  aria-label={`Play ${slug} outcome card`}
                  className={cn(
                    "relative origin-bottom transition-transform duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kac-gold-dark/70",
                    selectionRequired
                      ? "pointer-events-auto"
                      : "pointer-events-none",
                    canSelect && "hover:-translate-y-3",
                    isLockedSelection &&
                      "ring-2 ring-kac-gold-dark/70 rounded-lg",
                    cardDisabled && "cursor-default",
                  )}
                >
                  <Card
                    {...props}
                    className={cn(
                      "shadow-xl mx-10 border-x-[3px] border-y-[2px] border-kac-iron shadow-[2px_4px_0_0_#121b23]",
                      cardDisabled && "brightness-90",
                    )}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
