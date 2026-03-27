import { useCallback } from "react";
import type {
  AdventureModuleResolvedActor,
  AdventureModuleResolvedAsset,
  AdventureModuleResolvedCounter,
  AdventureModuleResolvedEncounter,
} from "@mighty-decks/spec/adventureModuleAuthoring";
import type { CounterAdjustTarget } from "../../lib/gameCardCatalogContext";
import { toMarkdownPlainTextSnippet } from "../../lib/markdownSnippet";
import type { SmartInputDocumentContext } from "../../lib/smartInputContext";
import { Panel } from "../common/Panel";
import { Text } from "../common/Text";
import { TextArea } from "../common/TextArea";
import { TextField } from "../common/TextField";
import { AdventureModuleGeneratedImageField } from "./AdventureModuleGeneratedImageField";
import { AdventureModuleMarkdownField } from "./AdventureModuleMarkdownField";

interface AdventureModuleEncounterEditorProps {
  encounter: AdventureModuleResolvedEncounter;
  actors: AdventureModuleResolvedActor[];
  counters?: AdventureModuleResolvedCounter[];
  assets?: AdventureModuleResolvedAsset[];
  encounters?: AdventureModuleResolvedEncounter[];
  smartContextDocument: SmartInputDocumentContext;
  editable: boolean;
  validationMessage?: string | null;
  onTitleChange: (nextValue: string) => void;
  onSummaryChange: (nextValue: string) => void;
  onPrerequisitesChange: (nextValue: string) => void;
  onTitleImageUrlChange: (nextValue: string) => void;
  onContentChange: (nextValue: string) => void;
  onFieldBlur: () => void;
  onAdjustCounterValue?: (
    counterSlug: string,
    delta: number,
    target?: CounterAdjustTarget,
  ) => void;
  onDelete?: () => void;
}

interface EncounterImageFieldProps {
  value?: string;
  editable: boolean;
  identityKey: string;
  resolveContextLines: (selectedContextTags: string[]) => string[];
  onChange: (nextValue: string) => void;
  onFieldBlur: () => void;
}

const MAX_MARKDOWN_LENGTH = 200_000;
const ENCOUNTER_IMAGE_CONTEXT_TAG_OPTIONS = [
  "Encounter Name",
  "Encounter Summary",
  "Prerequisites",
  "Script",
  "Module Title",
  "Premise",
  "Player Summary",
  "Storyteller Summary",
] as const;
const DEFAULT_ENCOUNTER_IMAGE_CONTEXT_TAGS = [
  "Encounter Name",
  "Encounter Summary",
  "Script",
  "Module Title",
  "Premise",
] as const;

const deleteButtonClassName =
  "inline-flex items-center rounded-full border-2 border-kac-blood-dark bg-kac-bone-light px-3 py-1 font-ui text-xs font-bold uppercase tracking-[0.08em] text-kac-blood-dark shadow-[1px_1px_0_0_#121b23] transition duration-100 hover:brightness-[1.03] active:translate-y-[1px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-55 disabled:shadow-none";

const toSnippet = (value: string, maxLength: number): string =>
  toMarkdownPlainTextSnippet(value, maxLength).trim();

const buildEncounterImageContextLines = (
  selectedContextTags: string[],
  encounter: AdventureModuleResolvedEncounter,
  smartContextDocument: SmartInputDocumentContext,
): string[] => {
  const lines: string[] = [];

  for (const selectedTag of selectedContextTags) {
    switch (selectedTag) {
      case "Encounter Name": {
        const snippet = toSnippet(encounter.title, 120);
        if (snippet.length > 0) {
          lines.push(`Encounter name: ${snippet}`);
        }
        break;
      }
      case "Encounter Summary": {
        const snippet = toSnippet(encounter.summary ?? "", 320);
        if (snippet.length > 0) {
          lines.push(`Encounter summary: ${snippet}`);
        }
        break;
      }
      case "Prerequisites": {
        const snippet = toSnippet(encounter.prerequisites, 220);
        if (snippet.length > 0) {
          lines.push(`Prerequisites: ${snippet}`);
        }
        break;
      }
      case "Script": {
        const snippet = toSnippet(encounter.content, 650);
        if (snippet.length > 0) {
          lines.push(`Encounter script: ${snippet}`);
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

const EncounterImageField = ({
  value,
  editable,
  identityKey,
  resolveContextLines,
  onChange,
  onFieldBlur,
}: EncounterImageFieldProps): JSX.Element => {
  return (
    <Panel contentClassName="stack gap-4">
      <div className="stack gap-1">
        <Text variant="h3" color="iron">
          Title Image
        </Text>
        <Text variant="body" color="iron-light" className="text-sm">
          Paste a final image URL or generate encounter key art and pick one.
        </Text>
      </div>

      <AdventureModuleGeneratedImageField
        label="Title Image"
        promptLabel="Title Image Prompt"
        promptDescription="Generate a visual key art image for this encounter."
        contextLabel="Title Image Context"
        contextDescription="Edit the base prompt text. Selected context tags are appended for generation and lookup, but are not shown in the prompt field."
        workflowContextIntro="Title image prompt for adventure module encounter art. Refine wording while preserving a clear playable scene and strong visual focus."
        contextTagOptions={ENCOUNTER_IMAGE_CONTEXT_TAG_OPTIONS}
        defaultContextTags={DEFAULT_ENCOUNTER_IMAGE_CONTEXT_TAGS}
        resolveContextLines={resolveContextLines}
        emptyLabel="No title image selected yet."
        pendingLabel="Generating title image..."
        disabled={!editable}
        identityKey={identityKey}
        value={value ?? ""}
        valueFieldLabel="Title Image URL"
        valueFieldDescription="Paste an existing image URL or pick one from the generated batch below."
        onChange={onChange}
        onBlur={onFieldBlur}
      />
    </Panel>
  );
};

export const AdventureModuleEncounterEditor = ({
  encounter,
  actors,
  counters = [],
  assets = [],
  encounters = [],
  smartContextDocument,
  editable,
  validationMessage,
  onTitleChange,
  onSummaryChange,
  onPrerequisitesChange,
  onTitleImageUrlChange,
  onContentChange,
  onFieldBlur,
  onAdjustCounterValue,
  onDelete,
}: AdventureModuleEncounterEditorProps): JSX.Element => {
  const resolveImageContextLines = useCallback(
    (selectedContextTags: string[]) =>
      buildEncounterImageContextLines(
        selectedContextTags,
        encounter,
        smartContextDocument,
      ),
    [encounter, smartContextDocument],
  );

  return (
    <div className="stack gap-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
        <Panel contentClassName="stack gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="stack gap-1">
              <Text variant="h3" color="iron">
                Encounter
              </Text>
              <Text variant="body" color="iron-light" className="text-sm">
                Define the encounter title, short description, prerequisites,
                and slug-driven route.
              </Text>
            </div>
            {onDelete ? (
              <button
                type="button"
                onClick={onDelete}
                disabled={!editable}
                className={deleteButtonClassName}
              >
                Delete Encounter
              </button>
            ) : null}
          </div>

          <TextField
            label="Encounter Name"
            maxLength={120}
            value={encounter.title}
            onChange={(event) => onTitleChange(event.target.value)}
            onBlur={onFieldBlur}
            disabled={!editable}
          />

          <TextArea
            label="Short Description"
            maxLength={500}
            rows={4}
            value={encounter.summary ?? ""}
            onChange={(event) => onSummaryChange(event.target.value)}
            onBlur={onFieldBlur}
            disabled={!editable}
            description="Used on encounter cards in authoring lists and markdown embeds."
          />

          <TextArea
            label="Prerequisites"
            maxLength={240}
            rows={3}
            value={encounter.prerequisites}
            onChange={(event) => onPrerequisitesChange(event.target.value)}
            onBlur={onFieldBlur}
            disabled={!editable}
            description="Short guidance like minimum level, required clue, or active quest."
          />

          <Text variant="note" color="iron-light" className="text-sm !opacity-100">
            Encounter slug: <code>{encounter.encounterSlug}</code>. It is
            regenerated from the encounter name when you save.
          </Text>

          {validationMessage ? (
            <Text variant="note" color="blood" className="text-sm !opacity-100">
              {validationMessage}
            </Text>
          ) : null}
        </Panel>

        <EncounterImageField
          value={encounter.titleImageUrl}
          editable={editable}
          identityKey={`${encounter.fragmentId}-title-image`}
          resolveContextLines={resolveImageContextLines}
          onChange={onTitleImageUrlChange}
          onFieldBlur={onFieldBlur}
        />
      </div>

      <AdventureModuleMarkdownField
        label="Encounter Script"
        description="Author the encounter beat, player goal, pressure, consequences, and reusable GM guidance. EncounterCard embeds render inline in Rich Text."
        selfContextTag="Storyteller Info"
        smartContextDocument={smartContextDocument}
        actors={actors}
        counters={counters}
        assets={assets}
        encounters={encounters}
        value={encounter.content}
        editable={editable}
        maxLength={MAX_MARKDOWN_LENGTH}
        onChange={onContentChange}
        onFieldBlur={onFieldBlur}
        onAdjustCounterValue={onAdjustCounterValue}
        contentEditableClassName="min-h-[18rem]"
      />
    </div>
  );
};
