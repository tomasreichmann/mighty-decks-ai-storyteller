import type { ComponentProps, ReactNode } from "react";
import { useId } from "react";
import { cn } from "../../utils/cn";

export interface LayeredCardProps extends Omit<
  ComponentProps<"article">,
  "title"
> {
  backgroundUri?: string;
  imageUri?: string;
  imageOverlayUri?: string;
  noun?: ReactNode;
  nounEffect?: ReactNode;
  nounDeck?: ReactNode;
  nounCornerIcon?: string;
  adjective?: ReactNode;
  adjectiveEffect?: ReactNode;
  adjectiveDeck?: ReactNode;
  adjectiveCornerIcon?: string;
  nounClassName?: string;
  adjectiveClassName?: string;
  nounEffectClassName?: string;
  adjectiveEffectClassName?: string;
}

interface SvgHtmlTextProps {
  x: number;
  y: number;
  width: number;
  height: number;
  className?: string;
  children?: ReactNode;
}

const toInlineText = (value: ReactNode): string => {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  return "";
};

const SvgHtmlText = ({
  x,
  y,
  width,
  height,
  className,
  children,
}: SvgHtmlTextProps): JSX.Element => {
  return (
    <foreignObject x={x} y={y} width={width} height={height}>
      <div
        className={cn(
          "flex h-full w-full items-center justify-center text-center text-kac-iron-light",
          className,
        )}
      >
        {children}
      </div>
    </foreignObject>
  );
};

export const LayeredCard = ({
  backgroundUri = "/backgrounds/paper-with-image-shadow.png",
  imageUri,
  imageOverlayUri,
  noun = " ",
  nounEffect,
  nounDeck,
  nounCornerIcon,
  adjective,
  adjectiveEffect,
  adjectiveDeck,
  adjectiveCornerIcon,
  nounClassName,
  adjectiveClassName,
  nounEffectClassName,
  adjectiveEffectClassName,
  className,
  ...restProps
}: LayeredCardProps): JSX.Element => {
  const uniqueId = useId().replace(/:/g, "");
  const imageClipId = `${uniqueId}-image-clip`;
  const backgroundPatternId = `${uniqueId}-background-pattern`;
  const deckLabel = toInlineText(nounDeck);
  const adjectiveDeckLabel = toInlineText(adjectiveDeck);

  return (
    <article
      className={cn(
        "relative aspect-[204/332] w-[204px] max-w-full overflow-hidden rounded-[0.6rem]",
        className,
      )}
      {...restProps}
    >
      <svg
        viewBox="0 0 204 332"
        className="h-full w-full"
        role="img"
        aria-label={toInlineText(noun) || "Card"}
      >
        <defs>
          <pattern
            id={backgroundPatternId}
            width="1"
            height="1"
            patternUnits="objectBoundingBox"
          >
            <image
              href={backgroundUri}
              width="204"
              height="332"
              preserveAspectRatio="xMidYMid slice"
            />
          </pattern>
          <clipPath id={imageClipId}>
            <rect x="24" y="44" width="156" height="98" rx="6" />
          </clipPath>
        </defs>

        <rect
          x="1"
          y="1"
          width="202"
          height="330"
          rx="11"
          fill={`url(#${backgroundPatternId})`}
        />
        <rect
          x="1"
          y="1"
          width="202"
          height="330"
          rx="11"
          fill="none"
          stroke="#6d5435"
          strokeWidth="2"
        />

        {imageUri ? (
          <image
            href={imageUri}
            x="15"
            y="12"
            width="17"
            height="17"
            preserveAspectRatio="xMidYMid meet"
          />
        ) : null}

        <text
          x="168"
          y="27"
          textAnchor="end"
          className="fill-kac-bone-darker"
          style={{
            fontFamily: "Shantell Sans, cursive",
            fontSize: "9px",
            fontWeight: 700,
          }}
        >
          {deckLabel}
        </text>

        {nounCornerIcon ? (
          <image
            href={nounCornerIcon}
            x="173"
            y="11"
            width="18"
            height="18"
            preserveAspectRatio="xMidYMid meet"
          />
        ) : null}

        {imageUri ? (
          <g clipPath={`url(#${imageClipId})`}>
            <image
              href={imageUri}
              x="24"
              y="44"
              width="156"
              height="98"
              preserveAspectRatio="xMidYMid meet"
            />
            {imageOverlayUri ? (
              <image
                href={imageOverlayUri}
                x="24"
                y="44"
                width="156"
                height="98"
                preserveAspectRatio="xMidYMid meet"
                opacity="0.8"
              />
            ) : null}
          </g>
        ) : null}

        {adjectiveDeckLabel || adjectiveCornerIcon ? (
          <g transform="translate(192 160) rotate(90)">
            {adjectiveCornerIcon ? (
              <image
                href={adjectiveCornerIcon}
                x="-55"
                y="-7"
                width="14"
                height="14"
                preserveAspectRatio="xMidYMid meet"
              />
            ) : null}
            <text
              x="50"
              y="4"
              textAnchor="end"
              className="fill-kac-bone-darker"
              style={{
                fontFamily: "Shantell Sans, cursive",
                fontSize: "8px",
                fontWeight: 700,
              }}
            >
              {adjectiveDeckLabel}
            </text>
          </g>
        ) : null}

        {adjective ? (
          <SvgHtmlText
            x={16}
            y={148}
            width={172}
            height={20}
            className={cn(
              "font-md-heading text-[16px] font-bold leading-none tracking-tight",
              adjectiveClassName,
            )}
          >
            {adjective}
          </SvgHtmlText>
        ) : null}

        <SvgHtmlText
          x={16}
          y={167}
          width={172}
          height={24}
          className={cn(
            "font-md-heading text-[20px] font-bold leading-none tracking-tight",
            nounClassName,
          )}
        >
          {noun}
        </SvgHtmlText>

        <SvgHtmlText
          x={16}
          y={194}
          width={172}
          height={84}
          className={cn(
            "items-end justify-center px-2 pb-1 text-[11px] leading-[1.2] text-kac-iron-light whitespace-pre-wrap",
            nounEffectClassName,
          )}
        >
          {nounEffect ?? <span aria-hidden="true">&nbsp;</span>}
        </SvgHtmlText>

        <SvgHtmlText
          x={16}
          y={280}
          width={172}
          height={38}
          className={cn(
            "px-2 text-[11px] leading-[1.2] text-kac-iron whitespace-pre-wrap",
            adjectiveEffectClassName,
          )}
        >
          {adjectiveEffect ?? <span aria-hidden="true">&nbsp;</span>}
        </SvgHtmlText>
      </svg>
    </article>
  );
};
