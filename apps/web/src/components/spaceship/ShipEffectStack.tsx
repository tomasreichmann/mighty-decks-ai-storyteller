import type { ShipEffectInstance, ShipLocationRow } from "../../lib/spaceship/spaceshipTypes";
import { cn } from "../../utils/cn";

interface ShipEffectStackProps {
  effects: ShipEffectInstance[];
  row: ShipLocationRow;
  className?: string;
}

const effectToneMap: Record<ShipEffectInstance["type"], string> = {
  distress: "border-kac-blood-dark bg-kac-blood-lightest text-kac-blood-dark",
  freezing: "border-kac-cloth-dark bg-kac-cloth-lightest text-kac-cloth-dark",
  injury: "border-kac-fire-dark bg-kac-fire-lightest text-kac-fire-dark",
};

export const ShipEffectStack = ({
  effects,
  row,
  className = "",
}: ShipEffectStackProps): JSX.Element | null => {
  if (effects.length === 0) {
    return null;
  }

  return (
    <div
      data-effect-stack
      className={cn(
        "ship-effect-stack absolute left-3 right-3 z-10 flex gap-2",
        row === "top" ? "-top-5 justify-start" : "-bottom-5 justify-end",
        className,
      )}
    >
      {effects.map((effect) => (
        <div
          key={effect.effectId}
          className={cn(
            "min-w-[4.25rem] rotate-[-2deg] rounded-sm border-2 px-2 py-1 shadow-[2px_2px_0_0_#121b23]",
            effectToneMap[effect.type],
          )}
          title={effect.detail}
        >
          <p className="font-heading text-[0.72rem] font-bold uppercase leading-none">
            {effect.label}
          </p>
          <p className="mt-1 font-ui text-[0.65rem] leading-tight">{effect.count}x</p>
        </div>
      ))}
    </div>
  );
};
