import { useId } from "react";
import { cn } from "../../utils/cn";
import type { ButtonColors } from "./Button";

export type HighlightColor = ButtonColors;

export type HighlightProps = {
  color?: HighlightColor;
  animate?: "none" | "once" | "infinite";
  className?: string;
  pathClassName?: string;
  strokeWidth?: number;
  canvasWidth?: number;
  lineHeight?: number;
  lineTiltOffset?: number;
  lineCount?: number;
  lineOffsets?: number[];
  brushHeight?: number;
  brushWidth?: number;
  brushTiltOffset?: number;
  padding?: number;
};

const colorClassMap: Record<HighlightColor, string> = {
  steel: "text-kac-steel",
  "steel-light": "text-kac-steel-light",
  "steel-dark": "text-kac-steel-dark",
  iron: "text-kac-iron",
  "iron-light": "text-kac-iron-light",
  "iron-dark": "text-kac-iron-dark",
  blood: "text-kac-blood",
  "blood-light": "text-kac-blood-light",
  "blood-lighter": "text-kac-blood-lighter",
  "blood-lightest": "text-kac-blood-lightest",
  "blood-dark": "text-kac-blood-dark",
  fire: "text-kac-fire",
  "fire-light": "text-kac-fire-light",
  "fire-lightest": "text-kac-fire-lightest",
  "fire-dark": "text-kac-fire-dark",
  bone: "text-kac-bone",
  "bone-light": "text-kac-bone-light",
  "bone-dark": "text-kac-bone-dark",
  "bone-darker": "text-kac-bone-darker",
  skin: "text-kac-skin",
  "skin-light": "text-kac-skin-light",
  "skin-dark": "text-kac-skin-dark",
  gold: "text-kac-gold",
  "gold-light": "text-kac-gold-light",
  "gold-dark": "text-kac-gold-dark",
  "gold-darker": "text-kac-gold-darker",
  cloth: "text-kac-cloth",
  "cloth-light": "text-kac-cloth-light",
  "cloth-lightest": "text-kac-cloth-lightest",
  "cloth-dark": "text-kac-cloth-dark",
  curse: "text-kac-curse",
  "curse-light": "text-kac-curse-light",
  "curse-lighter": "text-kac-curse-lighter",
  "curse-lightest": "text-kac-curse-lightest",
  "curse-dark": "text-kac-curse-dark",
  monster: "text-kac-monster",
  "monster-light": "text-kac-monster-light",
  "monster-lightest": "text-kac-monster-lightest",
  "monster-dark": "text-kac-monster-dark",
};

const resolveHighlightColorClass = (color: HighlightColor): string => {
  return colorClassMap[color] ?? colorClassMap.gold;
};

type Point = [number, number];

const toLinePath = (points: Point[]): string =>
  points
    .map(([x, y], index) => `${index === 0 ? "M" : "L"} ${x} ${y}`)
    .join(" ");

const offsetCalligraphyPoint = (
  [x, y]: Point,
  side: "top" | "bottom",
  halfBrushHeight: number,
  halfBrushTiltOffset: number,
): Point => {
  const xDirection = side === "top" ? 1 : -1;
  const yDirection = side === "top" ? -1 : 1;

  return [
    x + halfBrushTiltOffset * xDirection,
    y + halfBrushHeight * yDirection,
  ];
};

const animateClassNameMap = {
  ["none"]: "",
  ["once"]: "highlight-stroke-animate",
  ["infinite"]: "highlight-stroke-animate-infinite",
};

export const Highlight = ({
  color = "gold",
  animate = "none",
  className = "",
  pathClassName = "",
  canvasWidth = 320,
  lineHeight = 32,
  lineCount = 6,
  lineOffsets = [32, 16, 24, 8, 16],
  brushHeight = 16,
  brushTiltOffset = 10,
  padding = brushHeight / 2,
}: HighlightProps): JSX.Element => {
  const maskId = `highlight-mask-${useId().replace(/:/g, "")}`;
  const canvasHeight = padding * 2 + lineHeight * (lineCount - 1);

  const PATH_POINTS = Array.from({ length: lineCount }).reduce(
    (acc: Point[], _, lineIndex) => {
      const lineXOffset = lineOffsets[lineIndex % lineOffsets.length];
      acc.push([padding + lineXOffset, padding + lineIndex * lineHeight]);
      acc.push([
        canvasWidth - padding - lineXOffset,
        padding + lineIndex * lineHeight,
      ]);
      return acc;
    },
    [] as Point[],
  );

  const halfBrushHeight = brushHeight / 2;
  const halfBrushTiltOffset = brushTiltOffset / 2;

  const outlinePoints = [...PATH_POINTS, ...[...PATH_POINTS].reverse()].reduce(
    (acc, point, index, points) => {
      const isFirstHalf = index < points.length / 2;
      const isTopFirst = index % 2 === 0 ? isFirstHalf : !isFirstHalf;
      acc.push(
        offsetCalligraphyPoint(
          point,
          isTopFirst ? "top" : "bottom",
          halfBrushHeight,
          halfBrushTiltOffset,
        ),
      );
      acc.push(
        offsetCalligraphyPoint(
          point,
          isTopFirst ? "bottom" : "top",
          halfBrushHeight,
          halfBrushTiltOffset,
        ),
      );
      return acc;
    },
    [] as Point[],
  );
  const ANIMATION_PATH = toLinePath(PATH_POINTS);
  const CALIGRAPHY_PATH = `${toLinePath(outlinePoints)} Z`;

  return (
    <svg
      viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
      preserveAspectRatio="none"
      className={cn(
        "block h-auto w-full pointer-events-none rotate-[-2deg]",
        resolveHighlightColorClass(color),
        className,
      )}
      role="presentation"
      aria-hidden="true"
    >
      <mask id={maskId} maskUnits="userSpaceOnUse">
        <path
          d={ANIMATION_PATH}
          stroke="white"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="5000"
          strokeWidth={brushHeight * 1.2}
          className={cn(animateClassNameMap[animate], pathClassName)}
          fill="none"
        />
      </mask>
      <path
        d={CALIGRAPHY_PATH}
        fill="currentColor"
        fillRule="nonzero"
        mask={`url(#${maskId})`}
      />
    </svg>
  );
};
