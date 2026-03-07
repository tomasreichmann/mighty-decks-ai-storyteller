import { PropsWithChildren } from "react";
import { cn } from "../../utils/cn";
import { Highlight, HighlightProps } from "./Highlight";
import { Text, type TextProps } from "./Text";

export type HeadingProps = PropsWithChildren &
  Partial<TextProps> & { highlightProps?: Partial<HighlightProps> };

export const Heading = ({
  highlightProps = {},
  className,
  children,
  ...textProps
}: HeadingProps): JSX.Element => {
  return (
    <Text
      variant="h2"
      className={cn("-mb-2 relative", className)}
      {...textProps}
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
