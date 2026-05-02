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
import {
  ActorCardTextWithIcons,
  actorBodyLineHeightClassName,
  actorBodyRowClassName,
  getIconTextLength,
} from "./ActorCardTextWithIcons";
import { LayeredCard, type LayeredCardProps } from "./LayeredCard";

const renderAction = (
  action: ActorCardAction | undefined,
  actionIndex: number,
): ReactNode => {
  if (!action) {
    return null;
  }
  if (typeof action === "string") {
    return (
      <div key={actionIndex} className={cn(actorBodyRowClassName, "flex-wrap justify-end")}>
        <ActorCardTextWithIcons
          text={action}
          iconClassName={
            getIconTextLength(action) > 5 ? "mx-[-1px]" : undefined
          }
        />
      </div>
    );
  }

  const { type, effect, splash, range, count } = action;

  return (
    <div
      key={actionIndex}
      className={cn(actorBodyRowClassName, "flex-wrap justify-end gap-0.5")}
    >
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
        <span className="inline-flex items-center whitespace-nowrap leading-[16px]">
          <img
            src={getActorTextIconUri("range")}
            alt=""
            aria-hidden="true"
            className="h-4 w-4 object-contain"
          />
          <span>{range}</span>
        </span>
      ) : null}
    </div>
  );
};

const getLayeredActorCardProps = (
  roleSlug: ActorTacticalRoleSlug,
  specialSlug?: ActorTacticalSpecialSlug,
): LayeredCardProps => {
  const role = actorTacticalRoleMap[roleSlug];
  const special = specialSlug
    ? actorTacticalSpecialMap[specialSlug]
    : undefined;
  const specialToughnessBonus =
    special && "toughnessBonus" in special ? special.toughnessBonus : undefined;
  const specialActionBonuses =
    special && "actionBonuses" in special ? special.actionBonuses : undefined;
  const specialEffect =
    special && "special" in special ? special.special : undefined;

  const leftColumn = (
    <>
      <div className={cn(actorBodyRowClassName, "justify-end")}>
        {role.toughness ? (
          <ActorCardTextWithIcons text={role.toughness} />
        ) : null}
      </div>
      {(role.actions ?? []).map((action, index) => renderAction(action, index))}
    </>
  );

  const rightColumn = special ? (
    <>
      <div className={actorBodyRowClassName}>
        {specialToughnessBonus ? (
          <ActorCardTextWithIcons text={specialToughnessBonus} />
        ) : null}
      </div>
      {(specialActionBonuses ?? []).map(
        (actionBonus: string | null, index: number) =>
          actionBonus ? (
            <div key={`bonus-${index}`} className={actorBodyRowClassName}>
              <ActorCardTextWithIcons text={actionBonus} />
            </div>
          ) : (
            <div key={`bonus-${index}`} className="min-h-4" />
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
      <div className={cn("flex min-h-4 items-center font-semibold", actorBodyLineHeightClassName)}>
        <ActorCardTextWithIcons
          text={specialEffect}
          iconClassName="mx-[-1px]"
        />
      </div>
    ) : undefined,
    imageOverlayUri: special
      ? getActorSpecialOverlayUri(special.slug)
      : undefined,
    nounEffect: (
      <div className="flex w-full flex-row gap-2 font-semibold">
        <div className="basis-2/3 text-right">{leftColumn}</div>
        <div className="basis-1/3 text-left">{rightColumn}</div>
      </div>
    ),
    nounEffectClassName:
      "px-0 pb-1 text-[11px] leading-[16px] text-kac-iron-light whitespace-pre-wrap",
  };
};

interface BaseActorCardProps extends Omit<
  LayeredCardProps,
  | "imageUri"
  | "imageOverlayUri"
  | "noun"
  | "nounDeck"
  | "nounCornerIcon"
  | "adjective"
  | "adjectiveDeck"
  | "adjectiveCornerIcon"
  | "adjectiveEffect"
  | "nounEffect"
> {
  imageFit?: CSSProperties["objectFit"];
  imagePosition?: CSSProperties["objectPosition"];
}

interface GenericActorCardProps extends BaseActorCardProps {
  kind?: "generic";
  baseLayerSlug: ActorBaseLayerSlug;
  tacticalRoleSlug: ActorTacticalRoleSlug;
  tacticalSpecialSlug?: ActorTacticalSpecialSlug;
}

interface CustomActorCardProps extends BaseActorCardProps {
  kind: "custom";
  custom: {
    imageUrl: string;
    adjective: string;
    noun: string;
    nounDescription: string;
    adjectiveDescription: string;
  };
}

export type ActorCardProps = GenericActorCardProps | CustomActorCardProps;

const getCustomLayeredActorCardProps = (
  custom: CustomActorCardProps["custom"],
): LayeredCardProps => {
  const noun = custom.noun.trim();
  const adjective = custom.adjective.trim();
  const nounDescription = custom.nounDescription.trim();
  const adjectiveDescription = custom.adjectiveDescription.trim();

  return {
    imageUri: custom.imageUrl.trim() || undefined,
    noun: noun || "Custom Actor",
    nounDeck: "custom",
    nounCornerIcon: "/types/actor.png",
    adjective: adjective || undefined,
    adjectiveDeck: adjective ? "custom" : undefined,
    adjectiveCornerIcon: adjective ? "/types/actor.png" : undefined,
    nounEffect:
      nounDescription.length > 0 ? (
        <ActorCardTextWithIcons
          text={nounDescription}
          iconClassName={getIconTextLength(nounDescription) > 5 ? "mx-[-1px]" : undefined}
        />
      ) : undefined,
    adjectiveEffect:
      adjectiveDescription.length > 0 ? (
        <div className={cn("font-semibold", actorBodyLineHeightClassName)}>
          <ActorCardTextWithIcons
            text={adjectiveDescription}
            iconClassName="mx-[-1px]"
          />
        </div>
      ) : undefined,
    nounEffectClassName:
      "px-2 pb-1 text-[11px] leading-[16px] text-kac-iron-light whitespace-pre-wrap",
    adjectiveEffectClassName:
      "px-2 text-[11px] leading-[16px] text-kac-iron whitespace-pre-wrap",
  };
};

export const ActorCard = (props: ActorCardProps): JSX.Element => {
  if (props.kind === "custom") {
    const { kind: _kind, custom, className, ...layeredRestProps } = props;
    void _kind;
    return (
      <LayeredCard
        className={cn("ActorCard", className)}
        {...getCustomLayeredActorCardProps(custom)}
        {...layeredRestProps}
      />
    );
  }

  const {
    kind: _kind,
    className,
    baseLayerSlug,
    tacticalRoleSlug,
    tacticalSpecialSlug,
    ...layeredRestProps
  } = props;
  void _kind;
  const layeredProps = getLayeredActorCardProps(
    tacticalRoleSlug,
    tacticalSpecialSlug,
  );

  return (
    <LayeredCard
      imageUri={getActorBaseImageUri(baseLayerSlug)}
      className={cn("ActorCard", className)}
      {...layeredProps}
      {...layeredRestProps}
    />
  );
};
