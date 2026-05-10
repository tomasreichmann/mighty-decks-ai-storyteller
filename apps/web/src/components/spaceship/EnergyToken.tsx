import { cn } from "../../utils/cn";
import type { PowerTokenState } from "../../lib/spaceship/spaceshipTypes";

interface EnergyTokenProps {
  label: string;
  detail?: string;
  state?: PowerTokenState;
}

export const EnergyToken = ({
  label,
  detail,
  state = "active",
}: EnergyTokenProps): JSX.Element => {
  const isSpent = state === "spent";

  return (
    <div
      data-energy-token
      data-token-state={state}
      className={cn(
        "energy-token inline-flex min-h-10 min-w-10 items-center justify-center rounded-full border-[3px] border-kac-iron px-2 py-1 text-kac-iron shadow-[2px_2px_0_0_#121b23]",
        isSpent
          ? "energy-token--spent bg-[radial-gradient(circle_at_35%_30%,#d7dde5_0%,#8090a0_58%,#23303d_100%)] text-kac-steel-light"
          : "energy-token--active bg-[radial-gradient(circle_at_35%_30%,#fff8cc_0%,#ffd23b_55%,#c37509_100%)]",
      )}
      title={detail}
    >
      <span className="font-heading text-lg font-bold leading-none">{label}</span>
    </div>
  );
};
