import { cn } from "../../utils/cn";
import type { ButtonColors } from "../common/Button";

interface ActorTokenProps {
  label: string;
  imageUrl: string;
  title?: string;
  subtitle?: string;
  tone?: ButtonColors;
  className?: string;
}

const toneClassMap: Record<ButtonColors, string> = {
  steel: "border-kac-steel-dark bg-kac-steel-light/85 text-kac-iron-dark",
  "steel-light": "border-kac-steel-dark bg-kac-steel-light/85 text-kac-iron-dark",
  "steel-dark": "border-kac-steel-dark bg-kac-steel-light/85 text-kac-iron-dark",
  iron: "border-kac-iron bg-kac-steel-light/85 text-kac-iron",
  "iron-light": "border-kac-iron bg-kac-steel-light/85 text-kac-iron",
  "iron-dark": "border-kac-iron bg-kac-steel-light/85 text-kac-iron",
  blood: "border-kac-blood bg-kac-blood-lightest/90 text-kac-blood-dark",
  "blood-light": "border-kac-blood bg-kac-blood-lightest/90 text-kac-blood-dark",
  "blood-lighter": "border-kac-blood bg-kac-blood-lightest/90 text-kac-blood-dark",
  "blood-lightest": "border-kac-blood bg-kac-blood-lightest/90 text-kac-blood-dark",
  "blood-dark": "border-kac-blood bg-kac-blood-lightest/90 text-kac-blood-dark",
  fire: "border-kac-fire-dark bg-kac-fire-lightest/90 text-kac-fire-dark",
  "fire-light": "border-kac-fire-dark bg-kac-fire-lightest/90 text-kac-fire-dark",
  "fire-lightest": "border-kac-fire-dark bg-kac-fire-lightest/90 text-kac-fire-dark",
  "fire-dark": "border-kac-fire-dark bg-kac-fire-lightest/90 text-kac-fire-dark",
  bone: "border-kac-bone-dark bg-kac-bone-light/90 text-kac-iron-dark",
  "bone-light": "border-kac-bone-dark bg-kac-bone-light/90 text-kac-iron-dark",
  "bone-dark": "border-kac-bone-dark bg-kac-bone-light/90 text-kac-iron-dark",
  "bone-darker": "border-kac-bone-dark bg-kac-bone-light/90 text-kac-iron-dark",
  skin: "border-kac-skin-dark bg-kac-skin-light/90 text-kac-blood-dark",
  "skin-light": "border-kac-skin-dark bg-kac-skin-light/90 text-kac-blood-dark",
  "skin-dark": "border-kac-skin-dark bg-kac-skin-light/90 text-kac-blood-dark",
  gold: "border-kac-gold-dark bg-kac-gold-light/90 text-kac-iron-dark",
  "gold-light": "border-kac-gold-dark bg-kac-gold-light/90 text-kac-iron-dark",
  "gold-dark": "border-kac-gold-dark bg-kac-gold-light/90 text-kac-iron-dark",
  "gold-darker": "border-kac-gold-dark bg-kac-gold-light/90 text-kac-iron-dark",
  cloth: "border-kac-cloth-dark bg-kac-cloth-lightest/95 text-kac-cloth-dark",
  "cloth-light": "border-kac-cloth-dark bg-kac-cloth-lightest/95 text-kac-cloth-dark",
  "cloth-lightest": "border-kac-cloth-dark bg-kac-cloth-lightest/95 text-kac-cloth-dark",
  "cloth-dark": "border-kac-cloth-dark bg-kac-cloth-lightest/95 text-kac-cloth-dark",
  curse: "border-kac-curse-dark bg-kac-curse-lightest/95 text-kac-curse-dark",
  "curse-light": "border-kac-curse-dark bg-kac-curse-lightest/95 text-kac-curse-dark",
  "curse-lighter": "border-kac-curse-dark bg-kac-curse-lightest/95 text-kac-curse-dark",
  "curse-lightest": "border-kac-curse-dark bg-kac-curse-lightest/95 text-kac-curse-dark",
  "curse-dark": "border-kac-curse-dark bg-kac-curse-lightest/95 text-kac-curse-dark",
  monster: "border-kac-monster-dark bg-kac-monster-lightest/95 text-kac-monster-dark",
  "monster-light": "border-kac-monster-dark bg-kac-monster-lightest/95 text-kac-monster-dark",
  "monster-lightest": "border-kac-monster-dark bg-kac-monster-lightest/95 text-kac-monster-dark",
  "monster-dark": "border-kac-monster-dark bg-kac-monster-lightest/95 text-kac-monster-dark",
};

export const ActorToken = ({
  label,
  imageUrl,
  title,
  subtitle,
  tone = "gold",
  className = "",
}: ActorTokenProps): JSX.Element => {
  return (
    <div
      className={cn(
        "actor-token inline-flex min-w-[5.75rem] max-w-[7rem] flex-col items-center gap-1 text-center",
        className,
      )}
    >
      <div
        className={cn(
          "relative flex h-16 w-16 items-center justify-center rounded-full border-[3px] shadow-[3px_3px_0_0_#121b23]",
          toneClassMap[tone],
        )}
      >
        <span className="pointer-events-none absolute inset-1 rounded-full border border-kac-iron/20" />
        <img
          src={imageUrl}
          alt={label}
          className="h-[3.35rem] w-[3.35rem] rounded-full object-cover object-top"
        />
      </div>
      <div
        className={cn(
          "w-full rounded-sm border-2 border-kac-iron px-2 py-1 shadow-[2px_2px_0_0_#121b23]",
          toneClassMap[tone],
        )}
      >
        <p className="font-heading text-[0.8rem] font-bold uppercase leading-none tracking-[0.04em]">
          {label}
        </p>
        {title ? (
          <p className="mt-1 font-ui text-[0.62rem] font-bold uppercase leading-none tracking-[0.08em] opacity-80">
            {title}
          </p>
        ) : null}
        {subtitle ? (
          <p className="mt-1 font-ui text-[0.72rem] leading-tight">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
};
