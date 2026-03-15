import React from "react";
import type {
  AssetBaseSlug,
  AssetModifierSlug,
} from "@mighty-decks/spec/assetCards";
import {
  assetBaseCardsBySlug,
  assetModifierCardsBySlug,
} from "../../data/assetCards";
import { cn } from "../../utils/cn";
import { LayeredCard, type LayeredCardProps } from "./LayeredCard";

void React;

export interface AssetCardProps
  extends Omit<
    LayeredCardProps,
    | "imageUri"
    | "imageOverlayUri"
    | "noun"
    | "nounDeck"
    | "nounCornerIcon"
    | "nounEffect"
    | "adjective"
    | "adjectiveDeck"
    | "adjectiveCornerIcon"
    | "adjectiveEffect"
  > {
  baseAssetSlug: AssetBaseSlug;
  modifierSlug?: AssetModifierSlug;
}

export const AssetCard = ({
  baseAssetSlug,
  modifierSlug,
  className,
  ...restProps
}: AssetCardProps): JSX.Element => {
  const baseAsset = assetBaseCardsBySlug.get(baseAssetSlug);
  const modifier = modifierSlug
    ? assetModifierCardsBySlug.get(modifierSlug)
    : undefined;

  return (
    <LayeredCard
      imageUri={baseAsset?.imageUri}
      imageOverlayUri={modifier?.imageUri}
      noun={baseAsset?.title ?? "Unknown Asset"}
      nounDeck={baseAsset?.deck ?? ""}
      nounCornerIcon="/types/asset.png"
      nounEffect={baseAsset?.effect}
      adjective={modifier?.title}
      adjectiveDeck={modifier?.deck}
      adjectiveCornerIcon={modifier ? "/types/asset.png" : undefined}
      adjectiveEffect={modifier?.effect}
      className={cn("AssetCard", className)}
      nounClassName="text-[18px] text-kac-iron"
      nounEffectClassName="px-3 pb-2 text-[10px] leading-[1.25] text-kac-iron-light whitespace-pre-wrap"
      adjectiveClassName="text-[16px] text-kac-iron"
      adjectiveEffectClassName="px-2 text-[10px] font-semibold leading-[1.2] text-kac-iron whitespace-pre-wrap"
      {...restProps}
    />
  );
};
