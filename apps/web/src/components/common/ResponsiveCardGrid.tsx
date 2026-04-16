import { PropsWithChildren } from "react";
import { cn } from "../../utils/cn";

interface ResponsiveCardGridProps extends PropsWithChildren {
  className?: string;
}

export const ResponsiveCardGrid = ({
  className = "",
  children,
}: ResponsiveCardGridProps): JSX.Element => {
  return (
    <div
      className={cn(
        "responsive-card-grid grid grid-cols-1 items-start gap-4 md:grid-cols-2 lg:grid-cols-3",
        className,
      )}
    >
      {children}
    </div>
  );
};
