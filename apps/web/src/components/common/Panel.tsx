import { ElementType, PropsWithChildren } from "react";
import { cn } from "../../utils/cn";
import styles from "./Panel.module.css";

type PanelTone = "bone" | "gold" | "cloth" | "fire";

export type PanelProps = PropsWithChildren<{
  as?: ElementType;
  tone?: PanelTone;
  className?: string;
  disabled?: boolean;
  contentClassName?: string;
}> &
  Omit<JSX.IntrinsicElements["section"], "children">;

const contentToneClassMap: Record<PanelTone, string> = {
  bone: "bg-gradient-to-b from-kac-bone-light/50 to-kac-bone-light/75",
  gold: "bg-gradient-to-b from-kac-gold-light/50 to-kac-gold-light/75",
  cloth: "bg-gradient-to-b from-kac-cloth-lightest/50 to-kac-cloth-lightest/75",
  fire: "bg-gradient-to-b from-kac-fire-lightest/50 to-kac-fire-lightest/75",
};
const toneClassMap: Record<PanelTone, string> = {
  bone: "before:border-kac-bone-dark before:border-solid",
  gold: "before:border-kac-gold-dark before:border-solid",
  cloth: "before:border-kac-cloth-dark before:border-solid",
  fire: "before:border-kac-fire-dark before:border-solid",
};

export const Panel = ({
  as,
  tone = "bone",
  className = "",
  contentClassName = "",
  disabled = false,
  children,
  ...restProps
}: PanelProps): JSX.Element => {
  const Component = as ?? "section";

  return (
    <Component
      className={cn(styles.panelFrame, toneClassMap[tone], "relative flex flex-col", className)}
      {...restProps}
    >
      <div
        className={cn(
          "flex-1 relative z-10",
          "px-3 py-3",
          contentToneClassMap[tone],
          contentClassName,
          disabled &&
            "pointer-events-none disabled:bg-[repeating-linear-gradient(45deg,rgba(0,0,0,0.25)_0px,rgba(0,0,0,0.25)_10px,transparent_10px,transparent_20px)]",
        )}
      >
        {children}
      </div>
    </Component>
  );
};
