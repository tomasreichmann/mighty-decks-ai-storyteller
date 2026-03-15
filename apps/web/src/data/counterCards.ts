import {
  counterIconCatalog,
  type CounterIconSlug,
} from "@mighty-decks/spec/counterCards";

export interface CounterIconOption {
  slug: CounterIconSlug;
  label: string;
  imageUri: string;
}

export const getCounterIconUri = (slug: CounterIconSlug): string =>
  `/counters/${slug}.png`;

export const counterIcons: CounterIconOption[] = counterIconCatalog.map((entry) => ({
  ...entry,
  imageUri: getCounterIconUri(entry.slug),
}));
