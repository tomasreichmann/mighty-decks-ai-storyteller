import type { CSSProperties, ReactNode } from "react";
import type {
  ActorBaseLayerSlug,
  ActorTacticalRoleSlug,
  ActorTacticalSpecialSlug,
} from "@mighty-decks/spec/actorCards";
import {
  actorTacticalRoleMap,
  actorTacticalSpecialMap,
  getActorBaseImageUri,
  getActorSpecialOverlayUri,
  getActorTextIconUri,
  type ActorCardAction,
} from "../../data/actorCards";
import { cn } from "../../utils/cn";
import { LayeredCard, type LayeredCardProps } from "./LayeredCard";

interface ActorCardTextWithIconsProps {
  text: string;
  iconClassName?: string;
}

const tokenPattern = /(\[[^\]]+\])/g;
const iconTokenPattern = /^\[([a-zA-Z_]+)(\d*)\]$/;

const ActorCardTextWithIcons = ({
  text,
  iconClassName,
}: ActorCardTextWithIconsProps): JSX.Element => {
  const fragments = text.split(tokenPattern).filter((fragment) => fragment !== "");

  return (
    <>
      {fragments.map((fragment, fragmentIndex) => {
        const iconNameMatch = fragment.match(iconTokenPattern);
        if (!iconNameMatch) {
          return <span key={fragmentIndex}>{fragment}</span>;
        }

        const [, iconName, iconCountString = "1"] = iconNameMatch;
        const iconCount = Number.parseInt(iconCountString || "1", 10);
        if (!Number.isFinite(iconCount) || iconCount < 1) {
          return <span key={fragmentIndex}>{fragment}</span>;
        }

        return (
          <span key={fragmentIndex} className="inline-flex items-center">
            {Array.from({ length: iconCount }).map((_, iconIndex) => (
              <img
                key={`${iconName}-${iconIndex}`}
                src={getActorTextIconUri(iconName)}
                alt=""
                aria-hidden="true"
                className={cn(
                  "inline-block h-4 w-4 object-contain align-middle",
                  iconClassName,
                  iconIndex > 0 ? "-ml-1" : "",
                )}
              />
            ))}
          </span>
        );
      })}
    </>
  );
};

const getIconTextLength = (text: string): number => {
  const fragments = text.split(tokenPattern).filter((fragment) => fragment !== "");
  return fragments.reduce((length, fragment) => {
    const iconNameMatch = fragment.match(iconTokenPattern);
    if (!iconNameMatch) {
      return length + fragment.length * 0.25;
    }
    const [, , iconCountString = "1"] = iconNameMatch;
    const iconCount = Number.parseInt(iconCountString || "1", 10);
    return Number.isFinite(iconCount) && iconCount > 0 ? length + iconCount : length;
  }, 0);
};

const renderAction = (
  action: ActorCardAction | undefined,
  actionIndex: number,
): ReactNode => {
  if (!action) {
    return null;
  }
  if (typeof action === "string") {
    return (
      <div key={actionIndex} className="flex min-h-5 flex-wrap items-center justify-end">
        <ActorCardTextWithIcons
          text={action}
          iconClassName={getIconTextLength(action) > 5 ? "mx-[-1px]" : undefined}
        />
      </div>
    );
  }

  const { type, effect, splash, range, count } = action;

  return (
    <div key={actionIndex} className="flex min-h-5 flex-wrap items-center justify-end gap-0.5">
      {count && count > 1 ? <span>{count}x</span> : null}
      <img
        src={getActorTextIconUri(type)}
        alt=""
        aria-hidden="true"
        className="h-4 w-4 object-contain"
      />
      {effect.map((effectOrJoin, effectIndex) => {
        if (typeof effectOrJoin === "string") {
          return <span key={effectIndex}>{effectOrJoin}</span>;
        }
        return (
          <span key={effectIndex} className="inline-flex items-center">
            {Array.from({ length: effectOrJoin.amount }).map((_, iconIndex) => (
              <img
                key={`${effectOrJoin.effectType}-${effectIndex}-${iconIndex}`}
                src={getActorTextIconUri(effectOrJoin.effectType)}
                alt=""
                aria-hidden="true"
                className={cn(
                  "h-4 w-4 object-contain",
                  iconIndex > 0 ? "-ml-1" : "",
                )}
              />
            ))}
          </span>
        );
      })}
      {splash ? (
        <img
          src={getActorTextIconUri("splash")}
          alt=""
          aria-hidden="true"
          className="h-4 w-4 object-contain"
        />
      ) : null}
      {range ? (
        <>
          <img
            src={getActorTextIconUri("range")}
            alt=""
            aria-hidden="true"
            className="h-4 w-4 object-contain"
          />
          <span>{range}</span>
        </>
      ) : null}
    </div>
  );
};

const getLayeredActorCardProps = (
  roleSlug: ActorTacticalRoleSlug,
  specialSlug?: ActorTacticalSpecialSlug,
): LayeredCardProps => {
  const role = actorTacticalRoleMap[roleSlug];
  const special = specialSlug ? actorTacticalSpecialMap[specialSlug] : undefined;
  const specialToughnessBonus =
    special && "toughnessBonus" in special ? special.toughnessBonus : undefined;
  const specialActionBonuses =
    special && "actionBonuses" in special ? special.actionBonuses : undefined;
  const specialEffect =
    special && "special" in special ? special.special : undefined;

  const leftColumn = (
    <>
      <div className="flex min-h-5 items-center justify-end">
        {role.toughness ? <ActorCardTextWithIcons text={role.toughness} /> : null}
      </div>
      {(role.actions ?? []).map((action, index) => renderAction(action, index))}
    </>
  );

  const rightColumn = special ? (
    <>
      <div className="flex min-h-5 items-center">
        {specialToughnessBonus ? (
          <ActorCardTextWithIcons text={specialToughnessBonus} />
        ) : null}
      </div>
      {(specialActionBonuses ?? []).map((actionBonus: string | null, index: number) =>
        actionBonus ? (
          <div key={`bonus-${index}`} className="flex min-h-5 items-center">
            <ActorCardTextWithIcons text={actionBonus} />
          </div>
        ) : (
          <div key={`bonus-${index}`} className="min-h-5" />
        ),
      )}
    </>
  ) : null;

  return {
    noun: role.name,
    nounDeck: role.deck,
    nounCornerIcon: "/types/actor.png",
    adjective: special?.name,
    adjectiveDeck: special?.deck,
    adjectiveCornerIcon: special ? "/types/actor.png" : undefined,
    adjectiveEffect: specialEffect ? (
      <span className="font-semibold">
        <ActorCardTextWithIcons text={specialEffect} iconClassName="mx-[-1px]" />
      </span>
    ) : undefined,
    imageOverlayUri: special ? getActorSpecialOverlayUri(special.slug) : undefined,
    nounEffect: (
      <div className="flex w-full flex-row gap-2 font-semibold">
        <div className="basis-2/3 text-right">{leftColumn}</div>
        <div className="basis-1/3 text-left">{rightColumn}</div>
      </div>
    ),
  };
};

export interface ActorCardProps
  extends Omit<LayeredCardProps, "imageUri" | "imageOverlayUri" | "noun" | "nounDeck" | "nounCornerIcon" | "adjective" | "adjectiveDeck" | "adjectiveCornerIcon" | "adjectiveEffect" | "nounEffect"> {
  baseLayerSlug: ActorBaseLayerSlug;
  tacticalRoleSlug: ActorTacticalRoleSlug;
  tacticalSpecialSlug?: ActorTacticalSpecialSlug;
  imageFit?: CSSProperties["objectFit"];
  imagePosition?: CSSProperties["objectPosition"];
}

export const ActorCard = ({
  baseLayerSlug,
  tacticalRoleSlug,
  tacticalSpecialSlug,
  className,
  ...restProps
}: ActorCardProps): JSX.Element => {
  const layeredProps = getLayeredActorCardProps(
    tacticalRoleSlug,
    tacticalSpecialSlug,
  );

  return (
    <LayeredCard
      imageUri={getActorBaseImageUri(baseLayerSlug)}
      className={cn("ActorCard", className)}
      {...layeredProps}
      {...restProps}
    />
  );
};
