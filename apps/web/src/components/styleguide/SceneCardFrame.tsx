import { isValidElement, useId, type ReactNode } from "react";
import { cn } from "../../utils/cn";

const SCENE_CARD_WIDTH = 332;
const SCENE_CARD_HEIGHT = 204;
const SCENE_CARD_INSET = 2;
const SCENE_CARD_INNER_WIDTH = 328;
const SCENE_CARD_INNER_HEIGHT = 200;
const SCENE_CARD_RADIUS = 7;
const SCENE_CARD_SHADOW_OFFSET = 4;

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
  const overlayGradientId = useId();
  const iconCornerGradientId = useId();
  const titleText = toTextContent(title, 96);
  const descriptionText = toTextContent(description, 170);
  const iconText = toTextContent(typeIcon, 4) || "?";
  const titleLines = wrapText(titleText, 32, 2);
  const descriptionLines = wrapText(descriptionText, 64, 2);
  const titleMaxLineLength = titleLines.reduce(
    (maxLength, line) => Math.max(maxLength, line.length),
    0,
  );
  const titleChipWidth = Math.min(
    224,
    Math.max(94, 24 + titleMaxLineLength * 8),
  );
  const titleChipHeight = 34 + (titleLines.length - 1) * 19;
  const descriptionBandHeight = 14 + descriptionLines.length * 16;
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
        "relative h-[204px] w-[332px] max-w-full overflow-visible",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[7px] bg-[#121b23]"
        style={{
          transform: `translate(${SCENE_CARD_SHADOW_OFFSET}px, ${SCENE_CARD_SHADOW_OFFSET}px)`,
        }}
      />
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
          <linearGradient id={overlayGradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(18, 27, 35, 0.14)" />
            <stop offset="62%" stopColor="rgba(18, 27, 35, 0.06)" />
            <stop offset="100%" stopColor="rgba(18, 27, 35, 0.58)" />
          </linearGradient>
          <linearGradient id={iconCornerGradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(18, 27, 35, 0)" />
            <stop offset="100%" stopColor="rgba(18, 27, 35, 0.62)" />
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
        <image
          href={imageUrl}
          x={SCENE_CARD_INSET}
          y={SCENE_CARD_INSET}
          width={SCENE_CARD_INNER_WIDTH}
          height={SCENE_CARD_INNER_HEIGHT}
          preserveAspectRatio="xMidYMid slice"
          clipPath={`url(#${clipPathId})`}
        />
        <rect
          x={SCENE_CARD_INSET}
          y={SCENE_CARD_INSET}
          width={SCENE_CARD_INNER_WIDTH}
          height={SCENE_CARD_INNER_HEIGHT}
          rx={SCENE_CARD_RADIUS}
          fill={`url(#${overlayGradientId})`}
        />

        <rect
          x="16"
          y="14"
          width={titleChipWidth}
          height={titleChipHeight}
          rx="7"
          fill={titleColors.fill}
          stroke="#121b23"
          strokeWidth="2"
        />
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

        <path
          d="M 248 2 L 330 2 L 330 84 Z"
          fill={`url(#${iconCornerGradientId})`}
        />
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
        {descriptionLines.map((line, index) => (
          <text
            key={`${line}-${index}`}
            x="18"
            y={descriptionBandY + 14 + index * 16}
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
    fill: "#c19400",
    text: "#121b23",
  },
  fire: {
    fill: "#b73d27",
    text: "#fff8e6",
  },
  cloth: {
    fill: "#527092",
    text: "#f6f7fa",
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
