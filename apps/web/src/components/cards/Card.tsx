import type { ComponentProps, ReactNode } from "react";
import { cn } from "../../utils/cn";
import { ImageBackground } from "../common/ImageBackground";

export interface CardPart {
  iconUri?: string;
  deckName?: ReactNode;
  typeIconUri?: string;
  title?: ReactNode;
  effect?: ReactNode;
}

export type CardProps = Omit<ComponentProps<"article">, "title"> & {
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
  backgroundUri?: string;
  titleClassName?: string;
  effectClassName?: string;
  modifierClassName?: string;
  modifierEffectClassName?: string;
};

interface CardHeaderProps {
  deck?: ReactNode;
  typeIconUri?: string;
  iconUri?: string;
  className?: string;
}

const CardHeader = ({
  deck,
  typeIconUri,
  iconUri,
  className = "",
}: CardHeaderProps): JSX.Element => {
  return (
    <div
      className={cn(
        "CardHeader flex flex-row items-center gap-1 z-10 relative",
        className,
      )}
    >
      {iconUri ? (
        <img
          src={iconUri}
          alt=""
          aria-hidden="true"
          className="h-6 text-kac-steel-dark"
        />
      ) : null}
      <div
        className={cn(
          "flex-1 text-kac-bone-dark text-right text-[0.6rem] leading-none",
        )}
      >
        {deck}
      </div>
      {typeIconUri && (
        <img
          src={typeIconUri}
          alt=""
          aria-hidden="true"
          className="text-opacity-50 h-4"
        />
      )}
    </div>
  );
};

export const Card = ({
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
  className,
  titleClassName,
  effectClassName,
  modifierClassName,
  modifierEffectClassName,
  ...restProps
}: CardProps): JSX.Element => {
  const showBaseHeader = Boolean(title);
  const showModifierHeader = Boolean(modifierDeck);

  return (
    <article
      className={cn(
        "relative aspect-[204/332] w-[204px] max-w-full overflow-hidden rounded-[0.55rem]",
        "border border-[#c7a47f]/65 bg-kac-bone-light shadow-[0_1px_0_0_#a98965]",
        "font-ui text-kac-iron-light",
        "flex flex-col justify-center items-stretch",
        className,
      )}
      {...restProps}
    >
      <ImageBackground
        imageUri={backgroundUri}
        aria-hidden="true"
        className="absolute top-[-3mm] left-[-3mm] right-[-3mm] bottom-[-3mm]"
      />

      <div className="flex-1 relative flex flex-col justify-center items-stretch p-3 gap-2 z-10">
        <div className="relative h-[24px]">
          {showBaseHeader ? (
            <CardHeader
              iconUri={iconUri}
              deck={deck}
              typeIconUri={typeIconUri}
            />
          ) : null}
          {showModifierHeader && (
            <div className="absolute top-full left-0 right-0 h-[24px] -rotate-90 origin-right translate-x-[-4px] translate-y-[-8px]">
              <CardHeader
                iconUri={undefined}
                className="z-10"
                typeIconUri={typeIconUri}
                deck={modifierDeck}
              />
            </div>
          )}
        </div>

        <div className="CardBody flex-1 relative flex flex-col justify-center items-stretch gap-2 z-10 pb-3">
          <div className="flex-1 basis-[60%] flex flex-col items-center justify-end gap-2">
            <div className="flex-1 relative self-stretch ">
              {iconUri && (
                <ImageBackground
                  imageUri={iconUri}
                  className={cn("absolute w-full h-24 bg-contain")}
                />
              )}
            </div>
            {modifier && (
              <div
                className={cn(
                  "font-md-heading text-xl font-bold tracking-tighter leading-none text-kac-iron-light text-center h-[1em]",
                  modifierClassName,
                )}
              >
                {modifier}
              </div>
            )}
            {title && (
              <div
                className={cn(
                  "font-md-heading text-xl font-bold tracking-tighter leading-none text-kac-iron-light text-center h-[1em]",
                  titleClassName,
                )}
              >
                {title}
              </div>
            )}
            <div
              className={cn(
                "text-xs text-center text-kac-iron-light text-balance h-[5em] leading-tight tracking-tight flex flex-col justify-end items-center",
                effectClassName,
              )}
            >
              {effect}
            </div>
            <div
              className={cn(
                "text-xs text-center text-kac-iron-light text-balance h-[2.5em] leading-tight tracking-tight",
                modifierClassName,
              )}
            >
              {modifierEffect}
            </div>
          </div>
        </div>
        {/* 
        <div className="min-h-[1.05em] px-2 text-center font-heading text-[1.04rem] leading-none text-kac-iron-light">
          {title ?? <span aria-hidden="true">&nbsp;</span>}
        </div>
        <div
          className={cn(
            "Text font-md-heading font-bold tracking-tighter text-xl leading-none text-center h-[1em]",
            "text-[#d99600]",
          )}
        >
          {title ?? <span aria-hidden="true">&nbsp;</span>}
        </div>

        <div className="mt-1 flex min-h-0 flex-1 flex-col">
          <div className="flex h-[5.15em] items-end justify-center px-2 text-center text-[0.92rem] leading-[1.2] text-kac-iron-dark">
            {effect ?? <span aria-hidden="true">&nbsp;</span>}
          </div>
          <div className="mt-[0.18rem] flex h-[2.72em] items-start justify-center border-t border-kac-bone-dark/35 px-2 pt-[0.2rem] text-center text-[0.88rem] leading-[1.16] text-kac-iron-dark">
            {effect ?? <span aria-hidden="true">&nbsp;</span>}
          </div>
        </div> */}
      </div>
    </article>
  );
};
