import styles from "./DieMarker.module.css";

export interface DieMarkerProps {
  sides: 4 | 6 | 8 | 12;
  value: number;
  className?: string;
  label?: string;
  removed?: boolean;
  showTypeLabel?: boolean;
}

export const DieMarker = ({
  sides,
  value,
  className,
  label,
  removed = false,
  showTypeLabel = false,
}: DieMarkerProps): JSX.Element => {
  const displayedValue = Math.min(sides, Math.max(0, Math.round(value)));
  const markerClassName = [
    sides === 4
      ? styles.marker
      : "inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-kac-iron bg-kac-gold font-heading text-lg font-bold shadow-sm",
    removed ? styles.removed : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span
      aria-label={
        label ??
        (removed
          ? `d${sides} marker removed`
          : `d${sides} marker showing ${displayedValue}`)
      }
      className={markerClassName}
      data-sides={sides}
      role="img"
    >
      {sides === 4 ? (
        <>
          <span aria-hidden="true" className={styles.face} />
          <span aria-hidden="true" className={styles.value}>
            {removed ? "×" : displayedValue}
          </span>
        </>
      ) : (
        <span aria-hidden="true">{removed ? "×" : displayedValue}</span>
      )}
      {showTypeLabel && sides === 4 ? (
        <span aria-hidden="true" className={styles.typeLabel}>
          d4
        </span>
      ) : null}
      <span className="sr-only">Dice track values; they are not rolled.</span>
    </span>
  );
};
