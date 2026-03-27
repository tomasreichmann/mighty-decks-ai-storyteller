import React from "react";
import type { AssetModifierSlug } from "@mighty-decks/spec/assetCards";
import { assetModifierCardsBySlug } from "../../data/assetCards";
import { cn } from "../../utils/cn";
import { LayeredCard } from "./LayeredCard";

void React;

interface AssetModifierCardProps {
  modifierSlug: AssetModifierSlug;
  className?: string;
}

export const AssetModifierCard = ({
  modifierSlug,
  className,
}: AssetModifierCardProps): JSX.Element => {
  const modifier = assetModifierCardsBySlug.get(modifierSlug);

  return (
    <LayeredCard
      imageUri={modifier?.imageUri}
      noun={modifier?.title ?? "Unknown Modifier"}
      nounDeck={modifier?.deck ?? ""}
      nounCornerIcon="/types/asset.png"
      nounEffect={modifier?.effect}
      className={cn("AssetModifierCard", className)}
    />
  );
};
