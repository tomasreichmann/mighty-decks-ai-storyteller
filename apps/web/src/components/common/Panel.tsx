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

const toneClassMap: Record<PanelTone, string> = {
  bone: styles.toneBone,
  gold: styles.toneGold,
  cloth: styles.toneCloth,
  fire: styles.toneFire,
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
      className={cn(
        styles.panelFrame,
        toneClassMap[tone],
        "relative flex flex-col overflow-hidden rounded-sm border-2 border-kac-iron bg-kac-bone-light shadow-[4px_4px_0_0_#121b23]",
        className,
      )}
      {...restProps}
    >
      <div
        className={cn(
          "relative z-10 flex-1 px-3 py-3",
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
