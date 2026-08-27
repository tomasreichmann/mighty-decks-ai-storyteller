export interface DieMarkerProps {
  sides: 4 | 6 | 8 | 12;
  value: number;
  className?: string;
  label?: string;
}

export const DieMarker = ({
  sides,
  value,
  className,
  label,
}: DieMarkerProps): JSX.Element => {
  const displayedValue = Math.min(sides, Math.max(0, Math.round(value)));
  const markerClassName = [
    "inline-flex h-9 w-9 items-center justify-center border-2 border-kac-iron bg-kac-gold font-heading text-lg font-bold text-kac-iron shadow-sm",
    sides === 4 ? "[clip-path:polygon(50%_0,100%_100%,0_100%)] pt-2" : "rounded-full",
    className,
  ].filter(Boolean).join(" ");

  return (
    <span
      aria-label={label ?? `d${sides} marker showing ${displayedValue}`}
      className={markerClassName}
      data-sides={sides}
      role="img"
    >
      <span aria-hidden="true">{displayedValue}</span>
      <span className="sr-only">Dice track values; they are not rolled.</span>
    </span>
  );
};
