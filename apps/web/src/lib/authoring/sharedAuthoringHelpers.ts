import type { AdventureModuleDetail } from "@mighty-decks/spec/adventureModuleAuthoring";
import type { DetailWithCounters } from "./sharedAuthoringTypes";

export const clampCounterValue = (
  currentValue: number,
  maxValue?: number,
): number => {
  const normalizedCurrentValue = Math.max(0, Math.trunc(currentValue));
  if (typeof maxValue !== "number") {
    return normalizedCurrentValue;
  }
  return Math.min(normalizedCurrentValue, Math.max(0, Math.trunc(maxValue)));
};

export const toEntitySlug = (value: string): string => {
  const normalized = value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\x00-\x7F]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized.length > 0 ? normalized.slice(0, 120) : "untitled";
};

export const makeUniqueCounterSlug = <
  TDetail extends Pick<AdventureModuleDetail, "counters">,
>(
  title: string,
  detail: TDetail,
  excludeSlug: string,
): string => {
  const baseSlug = toEntitySlug(title);
  const existingSlugs = new Set(
    detail.counters
      .filter((counter) => counter.slug !== excludeSlug)
      .map((counter) => counter.slug),
  );

  if (!existingSlugs.has(baseSlug)) {
    return baseSlug;
  }

  for (let suffix = 2; suffix < 10_000; suffix += 1) {
    const candidate = toEntitySlug(`${baseSlug}-${suffix}`);
    if (!existingSlugs.has(candidate)) {
      return candidate;
    }
  }

  return baseSlug;
};

export const makeUniqueAssetSlug = <
  TDetail extends Pick<AdventureModuleDetail, "assets">,
>(
  title: string,
  detail: TDetail,
  excludeSlug: string,
): string => {
  const baseSlug = toEntitySlug(title);
  const existingSlugs = new Set(
    detail.assets
      .filter((asset) => asset.assetSlug !== excludeSlug)
      .map((asset) => asset.assetSlug),
  );

  if (!existingSlugs.has(baseSlug)) {
    return baseSlug;
  }

  for (let suffix = 2; suffix < 10_000; suffix += 1) {
    const candidate = toEntitySlug(`${baseSlug}-${suffix}`);
    if (!existingSlugs.has(candidate)) {
      return candidate;
    }
  }

  return baseSlug;
};

export const replaceCounterInDetail = <TDetail extends DetailWithCounters>(
  detail: TDetail,
  nextCounter: TDetail["counters"][number],
): TDetail =>
  ({
    ...detail,
    index: {
      ...detail.index,
      counters: detail.index.counters.map((counter) =>
        counter.slug === nextCounter.slug ? nextCounter : counter,
      ),
    },
    counters: detail.counters.map((counter) =>
      counter.slug === nextCounter.slug ? nextCounter : counter,
    ),
  }) as TDetail;
