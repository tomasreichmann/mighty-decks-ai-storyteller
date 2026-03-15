import type {
  AdventureModuleResolvedActor,
  AdventureModuleResolvedAsset,
  AdventureModuleResolvedCounter,
} from "@mighty-decks/spec/adventureModuleAuthoring";
import type {
  AssetBaseSlug,
  AssetModifierSlug,
} from "@mighty-decks/spec/assetCards";
import { assetBaseCardsByGroup, assetModifierCards } from "../../data/assetCards";
import type { SmartInputDocumentContext } from "../../lib/smartInputContext";
import { AssetCard } from "../cards/AssetCard";
import { Panel } from "../common/Panel";
import { Text } from "../common/Text";
import { TextArea } from "../common/TextArea";
import { TextField } from "../common/TextField";
import { AdventureModuleMarkdownField } from "./AdventureModuleMarkdownField";

interface AdventureModuleAssetEditorProps {
  asset: AdventureModuleResolvedAsset;
  actors?: AdventureModuleResolvedActor[];
  counters?: AdventureModuleResolvedCounter[];
  assets?: AdventureModuleResolvedAsset[];
  smartContextDocument: SmartInputDocumentContext;
  editable: boolean;
  validationMessage?: string | null;
  onTitleChange: (nextValue: string) => void;
  onSummaryChange: (nextValue: string) => void;
  onBaseAssetChange: (nextValue: AssetBaseSlug) => void;
  onModifierChange: (nextValue?: AssetModifierSlug) => void;
  onContentChange: (nextValue: string) => void;
  onFieldBlur: () => void;
  onDelete?: () => void;
}

const MAX_MARKDOWN_LENGTH = 200_000;
const controlClassName =
  "border-[3px] border-b-[6px] border-kac-iron bg-gradient-to-b from-[#fffdf5] to-kac-bone-light px-3 py-2 text-kac-iron shadow-[2px_2px_0_0_#121b23] outline-none transition duration-100 focus-visible:border-kac-gold-darker focus-visible:ring-2 focus-visible:ring-kac-gold-dark/40 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-[1px_1px_0_0_#121b23] font-ui";

export const AdventureModuleAssetEditor = ({
  asset,
  actors = [],
  counters = [],
  assets = [],
  smartContextDocument,
  editable,
  validationMessage,
  onTitleChange,
  onSummaryChange,
  onBaseAssetChange,
  onModifierChange,
  onContentChange,
  onFieldBlur,
  onDelete,
}: AdventureModuleAssetEditorProps): JSX.Element => {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      <Panel contentClassName="stack gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="stack gap-1">
            <Text variant="h3" color="iron">
              Asset Card
            </Text>
            <Text variant="body" color="iron-light" className="text-sm">
              Choose a base asset, optionally layer a medieval-safe modifier, and describe how it changes play.
            </Text>
          </div>
          {onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              disabled={!editable}
              className="inline-flex items-center rounded-full border-2 border-kac-blood-dark bg-kac-bone-light px-3 py-1 font-ui text-xs font-bold uppercase tracking-[0.08em] text-kac-blood-dark shadow-[1px_1px_0_0_#121b23] transition duration-100 hover:brightness-[1.03] active:translate-y-[1px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-55 disabled:shadow-none"
            >
              Delete Asset
            </button>
          ) : null}
        </div>

        <AssetCard
          className="mx-auto w-full max-w-[16rem]"
          baseAssetSlug={asset.baseAssetSlug}
          modifierSlug={asset.modifierSlug}
        />

        <TextField
          label="Asset Name"
          maxLength={120}
          value={asset.title}
          onChange={(event) => onTitleChange(event.target.value)}
          onBlur={onFieldBlur}
          disabled={!editable}
        />

        <TextArea
          label="Summary"
          maxLength={500}
          rows={4}
          value={asset.summary ?? ""}
          onChange={(event) => onSummaryChange(event.target.value)}
          onBlur={onFieldBlur}
          disabled={!editable}
          description="Used in the Assets tab list and quick references."
        />

        <label className="grid gap-1">
          <Text as="span" variant="note" color="iron" className="text-base tracking-[0.04em]">
            Asset Base
          </Text>
          <select
            className={controlClassName}
            value={asset.baseAssetSlug}
            onChange={(event) =>
              onBaseAssetChange(event.target.value as AssetBaseSlug)
            }
            onBlur={onFieldBlur}
            disabled={!editable}
          >
            {(["Asset Base", "Asset Medieval"] as const).map((groupLabel) => (
              <optgroup key={groupLabel} label={groupLabel}>
                {assetBaseCardsByGroup[groupLabel].map((baseAsset) => (
                  <option key={baseAsset.slug} value={baseAsset.slug}>
                    {baseAsset.title}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>

        <label className="grid gap-1">
          <Text as="span" variant="note" color="iron" className="text-base tracking-[0.04em]">
            Asset Modifier
          </Text>
          <select
            className={controlClassName}
            value={asset.modifierSlug ?? ""}
            onChange={(event) =>
              onModifierChange(
                event.target.value.trim().length > 0
                  ? (event.target.value as AssetModifierSlug)
                  : undefined,
              )
            }
            onBlur={onFieldBlur}
            disabled={!editable}
          >
            <option value="">None</option>
            {assetModifierCards.map((modifier) => (
              <option key={modifier.slug} value={modifier.slug}>
                {modifier.title}
              </option>
            ))}
          </select>
        </label>
      </Panel>

      <div className="stack gap-4">
        <AdventureModuleMarkdownField
          label="Asset Markdown"
          description="Author what the asset is, the leverage it creates, and the complications that follow. Asset GameCards render inline in Rich Text."
          selfContextTag="Storyteller Info"
          smartContextDocument={smartContextDocument}
          actors={actors}
          counters={counters}
          assets={assets}
          value={asset.content}
          editable={editable}
          maxLength={MAX_MARKDOWN_LENGTH}
          onChange={onContentChange}
          onFieldBlur={onFieldBlur}
          contentEditableClassName="min-h-[18rem]"
        />

        <Text variant="note" color="iron-light" className="text-sm !opacity-100">
          Asset slug: <code>{asset.assetSlug}</code>. It is regenerated from the
          asset name when you save.
        </Text>

        {validationMessage ? (
          <Text variant="note" color="blood" className="text-sm !opacity-100">
            {validationMessage}
          </Text>
        ) : null}
      </div>
    </div>
  );
};
