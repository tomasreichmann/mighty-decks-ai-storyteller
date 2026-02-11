import type { ComponentProps, ReactNode } from "react";
import { cn } from "../../utils/cn";

export interface CardPart {
  iconUri?: string;
  deckName?: ReactNode;
  typeIconUri?: string;
  title?: ReactNode;
  effect?: ReactNode;
}

interface LegacyCardProps {
  iconUri?: string;
  deck?: ReactNode;
  typeIconUri?: string;
  title?: ReactNode;
  effect?: ReactNode;
  modifier?: ReactNode;
  modifierDeck?: ReactNode;
  modifierTypeIconUri?: string;
  modifierEffect?: ReactNode;
  modifierIconUri?: string;
}

type CardProps = Omit<ComponentProps<"article">, "title"> &
  LegacyCardProps & {
    base?: CardPart;
    modifierPart?: CardPart;
    baseHeaderIconUri?: string;
    backgroundUri?: string;
  };

interface CardHeaderProps {
  deckName?: ReactNode;
  typeIconUri?: string;
  smallIconUri?: string;
  className?: string;
}

const CardHeader = ({
  deckName,
  typeIconUri,
  smallIconUri,
  className = "",
}: CardHeaderProps): JSX.Element => {
  return (
    <div
      className={cn(
        "flex h-[1.3rem] min-w-0 items-center gap-1 text-[0.62rem] uppercase leading-none tracking-[0.06em] text-kac-bone-dark",
        className,
      )}
    >
      {smallIconUri ? (
        <img
          src={smallIconUri}
          alt=""
          aria-hidden="true"
          className="h-4 w-4 shrink-0 object-contain"
        />
      ) : (
        <span className="h-4 w-4 shrink-0" aria-hidden="true" />
      )}
      <span className="ml-auto truncate text-right">{deckName}</span>
      {typeIconUri ? (
        <img
          src={typeIconUri}
          alt=""
          aria-hidden="true"
          className="h-3.5 w-3.5 shrink-0 object-contain opacity-75"
        />
      ) : (
        <span className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      )}
    </div>
  );
};

const hasPartContent = (part: CardPart | undefined): boolean =>
  Boolean(
    part?.iconUri ||
      part?.deckName ||
      part?.typeIconUri ||
      part?.title ||
      part?.effect,
  );

export const Card = ({
  base,
  modifierPart,
  baseHeaderIconUri,
  backgroundUri = "/backgrounds/paper-with-image-shadow.png",
  iconUri,
  deck,
  typeIconUri,
  title,
  effect,
  modifier,
  modifierDeck,
  modifierTypeIconUri,
  modifierEffect,
  modifierIconUri,
  className = "",
  ...restProps
}: CardProps): JSX.Element => {
  const resolvedBase: CardPart = base ?? {
    iconUri,
    deckName: deck,
    typeIconUri,
    title,
    effect,
  };

  const legacyModifierPart: CardPart = {
    iconUri: modifierIconUri,
    deckName: modifierDeck,
    typeIconUri: modifierTypeIconUri,
    title: modifier,
    effect: modifierEffect,
  };

  const resolvedModifier = hasPartContent(modifierPart)
    ? modifierPart
    : hasPartContent(legacyModifierPart)
      ? legacyModifierPart
      : undefined;

  const showBaseHeader =
    hasPartContent(resolvedBase) || Boolean(baseHeaderIconUri);
  const showModifierHeader = hasPartContent(resolvedModifier);

  return (
    <article
      className={cn(
        "relative isolate aspect-[204/332] w-[204px] max-w-full overflow-hidden rounded-[0.55rem]",
        "border border-kac-bone-dark/70 bg-kac-bone-light shadow-[3px_3px_0_0_#121b23]",
        "font-ui text-kac-iron-light",
        className,
      )}
      {...restProps}
    >
      <img
        src={backgroundUri}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div className="relative z-10 flex h-full flex-col px-[0.6rem] pb-[0.55rem] pt-[0.45rem]">
        {showBaseHeader ? (
          <CardHeader
            smallIconUri={baseHeaderIconUri ?? resolvedBase.iconUri}
            deckName={resolvedBase.deckName}
            typeIconUri={resolvedBase.typeIconUri}
          />
        ) : null}

        {showModifierHeader ? (
          <div className="pointer-events-none absolute right-[0.35rem] top-[2rem] w-[7.2rem] origin-top-right rotate-90">
            <CardHeader
              deckName={resolvedModifier?.deckName}
              typeIconUri={resolvedModifier?.typeIconUri}
              smallIconUri={undefined}
            />
          </div>
        ) : null}

        <div className="relative mt-[0.15rem] h-[7.85rem] shrink-0">
          {resolvedBase.iconUri ? (
            <img
              src={resolvedBase.iconUri}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 m-auto h-full w-full object-contain"
            />
          ) : null}
          {resolvedModifier?.iconUri ? (
            <img
              src={resolvedModifier.iconUri}
              alt=""
              aria-hidden="true"
              className="absolute right-[22%] top-[17%] h-[2.2rem] w-[2.2rem] object-contain"
            />
          ) : null}
        </div>

        <div className="min-h-[1.1em] px-2 text-center font-heading text-[1.12rem] leading-none text-kac-iron-light">
          {resolvedModifier?.title ?? <span aria-hidden="true">&nbsp;</span>}
        </div>
        <div className="min-h-[1.15em] px-1 text-center font-heading text-[2rem] leading-none text-kac-iron">
          {resolvedBase.title ?? <span aria-hidden="true">&nbsp;</span>}
        </div>

        <div className="mt-1 flex min-h-0 flex-1 flex-col">
          <div className="flex h-[5.1em] items-end justify-center px-2 text-center text-[0.96rem] leading-[1.24]">
            {resolvedBase.effect ?? <span aria-hidden="true">&nbsp;</span>}
          </div>
          <div className="mt-[0.15rem] flex h-[2.6em] items-start justify-center border-t border-kac-bone-dark/35 px-2 pt-[0.2rem] text-center text-[0.9rem] leading-[1.2]">
            {resolvedModifier?.effect ?? <span aria-hidden="true">&nbsp;</span>}
          </div>
        </div>
      </div>
    </article>
  );
};
