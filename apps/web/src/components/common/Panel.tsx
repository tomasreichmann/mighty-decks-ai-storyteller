import { ElementType, PropsWithChildren } from "react";
import { cn } from "../../utils/cn";

type PanelTone = "bone" | "gold" | "cloth" | "fire";

export type PanelProps = PropsWithChildren<{
  as?: ElementType;
  tone?: PanelTone;
  className?: string;
  contentClassName?: string;
}> &
  Omit<JSX.IntrinsicElements["section"], "children">;

const contentToneClassMap: Record<PanelTone, string> = {
  bone: "[background-color:white] bg-gradient-to-b from-kac-bone-light/50 to-kac-bone-light",
  gold: "[background-color:white] bg-gradient-to-b from-kac-gold-light to-kac-bone",
  cloth:
    "[background-color:white] bg-gradient-to-b from-kac-cloth-lightest to-kac-cloth-lightest/40",
  fire: "[background-color:white] bg-gradient-to-b from-kac-fire-lightest to-kac-bone-light",
};

export const Panel = ({
  as,
  tone = "bone",
  className = "",
  contentClassName = "",
  children,
  ...restProps
}: PanelProps): JSX.Element => {
  const Component = as ?? "section";

  return (
    <Component
      className={cn("comic-panel relative p-1.5", className)}
      {...restProps}
    >
      <div
        className={cn(
          "flex-1 relative z-10",
          "px-3 py-3 shadow-[inset_1px_1px_0_0_#fffaf0,inset_-1px_-1px_0_0_#d6c1a1]",
          contentToneClassMap[tone],
          contentClassName,
        )}
      >
        {children}
      </div>
    </Component>
  );
};
