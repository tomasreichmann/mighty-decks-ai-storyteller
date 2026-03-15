import React from "react";
import type { CounterIconSlug } from "@mighty-decks/spec/counterCards";
import { getCounterIconUri } from "../../data/counterCards";
import { cn } from "../../utils/cn";
import { LayeredCard, type LayeredCardProps } from "./LayeredCard";

void React;

const formatCounterValue = (currentValue: number, maxValue?: number): string =>
  typeof maxValue === "number" ? `${currentValue} / ${maxValue}` : `${currentValue}`;

interface CounterControlButtonProps {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  children: string;
}

const CounterControlButton = ({
  label,
  onClick,
  disabled = false,
  children,
}: CounterControlButtonProps): JSX.Element => (
  <button
    type="button"
    aria-label={label}
    disabled={disabled || !onClick}
    onMouseDown={(event) => {
      event.preventDefault();
      event.stopPropagation();
    }}
    onClick={(event) => {
      event.preventDefault();
      event.stopPropagation();
      onClick?.();
    }}
    className="inline-flex h-5 w-5 items-center justify-center rounded-[0.2rem] border border-kac-iron/35 bg-[#f5ead6] font-ui text-[11px] font-bold leading-none text-kac-iron/80 transition duration-100 hover:bg-[#f8eedf] active:translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-55"
  >
    {children}
  </button>
);

export interface CounterCardProps
  extends Omit<
    LayeredCardProps,
    | "imageUri"
    | "noun"
    | "nounDeck"
    | "nounCornerIcon"
    | "nounEffect"
    | "adjective"
    | "adjectiveEffect"
  > {
  iconSlug: CounterIconSlug;
  title: string;
  currentValue: number;
  maxValue?: number;
  description?: string;
  onIncrement?: () => void;
  onDecrement?: () => void;
  onIncrementMaxValue?: () => void;
  onDecrementMaxValue?: () => void;
}

export const CounterCard = ({
  iconSlug,
  title,
  currentValue,
  maxValue,
  description,
  onIncrement,
  onDecrement,
  onIncrementMaxValue,
  onDecrementMaxValue,
  className,
  ...restProps
}: CounterCardProps): JSX.Element => {
  const canDecrement = currentValue > 0;
  const canIncrement =
    typeof maxValue === "number" ? currentValue < maxValue : true;
  const showCurrentControls = Boolean(onIncrement || onDecrement);
  const hasMaxValue = typeof maxValue === "number";
  const canDecrementMaxValue = hasMaxValue && maxValue > 0;
  const showMaxControls = hasMaxValue && Boolean(onIncrementMaxValue || onDecrementMaxValue);
  const adjective = (
    <span className="inline-flex items-center gap-1 text-kac-iron">
      {showCurrentControls ? (
        <>
          <CounterControlButton
            label={`Decrease ${title}`}
            onClick={onDecrement}
            disabled={!canDecrement}
          >
            -
          </CounterControlButton>
          <CounterControlButton
            label={`Increase ${title}`}
            onClick={onIncrement}
            disabled={!canIncrement}
          >
            +
          </CounterControlButton>
        </>
      ) : null}
      <span>{currentValue}</span>
      {hasMaxValue ? (
        <>
          <span>/</span>
          <span>{maxValue}</span>
        </>
      ) : null}
      {showMaxControls ? (
        <>
          <CounterControlButton
            label={`Decrease max ${title}`}
            onClick={onDecrementMaxValue}
            disabled={!canDecrementMaxValue}
          >
            -
          </CounterControlButton>
          <CounterControlButton
            label={`Increase max ${title}`}
            onClick={onIncrementMaxValue}
            disabled={false}
          >
            +
          </CounterControlButton>
        </>
      ) : null}
    </span>
  );

  return (
    <div className={cn("relative inline-flex max-w-full", className)}>
      <LayeredCard
        imageUri={getCounterIconUri(iconSlug)}
        noun={title}
        nounCornerIcon="/types/counter.png"
        adjective={hasMaxValue || showCurrentControls || showMaxControls ? adjective : formatCounterValue(currentValue, maxValue)}
        nounEffect={description?.trim().length ? description : undefined}
        className="w-full max-w-[13rem]"
        nounClassName="text-[18px] text-kac-iron"
        adjectiveClassName="text-[16px] text-kac-iron"
        nounEffectClassName="px-3 pb-2 text-[10px] leading-[1.25] text-kac-iron-light"
        {...restProps}
      />
    </div>
  );
};
