import React from "react";
import { AssetModifierCard as PackageAssetModifierCard } from "@mighty-decks/components/react";
import type { AssetModifierSlug } from "@mighty-decks/spec/assetCards";

void React;

interface AssetModifierCardProps {
  modifierSlug: AssetModifierSlug;
  className?: string;
}

export const AssetModifierCard = ({
  modifierSlug,
  className,
}: AssetModifierCardProps): JSX.Element => (
  <PackageAssetModifierCard slug={modifierSlug} className={className} />
);
