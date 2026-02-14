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
      <span className="relative">
        <span className="inline-block relative rotate-[-2deg]">{children}</span>
        <Highlight
          lineCount={1}
          animate="once"
          brushHeight={8}
          {...highlightProps}
          className={cn(
            "absolute left-1/2 bottom-[25%] -translate-x-1/2 w-[130%] h-[25%] -z-10",
            highlightProps.className,
          )}
        />
      </span>
    </Text>
  );
};
