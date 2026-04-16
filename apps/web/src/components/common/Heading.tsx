import { PropsWithChildren } from "react";
import { cn } from "../../utils/cn";
import { Highlight, HighlightProps } from "./Highlight";
import { Text, type TextColor, type TextVariant } from "./Text";

export type HeadingLevel = "h1" | "h2" | "h3";

export interface HeadingProps extends PropsWithChildren {
  level?: HeadingLevel;
  color?: TextColor;
  className?: string;
  highlightProps?: Partial<HighlightProps>;
}

const headingVariantMap: Record<HeadingLevel, TextVariant> = {
  h1: "h1",
  h2: "h2",
  h3: "h3",
};

export const Heading = ({
  level = "h2",
  highlightProps = {},
  color = "iron",
  className,
  children,
}: HeadingProps): JSX.Element => {
  return (
    <Text
      variant={headingVariantMap[level]}
      color={color}
      className={cn("heading -mb-2 relative", className)}
    >
      <span className="relative inline-block">
        <span className="inline-block relative rotate-[-2deg]">{children}</span>
        <Highlight
          lineCount={1}
          animate="once"
          lineHeight={10}
          brushHeight={8}
          lineOffsets={[0, 10, 30, 50]}
          {...highlightProps}
          className={cn(
            "absolute w-[calc(100%+0.5em)] h-[calc(100%-0.4em)] left-1/2 bottom-0 -translate-x-1/2 -z-10",
            highlightProps.className,
          )}
        />
      </span>
    </Text>
  );
};
