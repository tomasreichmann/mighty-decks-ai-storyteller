import type { PointerEvent, ReactNode } from "react";
import { rulesEffectCards } from "../../data/rulesComponents";
import type { ShipEffectType } from "../../lib/spaceship/scene/types";
import { EnergyToken } from "./EnergyToken";

const dispenserEffectTypes = [
  "injury",
  "distress",
  "complication",
  "freezing",
  "burning",
] as const satisfies readonly ShipEffectType[];

const effectCardBySlug = new Map(
  rulesEffectCards.map((card) => [card.slug, card]),
);

const effectDispensers: {
  effectType: ShipEffectType;
  label: string;
  iconUri: string;
}[] = dispenserEffectTypes.map((effectType) => {
  const card = effectCardBySlug.get(effectType);
  return {
    effectType,
    label: card?.title ?? effectType,
    iconUri: card?.iconUri ?? "/types/effect.png",
  };
});

const DispenserIconPanel = ({
  children,
}: {
  children: ReactNode;
}): JSX.Element => (
  <span className="flex aspect-[204/332] w-[4.125rem] items-center justify-center overflow-hidden rounded-sm border-2 border-kac-iron bg-kac-bone-light shadow-[1px_1px_0_0_#121b23]">
    {children}
  </span>
);

interface SpaceshipDispenserPanelProps {
  onHandlePointerDown: (event: PointerEvent<HTMLDivElement>) => void;
  onEnergyPointerDown: (event: PointerEvent<HTMLButtonElement>) => void;
  onEffectPointerDown: (
    effectType: ShipEffectType,
    event: PointerEvent<HTMLButtonElement>,
  ) => void;
}

export const SpaceshipDispenserPanel = ({
  onHandlePointerDown,
  onEnergyPointerDown,
  onEffectPointerDown,
}: SpaceshipDispenserPanelProps): JSX.Element => (
  <div
    data-spaceship-dispenser-panel
    className="pointer-events-auto flex h-full w-full flex-col items-stretch gap-2 rounded-sm border-[3px] border-kac-iron bg-[linear-gradient(180deg,rgba(255,248,204,0.96)_0%,rgba(196,214,226,0.94)_100%)] p-2 text-kac-iron shadow-[5px_5px_0_0_#121b23]"
  >
    <div
      data-spaceship-dispenser-handle
      role="button"
      tabIndex={0}
      aria-label="Move dispenser panel"
      title="Move dispenser panel"
      className="flex h-8 cursor-grab touch-none select-none items-center justify-center text-kac-iron active:cursor-grabbing"
      onPointerDown={onHandlePointerDown}
    >
      <span className="font-ui text-lg font-black leading-none">::</span>
    </div>

    <button
      type="button"
      data-spaceship-energy-dispenser
      className="flex cursor-grab touch-none select-none flex-col items-center justify-center gap-1 active:cursor-grabbing"
      title="Drag unlimited Energy"
      onPointerDown={onEnergyPointerDown}
    >
      <EnergyToken label="1" detail="Energy token source" />
      <span className="font-ui w-full max-w-full whitespace-normal break-words text-center text-[1.16rem] font-black uppercase leading-none tracking-[0.08em]">
        Energy
      </span>
    </button>

    <div className="grid flex-1 grid-cols-1 gap-2">
      {effectDispensers.map((dispenser) => (
        <button
          key={dispenser.effectType}
          type="button"
          data-spaceship-effect-dispenser={dispenser.effectType}
          className="flex cursor-grab touch-none select-none flex-col items-center justify-center gap-1 active:cursor-grabbing"
          title={`Drag unlimited ${dispenser.label}`}
          onPointerDown={(event) =>
            onEffectPointerDown(dispenser.effectType, event)
          }
        >
          <DispenserIconPanel>
            <img
              src={dispenser.iconUri}
              alt=""
              draggable={false}
              className="h-full w-full object-contain p-1"
            />
          </DispenserIconPanel>
          <span className="font-ui w-full max-w-full whitespace-normal break-words text-center text-[1.1rem] font-black uppercase leading-none tracking-[0.06em]">
            {dispenser.label}
          </span>
        </button>
      ))}
    </div>
  </div>
);

