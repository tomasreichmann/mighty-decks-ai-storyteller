import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "../../utils/cn";
import { Button } from "./Button";
import { Highlight } from "./Highlight";

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
  ...props
}: CTAButtonProps): JSX.Element => {
  return (
    <div className={cn("relative inline-flex w-fit group", containerClassName)}>
      <Button className={cn("relative z-10", className)} {...props}>
        {children}
      </Button>
      <Highlight
        color="gold"
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
