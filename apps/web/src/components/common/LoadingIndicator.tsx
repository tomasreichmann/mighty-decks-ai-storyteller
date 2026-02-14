import { type CSSProperties, type PropsWithChildren, useId } from "react";
import { cn } from "../../utils/cn";

interface Point {
  x: number;
  y: number;
}

export interface LoadingIndicatorProps extends PropsWithChildren {
  value: number;
  total: number;
  radius?: number;
  thickness?: number;
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

  const startAngle = -90;
  const sweepAngle = progress * FULL_CIRCLE_SWEEP_DEGREES;
  const endAngle = startAngle + sweepAngle;
  const ringBorderWidth = Math.max(1, safeThickness * 0.09);
  const arcBorderWidth = Math.max(2, safeThickness * 0.22);
  const capReach = safeThickness * 1.25;
  const padding = Math.ceil(safeThickness + capReach + arcBorderWidth + 6);
  const size = safeRadius * 2 + padding * 2;
  const center = size / 2;
  const ringRadius = safeRadius;
  const contentDiameter = Math.max((ringRadius - safeThickness / 2 - 4) * 2, 0);

  const hasArc = sweepAngle > 0;
  const hasJaggedCaps = hasArc && progress < 1;
  const arcPath = hasArc
    ? buildArcPath(center, center, ringRadius, startAngle, endAngle)
    : "";
  const startPoint = polarToCartesian(center, center, ringRadius, startAngle);
  const endPoint = polarToCartesian(center, center, ringRadius, endAngle);
  const gradientEndPoint = hasArc
    ? endPoint
    : polarToCartesian(center, center, ringRadius, startAngle + 1);

  const arcLightColor = adjustHexColor(arcColor, 28) ?? arcColor;
  const arcDarkColor = adjustHexColor(arcColor, -34) ?? arcColor;
  const ringGradientId = `${idBase}-ring-gradient`;
  const ringInsetShadowId = `${idBase}-ring-inset-shadow`;
  const arcGradientId = `${idBase}-arc-gradient`;
  const arcGlossId = `${idBase}-arc-gloss`;

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
            id={ringGradientId}
            x1={center}
            y1={center - ringRadius}
            x2={center}
            y2={center + ringRadius}
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#f3f3f4" />
            <stop offset="58%" stopColor="#abb4c3" />
            <stop offset="100%" stopColor="#65738b" />
          </linearGradient>
          <linearGradient
            id={ringInsetShadowId}
            x1={center}
            y1={center - ringRadius}
            x2={center}
            y2={center + ringRadius}
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#090f15" stopOpacity="0.3" />
            <stop offset="42%" stopColor="#090f15" stopOpacity="0.12" />
            <stop offset="80%" stopColor="#090f15" stopOpacity="0" />
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
            <stop offset="55%" stopColor={arcColor} />
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
          stroke="#121b23"
          strokeOpacity="0.7"
          strokeWidth={safeThickness + ringBorderWidth * 2}
        />
        <circle
          cx={center}
          cy={center}
          r={ringRadius}
          fill="none"
          stroke={`url(#${ringGradientId})`}
          strokeWidth={safeThickness}
        />
        <circle
          cx={center}
          cy={center}
          r={ringRadius}
          fill="none"
          stroke={`url(#${ringInsetShadowId})`}
          strokeWidth={safeThickness * 0.9}
        />

        {hasArc ? (
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
