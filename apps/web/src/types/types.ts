export type AssetType = {
  slug: string;
  title: string;
  icon: string;
  effect: string;
  cost: number;
  deck?: string;
  count: number;
};

export type EffectType = {
  slug?: string;
  title: string;
  icon: string;
  effect: string;
  deck?: string;
  count?: number;
};

export type StuntType = {
  slug?: string;
  title: string;
  icon: string;
  effect: string;
  requirements?: string;
  deck?: string;
};

export type OutcomeSlug =
  | "special-action"
  | "success"
  | "partial-success"
  | "fumble"
  | "chaos";

export type OutcomeType = {
  slug: string;
  deck?: string;
  title: string;
  iconUri: string;
  description: string;
  instructions?: string;
};

export type WithCount<T> = T & { count: number };
