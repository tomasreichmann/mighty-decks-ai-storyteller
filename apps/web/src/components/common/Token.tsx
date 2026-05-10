import type { CSSProperties, HTMLAttributes } from "react";
import { cn } from "../../utils/cn";
import { Button } from "./Button";
import { resolveHeadingHighlightColorClass } from "./headingHighlightColor";

export type TokenColor =
  | "gold"
  | "fire"
  | "blood"
  | "bone"
  | "steel"
  | "iron"
  | "skin"
  | "cloth"
  | "curse"
  | "monster";

export type TokenSize = "sm" | "md" | "lg" | "xl";
export type TokenPing = boolean | number | "infinite";

export interface TokenProps extends Omit<HTMLAttributes<HTMLDivElement>, "color"> {
  imageUrl: string;
  imageAlt?: string;
  label?: string;
  color?: TokenColor;
  size?: TokenSize;
  selected?: boolean;
  ping?: TokenPing;
  disabled?: boolean;
}

type TokenPingStyle = CSSProperties & {
  "--token-ping-count"?: number | "infinite";
};

const tokenSizeClassMap: Record<TokenSize, string> = {
  sm: "h-[0.5in] w-[0.5in]",
  md: "h-[1in] w-[1in]",
  lg: "h-[2in] w-[2in]",
  xl: "h-[3in] w-[3in]",
};

const tokenLabelSizeClassMap: Record<TokenSize, string> = {
  sm: "max-w-[0.8in] px-1.5 pt-1 pb-0.5 text-[0.55rem]/none",
  md: "max-w-[1.25in] px-2 pt-1 pb-0.5 text-[0.65rem]/none",
  lg: "max-w-[2.25in] px-3 pt-1.5 pb-1 text-xs/none",
  xl: "max-w-[3.25in] px-4 pt-2 pb-1.5 text-sm/none",
};

const tokenLabelColorClassMap: Record<TokenColor, string> = {
  gold: "bg-kac-gold text-kac-iron",
  fire: "bg-kac-fire-light text-kac-iron-dark",
  blood: "bg-kac-blood-light text-kac-iron-dark",
  bone: "bg-kac-bone-light text-kac-iron-dark",
  steel: "bg-kac-steel-light text-kac-iron-dark",
  iron: "bg-kac-iron text-kac-steel-light",
  skin: "bg-kac-skin text-kac-iron-dark",
  cloth: "bg-kac-cloth-light text-kac-iron-dark",
  curse: "bg-kac-curse-light text-kac-iron-dark",
  monster: "bg-kac-monster-light text-kac-iron-dark",
};

export const tokenColors = [
  "gold",
  "fire",
  "blood",
  "bone",
  "steel",
  "iron",
  "skin",
  "cloth",
  "curse",
  "monster",
] as const satisfies readonly TokenColor[];

export const tokenSizes = ["sm", "md", "lg", "xl"] as const satisfies readonly TokenSize[];

export const Token = ({
  imageUrl,
  imageAlt,
  label,
  color = "gold",
  size = "md",
  selected = false,
  ping = false,
  disabled = false,
  className = "",
  ...htmlProps
}: TokenProps): JSX.Element => {
  const accessibleName = imageAlt ?? label ?? "Token";
  const highlightClassName = resolveHeadingHighlightColorClass(color);
  const pingCount =
    ping === true ? 1 : ping === "infinite" ? "infinite" : typeof ping === "number" && ping > 0 ? ping : null;
  const pingStyle: TokenPingStyle | undefined =
    pingCount === null ? undefined : { "--token-ping-count": pingCount };

  return (
    <div
      className={cn(
        "token inline-flex flex-col items-center text-center",
        className,
      )}
      {...htmlProps}
    >
      <div className="token__stage relative">
        {selected ? (
          <span
            className={cn(
              "token__selected-ring pointer-events-none absolute inset-[-14%] rounded-full bg-current opacity-30",
              highlightClassName,
            )}
          />
        ) : null}
        {pingCount !== null ? (
          <span
            className={cn(
              "token__ping-ring pointer-events-none absolute inset-[-14%] rounded-full bg-current opacity-0",
              highlightClassName,
              "animate-token-ping",
            )}
            style={pingStyle}
          />
        ) : null}
        <Button
          variant="circle"
          color={color}
          size="md"
          disabled={disabled}
          aria-label={accessibleName}
          className={cn(
            "token__button pointer-events-none relative z-10 overflow-hidden border-[3px] p-0",
            tokenSizeClassMap[size],
          )}
        >
          <img
            src={imageUrl}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full rounded-full object-cover object-center"
          />
          <span className="pointer-events-none absolute inset-0 rounded-full shadow-[inset_0_0_0_4px_rgba(18,27,35,0.22),inset_0_10px_18px_rgba(255,255,255,0.18)]" />
        </Button>

        {label ? (
          <span
            className={cn(
              "label token__label absolute bottom-0 left-1/2 z-20 inline-flex w-fit -translate-x-1/2 translate-y-1/4 items-center justify-center border-2 border-kac-iron font-heading font-bold uppercase tracking-wide shadow-[3px_3px_0_0_#121b23]",
              tokenLabelColorClassMap[color],
              tokenLabelSizeClassMap[size],
            )}
          >
            {label}
          </span>
        ) : null}
      </div>
    </div>
  );
};
