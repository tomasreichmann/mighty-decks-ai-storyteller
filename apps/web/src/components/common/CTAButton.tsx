import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "../../utils/cn";
import { Button } from "./Button";
import { Highlight } from "./Highlight";
import { resolveCTAButtonHighlightColor } from "./ctaButtonHighlightColor";

type CTAButtonProps = Omit<
  ComponentPropsWithoutRef<typeof Button>,
  "children"
> & {
  children: ReactNode;
  containerClassName?: string;
  highlightClassName?: string;
};

export const CTAButton = ({
  children,
  className,
  containerClassName,
  highlightClassName,
  color = "gold",
  ...props
}: CTAButtonProps): JSX.Element => {
  return (
    <div className={cn("cta-button relative inline-flex w-fit group", containerClassName)}>
      <Button
        color={color}
        className={cn(
          "relative z-10 rotate-[-2deg] skew-x-[-5deg] hover:rotate-[0deg] active:rotate-[0deg] disabled:rotate-[-2deg]",
          className,
        )}
        {...props}
      >
        {children}
      </Button>
      <Highlight
        color={resolveCTAButtonHighlightColor(color)}
        animate="infinite"
        lineCount={4}
        canvasWidth={600}
        brushHeight={20}
        className={cn(
          "pointer-events-none absolute left-1/2 top-1/2 hidden h-[150%] w-[150%] -translate-x-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:block group-hover:opacity-50",
          highlightClassName,
        )}
      />
    </div>
  );
};
