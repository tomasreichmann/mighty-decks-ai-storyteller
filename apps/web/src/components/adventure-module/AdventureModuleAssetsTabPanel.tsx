import { useCallback, useEffect, useMemo, useState } from "react";
import type { AdventureModuleResolvedAsset } from "@mighty-decks/spec/adventureModuleAuthoring";
import { Button } from "../common/Button";
import { Message } from "../common/Message";
import { Panel } from "../common/Panel";
import { Text } from "../common/Text";
import { TextField } from "../common/TextField";
import { AssetCard } from "../cards/AssetCard";

interface AdventureModuleAssetsTabPanelProps {
  assets: AdventureModuleResolvedAsset[];
  editable: boolean;
  creating?: boolean;
  createError?: string | null;
  onCreate: () => void;
  onOpenAsset: (assetSlug: string) => void;
  onDeleteAsset?: (assetSlug: string, title: string) => void;
  onAddAssetCardToSelection?: (assetSlug: string) => void;
}

const copyToClipboard = async (value: string): Promise<void> => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textArea = document.createElement("textarea");
  textArea.value = value;
  textArea.setAttribute("readonly", "true");
  textArea.style.position = "fixed";
  textArea.style.opacity = "0";
  document.body.append(textArea);
  textArea.select();
  const copied = document.execCommand("copy");
  textArea.remove();
  if (!copied) {
    throw new Error("Clipboard copy failed.");
  }
};

export const AdventureModuleAssetsTabPanel = ({
  assets,
  editable,
  creating = false,
  createError,
  onCreate,
  onOpenAsset,
  onDeleteAsset,
  onAddAssetCardToSelection,
}: AdventureModuleAssetsTabPanelProps): JSX.Element => {
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedAssetSlug, setCopiedAssetSlug] = useState<string | null>(null);
  const [copyError, setCopyError] = useState<string | null>(null);

  const filteredAssets = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLocaleLowerCase();
    if (!normalizedSearch) {
      return assets;
    }
    return assets.filter((asset) => {
      const haystack =
        `${asset.title} ${asset.summary ?? ""} ${asset.assetSlug}`.toLocaleLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [assets, searchTerm]);

  useEffect(() => {
    if (!copiedAssetSlug) {
      return;
    }
    const timer = window.setTimeout(() => {
      setCopiedAssetSlug(null);
    }, 1600);
    return () => {
      window.clearTimeout(timer);
    };
  }, [copiedAssetSlug]);

  const handleCopyShortcode = useCallback(async (assetSlug: string) => {
    try {
      await copyToClipboard(`@asset/${assetSlug}`);
      setCopiedAssetSlug(assetSlug);
      setCopyError(null);
    } catch {
      setCopyError(`Could not copy @asset/${assetSlug}.`);
    }
  }, []);

  const handleDelete = useCallback(
    (assetSlug: string, title: string): void => {
      if (!onDeleteAsset || !editable) {
        return;
      }
      onDeleteAsset(assetSlug, title);
    },
    [editable, onDeleteAsset],
  );

  return (
    <div className="stack gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="stack gap-1">
          <Text variant="body" color="iron-light" className="text-sm">
            Click an asset to edit its custom card fields and markdown body.
          </Text>
        </div>
        <Button
          color="gold"
          onClick={onCreate}
          disabled={!editable || creating}
        >
          {creating ? "Creating..." : "Create Asset"}
        </Button>
      </div>

      <TextField
        label="Search Assets"
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
        placeholder="Search assets by title, summary, or slug..."
      />

      {createError ? (
        <Message label="Create failed" color="blood">
          {createError}
        </Message>
      ) : null}
      {copyError ? (
        <Message label="Copy failed" color="blood">
          {copyError}
        </Message>
      ) : null}

      {filteredAssets.length === 0 ? (
        <Panel>
          <Text variant="body" color="iron-light">
            {assets.length === 0
              ? "No assets have been created yet."
              : "No assets match your search."}
          </Text>
        </Panel>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredAssets.map((asset) => (
            <Panel
              key={asset.fragmentId}
              className="h-full"
              contentClassName="stack h-full gap-3"
            >
              <button
                type="button"
                className="stack h-full gap-3 text-left"
                onClick={() => onOpenAsset(asset.assetSlug)}
              >
                <AssetCard
                  className="mx-auto w-full max-w-[13rem] transition-transform duration-100 hover:-translate-y-0.5"
                  {...(asset.kind === "custom"
                    ? {
                        kind: "custom" as const,
                        modifier: asset.modifier,
                        noun: asset.noun,
                        nounDescription: asset.nounDescription,
                        adjectiveDescription: asset.adjectiveDescription,
                        iconUrl: asset.iconUrl,
                        overlayUrl: asset.overlayUrl,
                      }
                    : {
                        kind: "legacy_layered" as const,
                        title: asset.title,
                      })}
                />
                <div className="stack gap-1">
                  <Text variant="emphasised" color="iron">
                    {asset.title}
                  </Text>
                  <Text variant="body" color="iron-light" className="text-sm">
                    {asset.kind === "legacy_layered"
                      ? "Reauthor required before this asset can render in markdown."
                      : (asset.summary ?? "No summary yet.")}
                  </Text>
                  <Text variant="note" color="steel-dark">
                    {`@asset/${asset.assetSlug}`}
                  </Text>
                </div>
              </button>
              <div className="mt-auto flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    color="cloth"
                    size="sm"
                    onClick={() => {
                      void handleCopyShortcode(asset.assetSlug);
                    }}
                  >
                    Copy Shortcode
                  </Button>
                  {onAddAssetCardToSelection ? (
                    <Button
                      variant="circle"
                      color="gold"
                      size="sm"
                      aria-label={`Add ${asset.title} to table selection`}
                      title={`Add ${asset.title} to table selection`}
                      onClick={() => {
                        onAddAssetCardToSelection(asset.assetSlug);
                      }}
                    >
                      +
                    </Button>
                  ) : null}
                  {onDeleteAsset ? (
                    <Button
                      variant="circle"
                      color="blood"
                      size="sm"
                      aria-label={`Delete ${asset.title}`}
                      title={`Delete ${asset.title}`}
                      disabled={!editable}
                      onClick={() => {
                        handleDelete(asset.assetSlug, asset.title);
                      }}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="h-3.5 w-3.5 fill-none stroke-current"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M3 6h18" />
                        <path d="M8 6V4h8v2" />
                        <path d="M6 6l1 14h10l1-14" />
                        <path d="M10 10v7" />
                        <path d="M14 10v7" />
                      </svg>
                    </Button>
                  ) : null}
                </div>
                <Text
                  variant="note"
                  color="monster"
                  className={copiedAssetSlug === asset.assetSlug ? "opacity-100" : "opacity-0"}
                >
                  Copied
                </Text>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
};
