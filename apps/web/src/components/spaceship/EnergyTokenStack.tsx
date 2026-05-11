import type { PointerEvent } from "react";
import { cn } from "../../utils/cn";
import { EnergyToken } from "./EnergyToken";

interface EnergyTokenStackProps {
  availableCount: number;
  totalCount: number;
  onPointerDown: (event: PointerEvent<HTMLDivElement>) => void;
}

export const EnergyTokenStack = ({
  availableCount,
  totalCount,
  onPointerDown,
}: EnergyTokenStackProps): JSX.Element => {
  const disabled = availableCount <= 0;

  return (
    <div
      data-energy-token-stack
      className={cn(
        "energy-token-stack pointer-events-auto flex h-[152px] w-[118px] cursor-grab flex-col items-center justify-center gap-2 rounded-sm border-[3px] border-kac-iron bg-[linear-gradient(180deg,#fff8cc_0%,#d69b20_100%)] p-3 text-kac-iron shadow-[5px_5px_0_0_#121b23] active:cursor-grabbing",
        disabled ? "cursor-not-allowed opacity-60" : null,
      )}
      title={`${availableCount} of ${totalCount} energy tokens available`}
      onPointerDown={disabled ? undefined : onPointerDown}
    >
      <div className="relative h-14 w-14" aria-hidden="true">
        <span className="absolute left-2 top-2 h-10 w-10 rounded-full border-[3px] border-kac-iron bg-kac-gold-dark shadow-[2px_2px_0_0_#121b23]" />
        <span className="absolute left-1 top-1 h-10 w-10 rounded-full border-[3px] border-kac-iron bg-kac-gold shadow-[2px_2px_0_0_#121b23]" />
        <div className="absolute left-0 top-0">
          <EnergyToken label="1" detail="Energy token source" />
        </div>
      </div>
      <div className="flex flex-col items-center leading-none">
        <span className="font-heading text-[1.65rem] font-bold">
          {availableCount}
        </span>
        <span
          data-energy-stack-count
          className="font-ui text-[0.62rem] font-black uppercase tracking-[0.08em]"
        >
          Energy
        </span>
      </div>
    </div>
  );
};
