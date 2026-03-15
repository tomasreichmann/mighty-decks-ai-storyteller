import React, { useState } from "react";
import type {
  AssetBaseGroupLabel,
  AssetModifierSlug,
} from "@mighty-decks/spec/assetCards";
import { AssetCard } from "../components/cards/AssetCard";
import { CodeCopyRow } from "../components/common/CodeCopyRow";
import { Text } from "../components/common/Text";
import {
  assetBaseCardsByGroup,
  assetModifierCards,
} from "../data/assetCards";

void React;

const assetGroupOrder: AssetBaseGroupLabel[] = ["Asset Base", "Asset Medieval"];

const createAssetShortcode = (
  slug: string,
  modifierSlug?: AssetModifierSlug,
): string =>
  modifierSlug && modifierSlug.trim().length > 0
    ? `@asset/${slug}/${modifierSlug}`
    : `@asset/${slug}`;

export const RulesAssetsPage = (): JSX.Element => {
  const [modifierEnabled, setModifierEnabled] = useState(false);
  const [selectedModifierSlug, setSelectedModifierSlug] = useState<
    AssetModifierSlug | undefined
  >(assetModifierCards[0]?.slug);
  const appliedModifierSlug = modifierEnabled ? selectedModifierSlug : undefined;

  return (
    <div className="stack gap-6">
      <div className="stack gap-1">
        <Text variant="h3" color="iron">
          Asset Cards
        </Text>
        <Text variant="body" color="iron-light" className="text-sm">
          Copy each <code>@asset/&lt;slug&gt;</code> shortcode into Adventure
          Module markdown editors. When Modifier is enabled, copied shortcodes
          use <code>@asset/&lt;slug&gt;/&lt;modifier-slug&gt;</code> and normalize
          into stored GameCard embeds with <code>modifierSlug</code>.
        </Text>
      </div>

      <div className="stack gap-3 rounded border-2 border-kac-iron/40 bg-kac-bone-light/60 px-4 py-3">
        <label className="inline-flex items-center gap-2 font-ui text-sm font-bold uppercase tracking-[0.08em] text-kac-iron">
          <input
            type="checkbox"
            checked={modifierEnabled}
            onChange={(event) => {
              const nextChecked = event.target.checked;
              setModifierEnabled(nextChecked);
              if (nextChecked && !selectedModifierSlug) {
                setSelectedModifierSlug(assetModifierCards[0]?.slug);
              }
            }}
          />
          Modifier
        </label>

        {modifierEnabled ? (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {assetModifierCards.map((modifier) => (
              <label
                key={modifier.slug}
                className="inline-flex items-center gap-2 rounded border border-kac-iron/25 bg-white/40 px-3 py-2 font-ui text-sm text-kac-iron"
              >
                <input
                  type="radio"
                  name="rules-assets-modifier"
                  value={modifier.slug}
                  checked={selectedModifierSlug === modifier.slug}
                  onChange={() => {
                    setSelectedModifierSlug(modifier.slug);
                  }}
                />
                <span>{modifier.title}</span>
              </label>
            ))}
          </div>
        ) : null}
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
                <AssetCard
                  baseAssetSlug={asset.slug}
                  modifierSlug={appliedModifierSlug}
                  className="mx-auto"
                />
                <CodeCopyRow
                  code={createAssetShortcode(asset.slug, appliedModifierSlug)}
                />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};
