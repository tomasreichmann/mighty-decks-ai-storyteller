import React, { isValidElement, useId, type ReactNode } from "react";
import { cn } from "../../utils/cn";

void React;

const SCENE_CARD_WIDTH = 332;
const SCENE_CARD_HEIGHT = 204;
const SCENE_CARD_INSET = 2;
const SCENE_CARD_INNER_WIDTH = 328;
const SCENE_CARD_INNER_HEIGHT = 200;
const SCENE_CARD_RADIUS = 7;
const SCENE_DESCRIPTION_LINE_HEIGHT_TOTAL = 17;
const SCENE_DESCRIPTION_BASELINE_OFFSET = 20;
const SCENE_TITLE_MAX_CHARS_PER_LINE = 30;
const SCENE_DESCRIPTION_LEFT_PADDING = 22;
const SCENE_DESCRIPTION_MAX_CHARS_PER_LINE = 52;

interface SceneCardFrameProps {
  imageUrl: string;
  imageAlt?: string;
  title: ReactNode;
  titleVariant?: "gold" | "fire" | "cloth";
  typeIcon: ReactNode;
  description: ReactNode;
  className?: string;
}

export const SceneCardFrame = ({
  imageUrl,
  imageAlt = "",
  title,
  titleVariant = "gold",
  typeIcon,
  description,
  className = "",
}: SceneCardFrameProps): JSX.Element => {
  const clipPathId = useId();
  const topFadeGradientId = useId();
  const titleText = toTextContent(title, 96);
  const descriptionText = toTextContent(description, 170);
  const iconText = toTextContent(typeIcon, 4) || "?";
  const titleLines = wrapText(titleText, SCENE_TITLE_MAX_CHARS_PER_LINE, 2);
  const descriptionLines = wrapText(
    descriptionText,
    SCENE_DESCRIPTION_MAX_CHARS_PER_LINE,
    2,
  );
  const descriptionBandHeight =
    SCENE_DESCRIPTION_BASELINE_OFFSET +
    descriptionLines.length * SCENE_DESCRIPTION_LINE_HEIGHT_TOTAL;
  const descriptionBandY =
    SCENE_CARD_INSET + SCENE_CARD_INNER_HEIGHT - descriptionBandHeight;
  const titleColors = TITLE_VARIANT_STYLES[titleVariant];
  const ariaLabel =
    imageAlt.trim().length > 0
      ? imageAlt
      : `${titleText || "Card"}${descriptionText ? `. ${descriptionText}` : ""}`;

  return (
    <div
      className={cn(
        "relative aspect-[332/204] w-[332px] max-w-full",
        className,
      )}
    >
      <svg
        viewBox={`0 0 ${SCENE_CARD_WIDTH} ${SCENE_CARD_HEIGHT}`}
        role="img"
        aria-label={ariaLabel}
        className="relative z-10 h-full w-full"
      >
        <defs>
          <clipPath id={clipPathId}>
            <rect
              x={SCENE_CARD_INSET}
              y={SCENE_CARD_INSET}
              width={SCENE_CARD_INNER_WIDTH}
              height={SCENE_CARD_INNER_HEIGHT}
              rx={SCENE_CARD_RADIUS}
              ry={SCENE_CARD_RADIUS}
            />
          </clipPath>
          <linearGradient id={topFadeGradientId} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="rgba(18, 27, 35, 0)" />
            <stop offset="100%" stopColor="rgba(18, 27, 35, 0.58)" />
          </linearGradient>
        </defs>

        <rect
          x={SCENE_CARD_INSET}
          y={SCENE_CARD_INSET}
          width={SCENE_CARD_INNER_WIDTH}
          height={SCENE_CARD_INNER_HEIGHT}
          rx={SCENE_CARD_RADIUS}
          fill="#121b23"
        />
        <g clipPath={`url(#${clipPathId})`}>
          <image
            href={imageUrl}
            x={SCENE_CARD_INSET}
            y={SCENE_CARD_INSET}
            width={SCENE_CARD_INNER_WIDTH}
            height={SCENE_CARD_INNER_HEIGHT}
            preserveAspectRatio="xMidYMid slice"
          />
          <rect
            x={SCENE_CARD_INSET}
            y={SCENE_CARD_INSET}
            width={SCENE_CARD_INNER_WIDTH}
            height={Math.max(0, descriptionBandY - SCENE_CARD_INSET)}
            rx={SCENE_CARD_RADIUS}
            fill={`url(#${topFadeGradientId})`}
          />
          <rect
            x={SCENE_CARD_INSET}
            y={descriptionBandY}
            width={SCENE_CARD_INNER_WIDTH}
            height={descriptionBandHeight}
            fill="#f7f3eb"
          />
          <line
            x1={SCENE_CARD_INSET}
            y1={descriptionBandY}
            x2={SCENE_CARD_INSET + SCENE_CARD_INNER_WIDTH}
            y2={descriptionBandY}
            stroke="#121b23"
            strokeWidth="2"
          />
        </g>

        {titleLines.map((line, index) => (
          <text
            key={`${line}-${index}`}
            x="26"
            y={38 + index * 19}
            fill={titleColors.text}
            fontSize="15"
            fontFamily="'Shantell Sans', cursive"
            fontWeight="700"
            letterSpacing="0.01em"
          >
            {line}
          </text>
        ))}

        <text
          x="306"
          y="36"
          textAnchor="middle"
          fill="#f7f3eb"
          fontSize="20"
          fontFamily="'Kalam', cursive"
          fontWeight="700"
          style={{ textShadow: "0 1px 2px rgba(18, 27, 35, 0.75)" }}
          aria-hidden="true"
        >
          {iconText}
        </text>
        {descriptionLines.map((line, index) => (
          <text
            key={`${line}-${index}`}
            x={SCENE_DESCRIPTION_LEFT_PADDING}
            y={
              descriptionBandY +
              SCENE_DESCRIPTION_BASELINE_OFFSET +
              index * SCENE_DESCRIPTION_LINE_HEIGHT_TOTAL
            }
            fill="#1f2d37"
            fontSize="12.5"
            fontFamily="'Kalam', cursive"
            fontWeight="700"
          >
            {line}
          </text>
        ))}

        <rect
          x={SCENE_CARD_INSET}
          y={SCENE_CARD_INSET}
          width={SCENE_CARD_INNER_WIDTH}
          height={SCENE_CARD_INNER_HEIGHT}
          rx={SCENE_CARD_RADIUS}
          fill="none"
          stroke="#121b23"
          strokeWidth="2"
        />
      </svg>
    </div>
  );
};

const TITLE_VARIANT_STYLES = {
  gold: {
    text: "#e0b749",
  },
  fire: {
    text: "#d97361",
  },
  cloth: {
    text: "#8aa8ca",
  },
} as const;

const toTextContent = (value: ReactNode, maxLength: number): string => {
  const result = collectText(value).replace(/\s+/g, " ").trim();
  if (result.length <= maxLength) {
    return result;
  }

  return `${result.slice(0, maxLength - 3).trimEnd()}...`;
};

const collectText = (value: ReactNode): string => {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => collectText(item)).join(" ");
  }
  if (isValidElement(value)) {
    return collectText(value.props.children);
  }
  return "";
};

const wrapText = (value: string, maxCharsPerLine: number, maxLines: number): string[] => {
  if (value.length === 0) {
    return [""];
  }

  const words = value.split(/\s+/);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const next = line.length === 0 ? word : `${line} ${word}`;
    if (next.length <= maxCharsPerLine) {
      line = next;
      continue;
    }

    if (line.length > 0) {
      lines.push(line);
    } else {
      lines.push(word.slice(0, maxCharsPerLine));
    }

    if (lines.length === maxLines) {
      return withEllipsis(lines);
    }

    line = word;
  }

  if (line.length > 0 && lines.length < maxLines) {
    lines.push(line);
  }

  return lines.length === 0 ? [""] : lines;
};

const withEllipsis = (lines: string[]): string[] => {
  const next = [...lines];
  const lastIndex = next.length - 1;
  if (lastIndex < 0) {
    return next;
  }

  const lastLine = next[lastIndex] ?? "";
  next[lastIndex] = lastLine.endsWith("...")
    ? lastLine
    : `${lastLine.replace(/[. ]+$/, "")}...`;
  return next;
};
