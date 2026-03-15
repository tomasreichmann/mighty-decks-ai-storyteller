import React from "react";
import type { AssetBaseGroupLabel } from "@mighty-decks/spec/assetCards";
import { AssetCard } from "../components/cards/AssetCard";
import { CodeCopyRow } from "../components/common/CodeCopyRow";
import { Text } from "../components/common/Text";
import { assetBaseCardsByGroup } from "../data/assetCards";

void React;

const assetGroupOrder: AssetBaseGroupLabel[] = ["Asset Base", "Asset Medieval"];

const createAssetShortcode = (slug: string): string => `@asset/${slug}`;

export const RulesAssetsPage = (): JSX.Element => {
  return (
    <div className="stack gap-6">
      <div className="stack gap-1">
        <Text variant="h3" color="iron">
          Asset Cards
        </Text>
        <Text variant="body" color="iron-light" className="text-sm">
          Copy each <code>@asset/&lt;slug&gt;</code> shortcode into Adventure
          Module markdown editors. Base and medieval catalog slugs paste into
          Rich Text and normalize into stored GameCard embeds.
        </Text>
      </div>

      {assetGroupOrder.map((groupLabel) => (
        <section key={groupLabel} className="stack gap-3">
          <div className="stack gap-1">
            <Text variant="h3" color="iron" className="text-xl">
              {groupLabel}
            </Text>
            <Text variant="body" color="iron-light" className="text-sm">
              {groupLabel === "Asset Base"
                ? "Core item templates for broad Mighty Decks play."
                : "Medieval gear, supplies, weapons, and treasure."}
            </Text>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {assetBaseCardsByGroup[groupLabel].map((asset) => (
              <div key={asset.slug} className="stack h-full gap-2">
                <AssetCard baseAssetSlug={asset.slug} className="mx-auto" />
                <CodeCopyRow code={createAssetShortcode(asset.slug)} />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};
