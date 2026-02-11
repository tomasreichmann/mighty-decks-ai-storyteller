import { PropsWithChildren } from "react";
import { cn } from "../../utils/cn";

interface SectionProps extends PropsWithChildren {
  title?: string;
  className?: string;
}

export const Section = ({
  title,
  className = "",
  children,
}: SectionProps): JSX.Element => {
  return (
    <section className={cn(className)}>
      {title ? (
        <h2 className="mb-2 text-lg font-semibold text-kac-iron">{title}</h2>
      ) : null}
      {children}
    </section>
  );
};
