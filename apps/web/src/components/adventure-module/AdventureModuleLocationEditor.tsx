import { useCallback } from "react";
import type {
  AdventureModuleResolvedActor,
  AdventureModuleResolvedAsset,
  AdventureModuleResolvedCounter,
  AdventureModuleResolvedEncounter,
  AdventureModuleResolvedLocation,
  AdventureModuleResolvedQuest,
} from "@mighty-decks/spec/adventureModuleAuthoring";
import type { CounterAdjustTarget } from "../../lib/gameCardCatalogContext";
import { toMarkdownPlainTextSnippet } from "../../lib/markdownSnippet";
import type { SmartInputDocumentContext } from "../../lib/smartInputContext";
import { Text } from "../common/Text";
import { TextArea } from "../common/TextArea";
import { TextField } from "../common/TextField";
import { AdventureModuleGeneratedImagePicker } from "./AdventureModuleGeneratedImagePicker";
import {
  AdventureModuleLocationMapEditor,
  type AdventureModuleLocationPinTarget,
} from "./AdventureModuleLocationMapEditor";
import { AdventureModuleMarkdownField } from "./AdventureModuleMarkdownField";
import { Panel } from "../common/Panel";
import { ShortcodeField } from "./ShortcodeField";

interface AdventureModuleLocationEditorProps {
  location: AdventureModuleResolvedLocation;
  actors: AdventureModuleResolvedActor[];
  counters?: AdventureModuleResolvedCounter[];
  assets?: AdventureModuleResolvedAsset[];
  encounters?: AdventureModuleResolvedEncounter[];
  quests?: AdventureModuleResolvedQuest[];
  smartContextDocument: SmartInputDocumentContext;
  editable: boolean;
  validationMessage?: string | null;
  pinTargets: AdventureModuleLocationPinTarget[];
  onTitleChange: (nextValue: string) => void;
  onSummaryChange: (nextValue: string) => void;
  onTitleImageUrlChange: (nextValue: string) => void;
  onIntroductionChange: (nextValue: string) => void;
  onDescriptionChange: (nextValue: string) => void;
  onMapImageUrlChange: (nextValue: string) => void;
  onMapPinsChange: (nextPins: AdventureModuleResolvedLocation["mapPins"]) => void;
  onFieldBlur: () => void;
  onOpenPinTarget: (target: AdventureModuleLocationPinTarget) => void;
  onAdjustCounterValue?: (
    counterSlug: string,
    delta: number,
    target?: CounterAdjustTarget,
  ) => void;
  onDelete?: () => void;
  onAddLocationCardToSelection?: () => void;
}

interface LocationImageFieldProps {
  imageLabel: string;
  value?: string;
  editable: boolean;
  identityKey: string;
  previewEmptyLabel: string;
  promptDescription: string;
  resolveContextLines: (selectedContextTags: string[]) => string[];
  defaultContextTags: readonly string[];
  emptyFrameClassName?: string;
  onChange: (nextValue: string) => void;
  onFieldBlur: () => void;
}

const MAX_MARKDOWN_LENGTH = 200_000;
const LOCATION_IMAGE_CONTEXT_TAG_OPTIONS = [
  "Location Name",
  "Location Summary",
  "Introduction",
  "Description",
  "Module Title",
  "Premise",
  "Player Summary",
  "Storyteller Summary",
] as const;
const DEFAULT_TITLE_IMAGE_CONTEXT_TAGS = [
  "Location Name",
  "Location Summary",
  "Introduction",
  "Module Title",
  "Premise",
] as const;
const DEFAULT_MAP_IMAGE_CONTEXT_TAGS = [
  "Location Name",
  "Description",
  "Module Title",
  "Premise",
] as const;

const deleteButtonClassName =
  "inline-flex items-center rounded-full border-2 border-kac-blood-dark bg-kac-bone-light px-3 py-1 font-ui text-xs font-bold uppercase tracking-[0.08em] text-kac-blood-dark shadow-[1px_1px_0_0_#121b23] transition duration-100 hover:brightness-[1.03] active:translate-y-[1px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-55 disabled:shadow-none";

const toSnippet = (value: string, maxLength: number): string =>
  toMarkdownPlainTextSnippet(value, maxLength).trim();

const buildLocationImageContextLines = (
  selectedContextTags: string[],
  location: AdventureModuleResolvedLocation,
  smartContextDocument: SmartInputDocumentContext,
): string[] => {
  const lines: string[] = [];

  for (const selectedTag of selectedContextTags) {
    switch (selectedTag) {
      case "Location Name": {
        const snippet = toSnippet(location.title, 120);
        if (snippet.length > 0) {
          lines.push(`Location name: ${snippet}`);
        }
        break;
      }
      case "Location Summary": {
        const snippet = toSnippet(location.summary ?? "", 320);
        if (snippet.length > 0) {
          lines.push(`Location summary: ${snippet}`);
        }
        break;
      }
      case "Introduction": {
        const snippet = toSnippet(location.introductionMarkdown, 500);
        if (snippet.length > 0) {
          lines.push(`Flavor text: ${snippet}`);
        }
        break;
      }
      case "Description": {
        const snippet = toSnippet(location.descriptionMarkdown, 550);
        if (snippet.length > 0) {
          lines.push(`Location details: ${snippet}`);
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

const LocationImageField = ({
  imageLabel,
  value,
  editable,
  identityKey,
  previewEmptyLabel,
  promptDescription,
  resolveContextLines,
  defaultContextTags,
  emptyFrameClassName = "aspect-video min-h-56",
  onChange,
  onFieldBlur,
}: LocationImageFieldProps): JSX.Element => {
  return (
    <Panel contentClassName="stack gap-4">
      <div className="stack gap-1">
        <Text variant="h3" color="iron">
          {imageLabel}
        </Text>
        <Text variant="body" color="iron-light" className="text-sm">
          Choose an image or open the dialog to generate new options.
        </Text>
      </div>

      <AdventureModuleGeneratedImagePicker
        label={imageLabel}
        promptLabel={`${imageLabel} Prompt`}
        promptDescription={promptDescription}
        contextLabel={`${imageLabel} Context`}
        contextDescription="Edit the base prompt text. Selected context tags are appended for generation and lookup, but are not shown in the prompt field."
        workflowContextIntro={`${imageLabel} prompt for adventure module location art. Refine wording while preserving visual clarity and useful scene composition.`}
        contextTagOptions={LOCATION_IMAGE_CONTEXT_TAG_OPTIONS}
        defaultContextTags={defaultContextTags}
        resolveContextLines={resolveContextLines}
        emptyLabel={previewEmptyLabel}
        emptyFrameClassName={emptyFrameClassName}
        disabled={!editable}
        identityKey={identityKey}
        value={value ?? ""}
        onChange={onChange}
        onBlur={onFieldBlur}
      />
    </Panel>
  );
};

export const AdventureModuleLocationEditor = ({
  location,
  actors,
  counters = [],
  assets = [],
  encounters = [],
  quests = [],
  smartContextDocument,
  editable,
  validationMessage,
  pinTargets,
  onTitleChange,
  onSummaryChange,
  onTitleImageUrlChange,
  onIntroductionChange,
  onDescriptionChange,
  onMapImageUrlChange,
  onMapPinsChange,
  onFieldBlur,
  onOpenPinTarget,
  onAdjustCounterValue,
  onDelete,
  onAddLocationCardToSelection,
}: AdventureModuleLocationEditorProps): JSX.Element => {
  const resolveImageContextLines = useCallback(
    (selectedContextTags: string[]) =>
      buildLocationImageContextLines(
        selectedContextTags,
        location,
        smartContextDocument,
      ),
    [location, smartContextDocument],
  );

  return (
    <div className="stack gap-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
        <Panel contentClassName="stack gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="stack gap-1">
              <Text variant="h3" color="iron">
                Location
              </Text>
              <Text variant="body" color="iron-light" className="text-sm">
                Define the location title, summary, and slug-driven route.
              </Text>
            </div>
            {onDelete ? (
              <button
                type="button"
                onClick={onDelete}
                disabled={!editable}
                className={deleteButtonClassName}
              >
                Delete Location
              </button>
            ) : null}
          </div>

          <TextField
            label="Location Name"
            maxLength={120}
            value={location.title}
            onChange={(event) => onTitleChange(event.target.value)}
            onBlur={onFieldBlur}
            disabled={!editable}
          />

          <TextArea
            label="Summary"
            maxLength={500}
            rows={4}
            value={location.summary ?? ""}
            onChange={(event) => onSummaryChange(event.target.value)}
            onBlur={onFieldBlur}
            disabled={!editable}
            description="Used in the Locations tab list and quick references."
          />

          <Text variant="note" color="iron-light" className="text-sm !opacity-100">
            Location slug: <code>{location.locationSlug}</code>. It is
            regenerated from the location name when you save.
          </Text>

          <ShortcodeField
            shortcode={`@location/${location.locationSlug}`}
            onAddToSelection={onAddLocationCardToSelection}
          />

          {validationMessage ? (
            <Text variant="note" color="blood" className="text-sm !opacity-100">
              {validationMessage}
            </Text>
          ) : null}
        </Panel>

        <LocationImageField
          imageLabel="Title Image"
          value={location.titleImageUrl}
          editable={editable}
          identityKey={`${location.fragmentId}-title-image`}
          previewEmptyLabel="No title image selected yet."
          promptDescription="Generate a visual key art image for this location."
          resolveContextLines={resolveImageContextLines}
          defaultContextTags={DEFAULT_TITLE_IMAGE_CONTEXT_TAGS}
          emptyFrameClassName="aspect-video min-h-56"
          onChange={onTitleImageUrlChange}
          onFieldBlur={onFieldBlur}
        />
      </div>

      <AdventureModuleMarkdownField
        label="Introduction"
        description="Usually read aloud directly to players as flavor text when they arrive."
        selfContextTag="Player Info"
        smartContextDocument={smartContextDocument}
        actors={actors}
        counters={counters}
        assets={assets}
        encounters={encounters}
        quests={quests}
        value={location.introductionMarkdown}
        editable={editable}
        maxLength={MAX_MARKDOWN_LENGTH}
        onChange={onIntroductionChange}
        onFieldBlur={onFieldBlur}
        onAdjustCounterValue={onAdjustCounterValue}
        contentEditableClassName="min-h-[12rem]"
      />

      <AdventureModuleMarkdownField
        label="Description"
        description="Record who is usually here, what can be found, exits, hazards, and other reusable prep."
        selfContextTag="Storyteller Info"
        smartContextDocument={smartContextDocument}
        actors={actors}
        counters={counters}
        assets={assets}
        encounters={encounters}
        quests={quests}
        value={location.descriptionMarkdown}
        editable={editable}
        maxLength={MAX_MARKDOWN_LENGTH}
        onChange={onDescriptionChange}
        onFieldBlur={onFieldBlur}
        onAdjustCounterValue={onAdjustCounterValue}
        contentEditableClassName="min-h-[16rem]"
      />

        <LocationImageField
          imageLabel="Map Image"
          value={location.mapImageUrl}
          editable={editable}
          identityKey={`${location.fragmentId}-map-image`}
          previewEmptyLabel="No map image selected yet."
          promptDescription="Generate the interactive map image used for pin placement."
          resolveContextLines={resolveImageContextLines}
          defaultContextTags={DEFAULT_MAP_IMAGE_CONTEXT_TAGS}
          emptyFrameClassName="aspect-square min-h-56"
          onChange={onMapImageUrlChange}
          onFieldBlur={onFieldBlur}
        />

      <AdventureModuleLocationMapEditor
        mapImageUrl={location.mapImageUrl}
        pins={location.mapPins}
        editable={editable}
        pinTargets={pinTargets}
        onPinsChange={onMapPinsChange}
        onFieldBlur={onFieldBlur}
        onOpenPinTarget={onOpenPinTarget}
      />

      <Text variant="note" color="iron-light" className="text-sm !opacity-100">
        Location pins can link to other locations, actors, encounters, or
        quests. Current location links are excluded from the picker.
      </Text>
    </div>
  );
};
