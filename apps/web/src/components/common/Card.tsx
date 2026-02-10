import { PropsWithChildren } from "react";
import { cn } from "../../utils/cn";

interface CardProps extends PropsWithChildren {
  className?: string;
}

export const Card = ({ children, className = "" }: CardProps): JSX.Element => {
  return (
    <section className={cn("soft-card p-5", className)}>
      {children}
    </section>
  );
};
