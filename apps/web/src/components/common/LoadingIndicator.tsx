import { type CSSProperties, type PropsWithChildren, useId } from "react";
import { type ButtonColors } from "./Button";
import { cn } from "../../utils/cn";

interface Point {
  x: number;
  y: number;
}

export type LoadingIndicatorColor = ButtonColors;

type LoadingIndicatorTone =
  | "steel"
  | "iron"
  | "blood"
  | "fire"
  | "bone"
  | "skin"
  | "gold"
  | "cloth"
  | "curse"
  | "monster";

interface TonePalette {
  light: string;
  base: string;
  dark: string;
}

const loadingTonePalette: Record<LoadingIndicatorTone, TonePalette> = {
  steel: {
    light: "#f3f3f4",
    base: "#abb4c3",
    dark: "#65738b",
  },
  iron: {
    light: "#23303d",
    base: "#121b23",
    dark: "#090f15",
  },
  blood: {
    light: "#ff9494",
    base: "#e3132c",
    dark: "#541423",
  },
  fire: {
    light: "#ffe79b",
    base: "#f88b00",
    dark: "#950101",
  },
  bone: {
    light: "#e4ceb3",
    base: "#ecb87b",
    dark: "#a3835f",
  },
  skin: {
    light: "#f2ced1",
    base: "#f7adae",
    dark: "#e6848c",
  },
  gold: {
    light: "#fff5c0",
    base: "#ffd23b",
    dark: "#f59d20",
  },
  cloth: {
    light: "#d8e2ea",
    base: "#5c77b2",
    dark: "#32497b",
  },
  curse: {
    light: "#fff2f2",
    base: "#f20170",
    dark: "#c10045",
  },
  monster: {
    light: "#d7ffab",
    base: "#4ec342",
    dark: "#1aa62b",
  },
};

const loadingToneByColor: Record<ButtonColors, LoadingIndicatorTone> = {
  steel: "steel",
  "steel-light": "steel",
  "steel-dark": "steel",
  iron: "iron",
  "iron-light": "iron",
  "iron-dark": "iron",
  blood: "blood",
  "blood-light": "blood",
  "blood-lighter": "blood",
  "blood-lightest": "blood",
  "blood-dark": "blood",
  fire: "fire",
  "fire-light": "fire",
  "fire-lightest": "fire",
  "fire-dark": "fire",
  bone: "bone",
  "bone-light": "bone",
  "bone-dark": "bone",
  "bone-darker": "bone",
  skin: "skin",
  "skin-light": "skin",
  "skin-dark": "skin",
  gold: "gold",
  "gold-light": "gold",
  "gold-dark": "gold",
  "gold-darker": "gold",
  cloth: "cloth",
  "cloth-light": "cloth",
  "cloth-lightest": "cloth",
  "cloth-dark": "cloth",
  curse: "curse",
  "curse-light": "curse",
  "curse-lighter": "curse",
  "curse-lightest": "curse",
  "curse-dark": "curse",
  monster: "monster",
  "monster-light": "monster",
  "monster-lightest": "monster",
  "monster-dark": "monster",
};

const resolveLoadingTone = (
  color: LoadingIndicatorColor,
): LoadingIndicatorTone => loadingToneByColor[color];

export interface LoadingIndicatorProps extends PropsWithChildren {
  value: number;
  total: number;
  radius?: number;
  thickness?: number;
  color?: LoadingIndicatorColor;
  trackColor?: LoadingIndicatorColor;
  arcColor?: string;
  className?: string;
  ariaLabel?: string;
}

const MIN_RADIUS = 20;
const MIN_THICKNESS = 4;
const FULL_CIRCLE_SWEEP_DEGREES = 359.8;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const formatPathNumber = (value: number): string =>
  Number(value.toFixed(3)).toString();

const polarToCartesian = (
  centerX: number,
  centerY: number,
  radius: number,
  angleDegrees: number,
): Point => {
  const angleRadians = (angleDegrees * Math.PI) / 180;
  return {
    x: centerX + radius * Math.cos(angleRadians),
    y: centerY + radius * Math.sin(angleRadians),
  };
};

const buildArcPath = (
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number,
): string => {
  const sweep = endAngle - startAngle;
  if (sweep <= 0) {
    return "";
  }

  const start = polarToCartesian(centerX, centerY, radius, startAngle);
  const end = polarToCartesian(centerX, centerY, radius, endAngle);
  const largeArcFlag = sweep > 180 ? 1 : 0;

  return [
    `M ${formatPathNumber(start.x)} ${formatPathNumber(start.y)}`,
    `A ${formatPathNumber(radius)} ${formatPathNumber(radius)} 0 ${largeArcFlag} 1 ${formatPathNumber(end.x)} ${formatPathNumber(end.y)}`,
  ].join(" ");
};

const buildJaggedCapPath = (thickness: number, direction: 1 | -1): string => {
  const half = thickness / 2;
  const length = thickness * 0.25;
  const border = 2;

  const points: Point[] = [
    { x: 0, y: -half },
    { x: -direction * (border + length * 0.2), y: -half },
    { x: -direction * (border + length * 0.4), y: (-half / 4) * 3 },
    { x: -direction * (border + length * 0.7), y: (-half / 4) * 2 },
    { x: -direction * (border + length * 0.3), y: (-half / 4) * 1 },
    { x: -direction * (border + length * 1), y: 0 },
    { x: -direction * (border + length * 0.4), y: (half / 4) * 1 },
    { x: -direction * (border + length * 0.7), y: (half / 4) * 2 },
    { x: -direction * (border + length * 0.3), y: (half / 4) * 3 },
    { x: -direction * (border + length * 0.8), y: half },
    { x: -direction * (border + length * 0.3), y: half },
    { x: 0, y: half },
  ];

  return [
    `M ${formatPathNumber(points[0].x)} ${formatPathNumber(points[0].y)}`,
    ...points
      .slice(1)
      .map(
        (point) =>
          `L ${formatPathNumber(point.x)} ${formatPathNumber(point.y)}`,
      ),
    "Z",
  ].join(" ");
};

const toRgbChannels = (hexColor: string): [number, number, number] | null => {
  const hexMatch = hexColor.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!hexMatch) {
    return null;
  }

  const source =
    hexMatch[1].length === 3
      ? hexMatch[1]
          .split("")
          .map((digit) => `${digit}${digit}`)
          .join("")
      : hexMatch[1];

  const red = Number.parseInt(source.slice(0, 2), 16);
  const green = Number.parseInt(source.slice(2, 4), 16);
  const blue = Number.parseInt(source.slice(4, 6), 16);

  return [red, green, blue];
};

const adjustHexColor = (hexColor: string, amount: number): string | null => {
  const channels = toRgbChannels(hexColor);
  if (!channels) {
    return null;
  }

  const nextChannels = channels.map((channel) =>
    clamp(Math.round(channel + amount), 0, 255),
  );

  return `rgb(${nextChannels[0]} ${nextChannels[1]} ${nextChannels[2]})`;
};

export const LoadingIndicator = ({
  value,
  total,
  radius = 16,
  thickness = 16,
  color,
  trackColor,
  arcColor = "#f59d20",
  className = "",
  ariaLabel = "Loading progress",
  children,
}: LoadingIndicatorProps): JSX.Element => {
  const idBase = useId().replace(/:/g, "");

  const safeRadius = Math.max(radius, MIN_RADIUS);
  const safeThickness = Math.max(thickness, MIN_THICKNESS);
  const normalizedTotal = total > 0 ? total : 1;
  const clampedValue = clamp(value, 0, normalizedTotal);
  const progress = clampedValue / normalizedTotal;
  // Snap to a true circle once the visible percentage would already read 100.
  const hasFullCircle = progress >= 0.995;

  const startAngle = -90;
  const sweepAngle = progress * FULL_CIRCLE_SWEEP_DEGREES;
  const endAngle = startAngle + sweepAngle;
  const ringBorderWidth = Math.max(1, safeThickness * 0.09);
  const arcBorderWidth = Math.max(2, safeThickness * 0.22);
  const padding = Math.ceil(safeThickness / 2 + arcBorderWidth + 3);
  const size = safeRadius * 2 + padding * 2;
  const center = size / 2;
  const ringRadius = safeRadius;
  const contentDiameter = Math.max((ringRadius - safeThickness / 2 - 4) * 2, 0);

  const hasArc = sweepAngle > 0;
  const hasJaggedCaps = hasArc && !hasFullCircle;
  const arcPath = hasArc && !hasFullCircle
    ? buildArcPath(center, center, ringRadius, startAngle, endAngle)
    : "";
  const startPoint = polarToCartesian(center, center, ringRadius, startAngle);
  const endPoint = polarToCartesian(center, center, ringRadius, endAngle);
  const gradientEndPoint = hasArc
    ? hasFullCircle
      ? polarToCartesian(center, center, ringRadius, startAngle + 180)
      : endPoint
    : polarToCartesian(center, center, ringRadius, startAngle + 1);

  const resolvedArcTone = color ? resolveLoadingTone(color) : null;
  const resolvedTrackTone = trackColor
    ? resolveLoadingTone(trackColor)
    : resolvedArcTone === "iron"
      ? "bone"
      : "iron";
  const arcPalette = resolvedArcTone ? loadingTonePalette[resolvedArcTone] : null;
  const trackPalette = loadingTonePalette[resolvedTrackTone];
  const arcBaseColor = arcPalette?.base ?? arcColor;
  const arcLightColor = arcPalette?.light ?? adjustHexColor(arcColor, 28) ?? arcColor;
  const arcDarkColor = arcPalette?.dark ?? adjustHexColor(arcColor, -34) ?? arcColor;
  const trackGradientId = `${idBase}-track-gradient`;
  const trackInsetShadowId = `${idBase}-track-inset-shadow`;
  const arcGradientId = `${idBase}-arc-gradient`;
  const arcGlossId = `${idBase}-arc-gloss`;
  const trackLightColor = trackPalette.light;
  const trackBaseColor = trackPalette.base;
  const trackDarkColor = trackPalette.dark;

  const wrapperStyle: CSSProperties = {
    width: size,
    height: size,
  };
  const contentStyle: CSSProperties = {
    width: contentDiameter,
    height: contentDiameter,
  };

  return (
    <div
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={normalizedTotal}
      aria-valuenow={clampedValue}
      className={cn(
        "relative inline-flex items-center justify-center",
        className,
      )}
      style={wrapperStyle}
    >
      <svg
        aria-hidden="true"
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 ${size} ${size}`}
      >
        <defs>
          <linearGradient
            id={trackGradientId}
            x1={center}
            y1={center - ringRadius}
            x2={center}
            y2={center + ringRadius}
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor={trackLightColor} />
            <stop offset="58%" stopColor={trackBaseColor} />
            <stop offset="100%" stopColor={trackDarkColor} />
          </linearGradient>
          <linearGradient
            id={trackInsetShadowId}
            x1={center}
            y1={center - ringRadius}
            x2={center}
            y2={center + ringRadius}
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor={trackDarkColor} stopOpacity="0.28" />
            <stop offset="42%" stopColor={trackDarkColor} stopOpacity="0.12" />
            <stop offset="80%" stopColor={trackDarkColor} stopOpacity="0" />
          </linearGradient>
          <linearGradient
            id={arcGradientId}
            x1={startPoint.x}
            y1={startPoint.y}
            x2={gradientEndPoint.x}
            y2={gradientEndPoint.y}
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor={arcLightColor} />
            <stop offset="55%" stopColor={arcBaseColor} />
            <stop offset="100%" stopColor={arcDarkColor} />
          </linearGradient>
          <linearGradient
            id={arcGlossId}
            x1={startPoint.x}
            y1={startPoint.y}
            x2={gradientEndPoint.x}
            y2={gradientEndPoint.y}
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
            <stop offset="45%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="100%" stopColor="#090f15" stopOpacity="0.24" />
          </linearGradient>
        </defs>

        <circle
          cx={center}
          cy={center}
          r={ringRadius}
          fill="none"
          stroke={trackDarkColor}
          strokeOpacity="0.7"
          strokeWidth={safeThickness + ringBorderWidth * 2}
        />
        <circle
          cx={center}
          cy={center}
          r={ringRadius}
          fill="none"
          stroke={`url(#${trackGradientId})`}
          strokeWidth={safeThickness}
        />
        <circle
          cx={center}
          cy={center}
          r={ringRadius}
          fill="none"
          stroke={`url(#${trackInsetShadowId})`}
          strokeWidth={safeThickness * 0.9}
        />

        {hasFullCircle ? (
          <>
            <circle
              cx={center}
              cy={center}
              r={ringRadius}
              fill="none"
              stroke="#090f15"
              strokeOpacity="0.88"
              strokeLinejoin="round"
              strokeWidth={safeThickness + arcBorderWidth * 2}
            />
            <circle
              cx={center}
              cy={center}
              r={ringRadius}
              fill="none"
              stroke={`url(#${arcGradientId})`}
              strokeLinejoin="round"
              strokeWidth={safeThickness}
            />
            <circle
              cx={center}
              cy={center}
              r={ringRadius}
              fill="none"
              stroke={`url(#${arcGlossId})`}
              strokeLinejoin="round"
              strokeWidth={safeThickness * 0.56}
            />
          </>
        ) : hasArc ? (
          <>
            <path
              d={arcPath}
              fill="none"
              stroke="#090f15"
              strokeOpacity="0.88"
              strokeLinecap="butt"
              strokeLinejoin="round"
              strokeWidth={safeThickness + arcBorderWidth * 2}
            />
            <path
              d={arcPath}
              fill="none"
              stroke={`url(#${arcGradientId})`}
              strokeLinecap="butt"
              strokeLinejoin="round"
              strokeWidth={safeThickness}
            />
            <path
              d={arcPath}
              fill="none"
              stroke={`url(#${arcGlossId})`}
              strokeLinecap="butt"
              strokeLinejoin="round"
              strokeWidth={safeThickness * 0.56}
            />
          </>
        ) : null}

        {hasJaggedCaps ? (
          <>
            <g
              transform={`translate(${formatPathNumber(startPoint.x)} ${formatPathNumber(startPoint.y)}) rotate(${formatPathNumber(startAngle + 90)})`}
            >
              <path d={buildJaggedCapPath(safeThickness, -1)} fill="#090f15" />
            </g>
            <g
              transform={`translate(${formatPathNumber(endPoint.x)} ${formatPathNumber(endPoint.y)}) rotate(${formatPathNumber(endAngle + 90)})`}
            >
              <path d={buildJaggedCapPath(safeThickness, 1)} fill="#090f15" />
            </g>
          </>
        ) : null}
      </svg>

      <div
        className="relative z-[1] flex items-center justify-center text-center"
        style={contentStyle}
      >
        {children}
      </div>
    </div>
  );
};
