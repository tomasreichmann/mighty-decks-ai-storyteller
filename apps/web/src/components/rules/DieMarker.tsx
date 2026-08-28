export interface DieMarkerProps {
  sides: 4 | 6 | 8 | 12;
  value: number;
  className?: string;
  label?: string;
  removed?: boolean;
}

export const DieMarker = ({
  sides,
  value,
  className,
  label,
  removed = false,
}: DieMarkerProps): JSX.Element => {
  const displayedValue = Math.min(sides, Math.max(0, Math.round(value)));
  const markerClassName = [
    "inline-flex h-9 w-9 items-center justify-center border-2 border-kac-iron font-heading text-lg font-bold shadow-sm",
    removed ? "bg-kac-bone-light text-kac-blood" : "bg-kac-gold text-kac-iron",
    sides === 4 ? "[clip-path:polygon(50%_0,100%_100%,0_100%)] pt-2" : "rounded-full",
    className,
  ].filter(Boolean).join(" ");

  return (
    <span
      aria-label={label ?? (removed ? `d${sides} marker removed` : `d${sides} marker showing ${displayedValue}`)}
      className={markerClassName}
      data-sides={sides}
      role="img"
    >
      <span aria-hidden="true">{removed ? "✕" : displayedValue}</span>
      <span className="sr-only">Dice track values; they are not rolled.</span>
    </span>
  );
};
