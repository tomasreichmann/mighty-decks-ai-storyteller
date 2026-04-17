import { useId } from "react";
import { cn } from "../../utils/cn";
import styles from "./Highlight.module.css";
import {
  resolveHeadingHighlightColorClass,
  type HighlightColor,
} from "./headingHighlightColor";

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
  ["once"]: styles.strokeAnimate,
  ["infinite"]: styles.strokeAnimateInfinite,
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
        resolveHeadingHighlightColorClass(color),
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
