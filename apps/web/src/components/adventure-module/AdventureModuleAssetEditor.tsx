import type {
  AdventureModuleResolvedActor,
  AdventureModuleResolvedAsset,
  AdventureModuleResolvedCounter,
  AdventureModuleResolvedEncounter,
  AdventureModuleResolvedQuest,
} from "@mighty-decks/spec/adventureModuleAuthoring";
import type { SmartInputDocumentContext } from "../../lib/smartInputContext";
import { AssetCard } from "../cards/AssetCard";
import { Message } from "../common/Message";
import { Panel } from "../common/Panel";
import { Text } from "../common/Text";
import { TextArea } from "../common/TextArea";
import { TextField } from "../common/TextField";
import { AdventureModuleMarkdownField } from "./AdventureModuleMarkdownField";

export interface AdventureModuleAssetEditorAsset {
  assetSlug: string;
  title: string;
  summary?: string;
  content: string;
  modifier: string;
  noun: string;
  nounDescription: string;
  adjectiveDescription: string;
  iconUrl: string;
  overlayUrl?: string;
}

interface AdventureModuleAssetEditorProps {
  asset: AdventureModuleAssetEditorAsset;
  actors?: AdventureModuleResolvedActor[];
  counters?: AdventureModuleResolvedCounter[];
  assets?: AdventureModuleResolvedAsset[];
  encounters?: AdventureModuleResolvedEncounter[];
  quests?: AdventureModuleResolvedQuest[];
  smartContextDocument: SmartInputDocumentContext;
  editable: boolean;
  reauthorRequired?: boolean;
  validationMessage?: string | null;
  onTitleChange: (nextValue: string) => void;
  onSummaryChange: (nextValue: string) => void;
  onModifierChange: (nextValue: string) => void;
  onNounChange: (nextValue: string) => void;
  onNounDescriptionChange: (nextValue: string) => void;
  onAdjectiveDescriptionChange: (nextValue: string) => void;
  onIconUrlChange: (nextValue: string) => void;
  onOverlayUrlChange: (nextValue: string) => void;
  onContentChange: (nextValue: string) => void;
  onFieldBlur: () => void;
  onDelete?: () => void;
}

const MAX_MARKDOWN_LENGTH = 200_000;

export const AdventureModuleAssetEditor = ({
  asset,
  actors = [],
  counters = [],
  assets = [],
  encounters = [],
  quests = [],
  smartContextDocument,
  editable,
  reauthorRequired = false,
  validationMessage,
  onTitleChange,
  onSummaryChange,
  onModifierChange,
  onNounChange,
  onNounDescriptionChange,
  onAdjectiveDescriptionChange,
  onIconUrlChange,
  onOverlayUrlChange,
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
              Author a fully custom asset card with its own noun, descriptions,
              and image layers.
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
          kind="custom"
          modifier={asset.modifier}
          noun={asset.noun}
          nounDescription={asset.nounDescription}
          adjectiveDescription={asset.adjectiveDescription}
          iconUrl={asset.iconUrl}
          overlayUrl={asset.overlayUrl}
        />

        {reauthorRequired ? (
          <Message label="Reauthor required" color="blood">
            This asset still uses legacy layered metadata. Fill in the custom
            fields below and save to convert it.
          </Message>
        ) : null}

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

        <TextField
          label="Modifier"
          maxLength={120}
          value={asset.modifier}
          onChange={(event) => onModifierChange(event.target.value)}
          onBlur={onFieldBlur}
          disabled={!editable}
          placeholder="Optional adjective, e.g. Smoldering"
        />

        <TextField
          label="Noun"
          maxLength={120}
          value={asset.noun}
          onChange={(event) => onNounChange(event.target.value)}
          onBlur={onFieldBlur}
          disabled={!editable}
        />

        <TextArea
          label="Noun Description"
          maxLength={500}
          rows={4}
          value={asset.nounDescription}
          onChange={(event) => onNounDescriptionChange(event.target.value)}
          onBlur={onFieldBlur}
          disabled={!editable}
        />

        <TextArea
          label="Adjective Description"
          maxLength={500}
          rows={4}
          value={asset.adjectiveDescription}
          onChange={(event) => onAdjectiveDescriptionChange(event.target.value)}
          onBlur={onFieldBlur}
          disabled={!editable}
        />

        <TextField
          label="Icon URL"
          maxLength={500}
          value={asset.iconUrl}
          onChange={(event) => onIconUrlChange(event.target.value)}
          onBlur={onFieldBlur}
          disabled={!editable}
        />

        <TextField
          label="Overlay URL"
          maxLength={500}
          value={asset.overlayUrl ?? ""}
          onChange={(event) => onOverlayUrlChange(event.target.value)}
          onBlur={onFieldBlur}
          disabled={!editable}
          placeholder="Optional overlay art"
        />
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
        encounters={encounters}
        quests={quests}
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
