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

interface GenericAssetCardProps {
  kind?: "generic";
  baseAssetSlug: AssetBaseSlug;
  modifierSlug?: AssetModifierSlug;
  className?: string;
}

interface CustomAssetCardProps {
  kind: "custom";
  modifier: string;
  noun: string;
  nounDescription: string;
  adjectiveDescription: string;
  iconUrl: string;
  overlayUrl?: string;
  className?: string;
}

interface LegacyLayeredAssetCardProps {
  kind: "legacy_layered";
  title: string;
  className?: string;
}

export type AssetCardProps =
  | GenericAssetCardProps
  | CustomAssetCardProps
  | LegacyLayeredAssetCardProps;

const sharedCardClassName = "AssetCard";

const sharedLayeredCardProps: Pick<
  LayeredCardProps,
  | "nounClassName"
  | "nounEffectClassName"
  | "adjectiveClassName"
  | "adjectiveEffectClassName"
> = {
  nounClassName: "text-[18px] text-kac-iron",
  nounEffectClassName:
    "px-3 pb-2 text-[10px] leading-[1.25] text-kac-iron-light whitespace-pre-wrap",
  adjectiveClassName: "text-[16px] text-kac-iron",
  adjectiveEffectClassName:
    "px-2 text-[10px] font-semibold leading-[1.2] text-kac-iron whitespace-pre-wrap",
};

const UnsupportedAssetCard = ({
  title,
  className,
}: LegacyLayeredAssetCardProps): JSX.Element => (
  <article
    className={cn(
      "AssetCard relative flex aspect-[204/332] w-[204px] max-w-full flex-col justify-between rounded-[0.6rem] border-2 border-dashed border-kac-blood-dark/70 bg-kac-bone-light/80 p-4 text-left shadow-[2px_2px_0_0_#121b23]",
      className,
    )}
    aria-label={title}
  >
    <div className="stack gap-2">
      <span className="font-ui text-[10px] font-bold uppercase tracking-[0.08em] text-kac-blood-dark">
        Reauthor required
      </span>
      <span className="font-md-heading text-[20px] font-bold leading-none text-kac-iron">
        {title || "Unknown Asset"}
      </span>
    </div>
    <p className="font-ui text-[11px] leading-[1.35] text-kac-iron-light">
      This legacy layered asset must be rewritten as a custom asset before it
      can render in markdown or previews.
    </p>
  </article>
);

export const AssetCard = (props: AssetCardProps): JSX.Element => {
  if (props.kind === "custom") {
    const {
      modifier,
      noun,
      nounDescription,
      adjectiveDescription,
      iconUrl,
      overlayUrl,
      className,
    } = props;

    return (
      <LayeredCard
        imageUri={iconUrl.trim() || undefined}
        imageOverlayUri={overlayUrl?.trim() || undefined}
        noun={noun.trim() || " "}
        nounDeck="custom"
        nounCornerIcon="/types/asset.png"
        nounEffect={nounDescription.trim() || undefined}
        adjective={modifier.trim() || undefined}
        adjectiveEffect={adjectiveDescription.trim() || undefined}
        className={cn(sharedCardClassName, className)}
        {...sharedLayeredCardProps}
      />
    );
  }

  if (props.kind === "legacy_layered") {
    return <UnsupportedAssetCard {...props} />;
  }

  const { baseAssetSlug, modifierSlug, className } = props;
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
      className={cn(sharedCardClassName, className)}
      {...sharedLayeredCardProps}
    />
  );
};
