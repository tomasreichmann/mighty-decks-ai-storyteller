export const resolveAnimatedLoadingValue = (
  elapsedMs: number,
  targetValue: number,
  durationMs: number,
): number => {
  if (durationMs <= 0) {
    return targetValue;
  }

  const progress = Math.min(Math.max(elapsedMs / durationMs, 0), 1);
  return targetValue * progress;
};
