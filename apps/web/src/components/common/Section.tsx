import { PropsWithChildren } from "react";
import { cn } from "../../utils/cn";
import { Text } from "./Text";

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
        <Text as="h2" variant="h3" color="iron" className="mb-2 text-lg">
          {title}
        </Text>
      ) : null}
      {children}
    </section>
  );
};
