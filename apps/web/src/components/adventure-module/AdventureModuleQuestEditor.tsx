import { useCallback } from "react";
import type {
  AdventureModuleResolvedActor,
  AdventureModuleResolvedAsset,
  AdventureModuleResolvedCounter,
  AdventureModuleResolvedEncounter,
  AdventureModuleResolvedQuest,
} from "@mighty-decks/spec/adventureModuleAuthoring";
import type { CounterAdjustTarget } from "../../lib/gameCardCatalogContext";
import { createQuestCardJsx } from "../../lib/gameCardMarkdown";
import { toMarkdownPlainTextSnippet } from "../../lib/markdownSnippet";
import type { SmartInputDocumentContext } from "../../lib/smartInputContext";
import { Panel } from "../common/Panel";
import { Text } from "../common/Text";
import { TextArea } from "../common/TextArea";
import { TextField } from "../common/TextField";
import { AdventureModuleGeneratedImagePicker } from "./AdventureModuleGeneratedImagePicker";
import { AdventureModuleMarkdownField } from "./AdventureModuleMarkdownField";
import { ShortcodeField } from "./ShortcodeField";

interface AdventureModuleQuestEditorProps {
  quest: AdventureModuleResolvedQuest;
  actors: AdventureModuleResolvedActor[];
  counters?: AdventureModuleResolvedCounter[];
  assets?: AdventureModuleResolvedAsset[];
  encounters?: AdventureModuleResolvedEncounter[];
  quests?: AdventureModuleResolvedQuest[];
  smartContextDocument: SmartInputDocumentContext;
  editable: boolean;
  validationMessage?: string | null;
  onTitleChange: (nextValue: string) => void;
  onSummaryChange: (nextValue: string) => void;
  onTitleImageUrlChange: (nextValue: string) => void;
  onContentChange: (nextValue: string) => void;
  onFieldBlur: () => void;
  onAdjustCounterValue?: (
    counterSlug: string,
    delta: number,
    target?: CounterAdjustTarget,
  ) => void;
  onDelete?: () => void;
  onAddQuestCardToSelection?: () => void;
}

interface QuestImageFieldProps {
  value?: string;
  editable: boolean;
  identityKey: string;
  resolveContextLines: (selectedContextTags: string[]) => string[];
  emptyFrameClassName?: string;
  onChange: (nextValue: string) => void;
  onFieldBlur: () => void;
}

const MAX_MARKDOWN_LENGTH = 200_000;
const QUEST_IMAGE_CONTEXT_TAG_OPTIONS = [
  "Quest Name",
  "Quest Summary",
  "Script",
  "Module Title",
  "Premise",
  "Player Summary",
  "Storyteller Summary",
] as const;
const DEFAULT_QUEST_IMAGE_CONTEXT_TAGS = [
  "Quest Name",
  "Quest Summary",
  "Script",
  "Module Title",
  "Premise",
] as const;

const deleteButtonClassName =
  "inline-flex items-center rounded-full border-2 border-kac-blood-dark bg-kac-bone-light px-3 py-1 font-ui text-xs font-bold uppercase tracking-[0.08em] text-kac-blood-dark shadow-[1px_1px_0_0_#121b23] transition duration-100 hover:brightness-[1.03] active:translate-y-[1px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-55 disabled:shadow-none";

const toSnippet = (value: string, maxLength: number): string =>
  toMarkdownPlainTextSnippet(value, maxLength).trim();

const buildQuestImageContextLines = (
  selectedContextTags: string[],
  quest: AdventureModuleResolvedQuest,
  smartContextDocument: SmartInputDocumentContext,
): string[] => {
  const lines: string[] = [];

  for (const selectedTag of selectedContextTags) {
    switch (selectedTag) {
      case "Quest Name": {
        const snippet = toSnippet(quest.title, 120);
        if (snippet.length > 0) {
          lines.push(`Quest name: ${snippet}`);
        }
        break;
      }
      case "Quest Summary": {
        const snippet = toSnippet(quest.summary ?? "", 320);
        if (snippet.length > 0) {
          lines.push(`Quest summary: ${snippet}`);
        }
        break;
      }
      case "Script": {
        const snippet = toSnippet(quest.content, 650);
        if (snippet.length > 0) {
          lines.push(`Quest brief: ${snippet}`);
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

const QuestImageField = ({
  value,
  editable,
  identityKey,
  resolveContextLines,
  emptyFrameClassName = "aspect-video min-h-56",
  onChange,
  onFieldBlur,
}: QuestImageFieldProps): JSX.Element => {
  return (
    <Panel contentClassName="stack gap-4">
      <div className="stack gap-1">
        <Text variant="h3" color="iron">
          Title Image
        </Text>
        <Text variant="body" color="iron-light" className="text-sm">
          Choose an image or open the dialog to generate quest key art.
        </Text>
      </div>

      <AdventureModuleGeneratedImagePicker
        label="Title Image"
        promptLabel="Title Image Prompt"
        promptDescription="Generate a visual key art image for this quest."
        contextLabel="Title Image Context"
        contextDescription="Edit the base prompt text. Selected context tags are appended for generation and lookup, but are not shown in the prompt field."
        workflowContextIntro="Title image prompt for adventure module quest art. Refine wording while preserving a clear objective, escalation, and visual focal point."
        contextTagOptions={QUEST_IMAGE_CONTEXT_TAG_OPTIONS}
        defaultContextTags={DEFAULT_QUEST_IMAGE_CONTEXT_TAGS}
        resolveContextLines={resolveContextLines}
        emptyLabel="No title image selected yet."
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

export const AdventureModuleQuestEditor = ({
  quest,
  actors,
  counters = [],
  assets = [],
  encounters = [],
  quests = [],
  smartContextDocument,
  editable,
  validationMessage,
  onTitleChange,
  onSummaryChange,
  onTitleImageUrlChange,
  onContentChange,
  onFieldBlur,
  onAdjustCounterValue,
  onDelete,
  onAddQuestCardToSelection,
}: AdventureModuleQuestEditorProps): JSX.Element => {
  const resolveImageContextLines = useCallback(
    (selectedContextTags: string[]) =>
      buildQuestImageContextLines(selectedContextTags, quest, smartContextDocument),
    [quest, smartContextDocument],
  );

  return (
    <div className="stack gap-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
        <Panel contentClassName="stack gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="stack gap-1">
              <Text variant="h3" color="iron">
                Quest
              </Text>
              <Text variant="body" color="iron-light" className="text-sm">
                Define the quest title, summary, title image, and slug-driven
                route.
              </Text>
            </div>
            {onDelete ? (
              <button
                type="button"
                onClick={onDelete}
                disabled={!editable}
                className={deleteButtonClassName}
              >
                Delete Quest
              </button>
            ) : null}
          </div>

          <TextField
            label="Quest Name"
            maxLength={120}
            value={quest.title}
            onChange={(event) => onTitleChange(event.target.value)}
            onBlur={onFieldBlur}
            disabled={!editable}
          />

          <TextArea
            label="Summary"
            maxLength={500}
            rows={4}
            value={quest.summary ?? ""}
            onChange={(event) => onSummaryChange(event.target.value)}
            onBlur={onFieldBlur}
            disabled={!editable}
            description="Used on quest cards in authoring lists and markdown embeds."
          />

          <Text variant="note" color="iron-light" className="text-sm !opacity-100">
            Quest slug: <code>{quest.questSlug}</code>. It is regenerated from
            the quest name when you save.
          </Text>

          <ShortcodeField
            shortcode={`@quest/${quest.questSlug}`}
            onAddToSelection={onAddQuestCardToSelection}
          />

          <Text variant="note" color="iron-light" className="text-sm !opacity-100">
            Embed with <code>{createQuestCardJsx(quest.questSlug)}</code> or the
            shortcode <code>@quest/{quest.questSlug}</code>.
          </Text>

          {validationMessage ? (
            <Text variant="note" color="blood" className="text-sm !opacity-100">
              {validationMessage}
            </Text>
          ) : null}
        </Panel>

        <QuestImageField
          value={quest.titleImageUrl}
          editable={editable}
          identityKey={`${quest.fragmentId}-title-image`}
          resolveContextLines={resolveImageContextLines}
          onChange={onTitleImageUrlChange}
          onFieldBlur={onFieldBlur}
        />
      </div>

      <AdventureModuleMarkdownField
        label="Quest Script"
        description="Author the quest hook, escalation, consequences, and reusable GM guidance. QuestCard embeds render inline in Rich Text."
        selfContextTag="Storyteller Info"
        smartContextDocument={smartContextDocument}
        actors={actors}
        counters={counters}
        assets={assets}
        encounters={encounters}
        quests={quests}
        value={quest.content}
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
