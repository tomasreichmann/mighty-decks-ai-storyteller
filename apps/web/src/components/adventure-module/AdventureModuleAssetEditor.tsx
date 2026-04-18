import { useCallback, useMemo } from "react";
import type {
  AdventureModuleResolvedActor,
  AdventureModuleResolvedAsset,
  AdventureModuleResolvedCounter,
  AdventureModuleResolvedEncounter,
  AdventureModuleResolvedLocation,
  AdventureModuleResolvedQuest,
} from "@mighty-decks/spec/adventureModuleAuthoring";
import { useAuthoringContext } from "../../lib/authoring/store/AuthoringProvider";
import type { SmartInputDocumentContext } from "../../lib/smartInputContext";
import { toMarkdownPlainTextSnippet } from "../../lib/markdownSnippet";
import { AssetCard } from "../cards/AssetCard";
import { Message } from "../common/Message";
import { Panel } from "../common/Panel";
import { Text } from "../common/Text";
import { TextArea } from "../common/TextArea";
import { TextField } from "../common/TextField";
import { AdventureModuleGeneratedImagePicker } from "./AdventureModuleGeneratedImagePicker";
import { AdventureModuleMarkdownField } from "./AdventureModuleMarkdownField";
import { ShortcodeField } from "./ShortcodeField";
import { SceneCardDetailLink } from "./SceneCardDetailLink";

export interface AdventureModuleAssetEditorAsset {
  fragmentId: string;
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
  locations?: AdventureModuleResolvedLocation[];
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
  onAddAssetCardToSelection?: () => void;
}

const MAX_MARKDOWN_LENGTH = 200_000;
const ASSET_IMAGE_CONTEXT_TAG_OPTIONS = [
  "Asset Name",
  "Asset Summary",
  "Modifier",
  "Noun",
  "Noun Description",
  "Adjective Description",
  "Asset Markdown",
  "Module Title",
  "Module Summary",
  "Module Intent",
  "Premise",
  "Player Summary",
  "Storyteller Summary",
] as const;
const DEFAULT_ASSET_IMAGE_CONTEXT_TAGS = [
  "Asset Name",
  "Asset Summary",
  "Modifier",
  "Noun",
  "Asset Markdown",
] as const;

const toSnippet = (value: string, maxLength: number): string =>
  toMarkdownPlainTextSnippet(value, maxLength).trim();

const buildAssetImageContextLines = (
  selectedContextTags: string[],
  asset: AdventureModuleAssetEditorAsset,
  smartContextDocument: SmartInputDocumentContext,
): string[] => {
  const lines: string[] = [];

  for (const selectedTag of selectedContextTags) {
    switch (selectedTag) {
      case "Asset Name": {
        const snippet = toSnippet(asset.title, 120);
        if (snippet.length > 0) {
          lines.push(`Asset name: ${snippet}`);
        }
        break;
      }
      case "Asset Summary": {
        const snippet = toSnippet(asset.summary ?? "", 320);
        if (snippet.length > 0) {
          lines.push(`Asset summary: ${snippet}`);
        }
        break;
      }
      case "Modifier": {
        const snippet = toSnippet(asset.modifier, 120);
        if (snippet.length > 0) {
          lines.push(`Modifier: ${snippet}`);
        }
        break;
      }
      case "Noun": {
        const snippet = toSnippet(asset.noun, 120);
        if (snippet.length > 0) {
          lines.push(`Noun: ${snippet}`);
        }
        break;
      }
      case "Noun Description": {
        const snippet = toSnippet(asset.nounDescription, 500);
        if (snippet.length > 0) {
          lines.push(`Noun description: ${snippet}`);
        }
        break;
      }
      case "Adjective Description": {
        const snippet = toSnippet(asset.adjectiveDescription, 500);
        if (snippet.length > 0) {
          lines.push(`Adjective description: ${snippet}`);
        }
        break;
      }
      case "Asset Markdown": {
        const snippet = toSnippet(asset.content, 650);
        if (snippet.length > 0) {
          lines.push(`Asset brief: ${snippet}`);
        }
        break;
      }
      case "Module Title": {
        const snippet = toSnippet(smartContextDocument.moduleTitle, 120);
        if (snippet.length > 0) {
          lines.push(`Module title: ${snippet}`);
        }
        break;
      }
      case "Module Summary": {
        const snippet = toSnippet(smartContextDocument.moduleSummary, 220);
        if (snippet.length > 0) {
          lines.push(`Module summary: ${snippet}`);
        }
        break;
      }
      case "Module Intent": {
        const snippet = toSnippet(smartContextDocument.moduleIntent, 220);
        if (snippet.length > 0) {
          lines.push(`Module intent: ${snippet}`);
        }
        break;
      }
      case "Premise": {
        const snippet = toSnippet(smartContextDocument.premise, 500);
        if (snippet.length > 0) {
          lines.push(`Premise: ${snippet}`);
        }
        break;
      }
      case "Player Summary": {
        const snippet = toSnippet(smartContextDocument.playerSummary, 450);
        if (snippet.length > 0) {
          lines.push(`Player summary: ${snippet}`);
        }
        break;
      }
      case "Storyteller Summary": {
        const snippet = toSnippet(smartContextDocument.storytellerSummary, 450);
        if (snippet.length > 0) {
          lines.push(`Storyteller summary: ${snippet}`);
        }
        break;
      }
      default:
        break;
    }
  }

  return lines;
};

export const AdventureModuleAssetEditor = ({
  asset,
  actors = [],
  counters = [],
  assets = [],
  encounters = [],
  locations = [],
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
  onAddAssetCardToSelection,
}: AdventureModuleAssetEditorProps): JSX.Element => {
  const { buildRoute, state } = useAuthoringContext();
  const resolveIconContextLines = useCallback(
    (selectedContextTags: string[]) =>
      buildAssetImageContextLines(
        selectedContextTags,
        asset,
        smartContextDocument,
      ),
    [asset, smartContextDocument],
  );

  const detailLink = useMemo(() => {
    const moduleSlug = state.detail?.index.slug;
    if (!moduleSlug) {
      return null;
    }

    return {
      href: buildRoute(moduleSlug, "assets", asset.assetSlug),
      label: `Open ${asset.title} detail in a new tab`,
    };
  }, [asset.assetSlug, asset.title, buildRoute, state.detail?.index.slug]);

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

        <div className="relative z-0 mx-auto w-full max-w-[16rem] pb-4">
          <AssetCard
            className="w-full"
            kind="custom"
            modifier={asset.modifier}
            noun={asset.noun}
            nounDescription={asset.nounDescription}
            adjectiveDescription={asset.adjectiveDescription}
            iconUrl={asset.iconUrl}
            overlayUrl={asset.overlayUrl}
          />
          {detailLink ? (
            <SceneCardDetailLink
              href={detailLink.href}
              label={detailLink.label}
            />
          ) : null}
        </div>

        <ShortcodeField
          shortcode={`@asset/${asset.assetSlug}`}
          onAddToSelection={onAddAssetCardToSelection}
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

        <div className="stack gap-1">
          <Text variant="h3" color="iron">
            Icon Image
          </Text>
          <Text variant="body" color="iron-light" className="text-sm">
            Choose an image or open the dialog to generate asset art.
          </Text>
        </div>

        <AdventureModuleGeneratedImagePicker
          label="Icon Image"
          promptLabel="Icon Image Prompt"
          promptDescription="Generate a visual image for this asset's icon layer."
          contextLabel="Icon Image Context"
          contextDescription="Edit the base prompt text. Selected context tags are appended for generation and lookup, but are not shown in the prompt field."
          workflowContextIntro="Icon image prompt for custom asset art. Refine wording while preserving a clear silhouette, readable materials, and a compact card-friendly composition."
          contextTagOptions={ASSET_IMAGE_CONTEXT_TAG_OPTIONS}
          defaultContextTags={DEFAULT_ASSET_IMAGE_CONTEXT_TAGS}
          resolveContextLines={resolveIconContextLines}
          emptyLabel="No icon image selected yet."
          emptyFrameClassName="aspect-video min-h-48"
          disabled={!editable}
          identityKey={`${asset.fragmentId}-icon-image`}
          value={asset.iconUrl}
          onChange={onIconUrlChange}
          onBlur={onFieldBlur}
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
          locations={locations}
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
