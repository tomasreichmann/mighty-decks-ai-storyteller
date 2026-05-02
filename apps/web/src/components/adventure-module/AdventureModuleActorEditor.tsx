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
import type { CounterAdjustTarget } from "../../lib/gameCardCatalogContext";
import {
  actorBaseLayers,
  actorTacticalRoles,
  actorTacticalSpecials,
} from "../../data/actorCards";
import {
  buildCustomActorCardDraft,
  isEmptyCustomActorCardDraft,
} from "../../lib/actorCardCustomization";
import { toMarkdownPlainTextSnippet } from "../../lib/markdownSnippet";
import { ActorCard } from "../cards/ActorCard";
import { Panel } from "../common/Panel";
import { Text } from "../common/Text";
import { TextArea } from "../common/TextArea";
import { TextField } from "../common/TextField";
import { RockerSwitch } from "../common/RockerSwitch";
import { Toggle } from "../common/Toggle";
import { ActorIconTokenTextEditor } from "./ActorIconTokenTextEditor";
import { AdventureModuleGeneratedImagePicker } from "./AdventureModuleGeneratedImagePicker";
import { AdventureModuleMarkdownField } from "./AdventureModuleMarkdownField";
import { ShortcodeField } from "./ShortcodeField";
import { SceneCardDetailLink } from "./SceneCardDetailLink";

interface AdventureModuleActorEditorProps {
  actor: AdventureModuleResolvedActor;
  actors: AdventureModuleResolvedActor[];
  counters?: AdventureModuleResolvedCounter[];
  assets?: AdventureModuleResolvedAsset[];
  encounters?: AdventureModuleResolvedEncounter[];
  locations?: AdventureModuleResolvedLocation[];
  quests?: AdventureModuleResolvedQuest[];
  smartContextDocument: SmartInputDocumentContext;
  editable: boolean;
  validationMessage?: string | null;
  onTitleChange: (nextValue: string) => void;
  onSummaryChange: (nextValue: string) => void;
  onModeChange: (nextValue: AdventureModuleResolvedActor["mode"]) => void;
  onBaseLayerChange: (nextValue: AdventureModuleResolvedActor["baseLayerSlug"]) => void;
  onTacticalRoleChange: (
    nextValue: AdventureModuleResolvedActor["tacticalRoleSlug"],
  ) => void;
  onTacticalSpecialChange: (
    nextValue: AdventureModuleResolvedActor["tacticalSpecialSlug"],
  ) => void;
  onCustomChange: (nextValue: AdventureModuleResolvedActor["custom"]) => void;
  onIsPlayerCharacterChange: (nextValue: boolean) => void;
  onContentChange: (nextValue: string) => void;
  onFieldBlur: () => void;
  onAdjustCounterValue?: (
    counterSlug: string,
    delta: number,
    target?: CounterAdjustTarget,
  ) => void;
  onDelete?: () => void;
  onAddActorCardToSelection?: () => void;
}

const MAX_MARKDOWN_LENGTH = 200_000;
const ACTOR_IMAGE_CONTEXT_TAG_OPTIONS = [
  "Actor Name",
  "Actor Summary",
  "Adjective",
  "Noun",
  "Noun Description",
  "Adjective Description",
  "Actor Markdown",
  "Module Title",
  "Module Summary",
  "Module Intent",
  "Premise",
  "Player Summary",
  "Storyteller Summary",
] as const;
const DEFAULT_ACTOR_IMAGE_CONTEXT_TAGS = [
  "Actor Name",
  "Actor Summary",
  "Adjective",
  "Noun",
  "Actor Markdown",
] as const;
const controlClassName =
  "border-[3px] border-b-[6px] border-kac-iron bg-gradient-to-b from-[#fffdf5] to-kac-bone-light px-3 py-2 text-kac-iron shadow-[2px_2px_0_0_#121b23] outline-none transition duration-100 focus-visible:border-kac-gold-darker focus-visible:ring-2 focus-visible:ring-kac-gold-dark/40 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-[1px_1px_0_0_#121b23] font-ui";

const toSnippet = (value: string, maxLength: number): string =>
  toMarkdownPlainTextSnippet(value, maxLength).trim();

const buildActorImageContextLines = (
  selectedContextTags: string[],
  actor: AdventureModuleResolvedActor,
  smartContextDocument: SmartInputDocumentContext,
): string[] => {
  const lines: string[] = [];

  for (const selectedTag of selectedContextTags) {
    switch (selectedTag) {
      case "Actor Name": {
        const snippet = toSnippet(actor.title, 120);
        if (snippet.length > 0) {
          lines.push(`Actor name: ${snippet}`);
        }
        break;
      }
      case "Actor Summary": {
        const snippet = toSnippet(actor.summary ?? "", 320);
        if (snippet.length > 0) {
          lines.push(`Actor summary: ${snippet}`);
        }
        break;
      }
      case "Adjective": {
        const snippet = toSnippet(actor.custom.adjective, 120);
        if (snippet.length > 0) {
          lines.push(`Adjective: ${snippet}`);
        }
        break;
      }
      case "Noun": {
        const snippet = toSnippet(actor.custom.noun, 120);
        if (snippet.length > 0) {
          lines.push(`Noun: ${snippet}`);
        }
        break;
      }
      case "Noun Description": {
        const snippet = toSnippet(actor.custom.nounDescription, 500);
        if (snippet.length > 0) {
          lines.push(`Noun description: ${snippet}`);
        }
        break;
      }
      case "Adjective Description": {
        const snippet = toSnippet(actor.custom.adjectiveDescription, 500);
        if (snippet.length > 0) {
          lines.push(`Adjective description: ${snippet}`);
        }
        break;
      }
      case "Actor Markdown": {
        const snippet = toSnippet(actor.content, 650);
        if (snippet.length > 0) {
          lines.push(`Actor brief: ${snippet}`);
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

export const AdventureModuleActorEditor = ({
  actor,
  actors,
  counters = [],
  assets = [],
  encounters = [],
  locations = [],
  quests = [],
  smartContextDocument,
  editable,
  validationMessage,
  onTitleChange,
  onSummaryChange,
  onModeChange,
  onBaseLayerChange,
  onTacticalRoleChange,
  onTacticalSpecialChange,
  onCustomChange,
  onIsPlayerCharacterChange,
  onContentChange,
  onFieldBlur,
  onAdjustCounterValue,
  onDelete,
  onAddActorCardToSelection,
}: AdventureModuleActorEditorProps): JSX.Element => {
  const { buildRoute, state } = useAuthoringContext();

  const detailLink = useMemo(() => {
    const moduleSlug = state.detail?.index.slug;
    if (!moduleSlug) {
      return null;
    }

    return {
      href: buildRoute(moduleSlug, "actors", actor.actorSlug),
      label: `Open ${actor.title} detail in a new tab`,
    };
  }, [actor.actorSlug, actor.title, buildRoute, state.detail?.index.slug]);

  const actorCardProps = actor.mode === "custom"
    ? {
        kind: "custom" as const,
        custom: actor.custom,
      }
    : {
        baseLayerSlug: actor.baseLayerSlug,
        tacticalRoleSlug: actor.tacticalRoleSlug,
        tacticalSpecialSlug: actor.tacticalSpecialSlug,
      };

  const resolveImageContextLines = useCallback(
    (selectedContextTags: string[]) =>
      buildActorImageContextLines(
        selectedContextTags,
        actor,
        smartContextDocument,
      ),
    [actor, smartContextDocument],
  );

  const updateCustomField = useCallback(
    <TField extends keyof AdventureModuleResolvedActor["custom"]>(
      field: TField,
      nextValue: AdventureModuleResolvedActor["custom"][TField],
    ): void => {
      onCustomChange({
        ...actor.custom,
        [field]: nextValue,
      });
    },
    [actor.custom, onCustomChange],
  );

  const handleMakeCustom = useCallback((): void => {
    const nextCustom = isEmptyCustomActorCardDraft(actor.custom)
      ? buildCustomActorCardDraft({
          baseLayerSlug: actor.baseLayerSlug,
          tacticalRoleSlug: actor.tacticalRoleSlug,
          tacticalSpecialSlug: actor.tacticalSpecialSlug,
        })
      : actor.custom;
    onCustomChange(nextCustom);
    onModeChange("custom");
  }, [
    actor.baseLayerSlug,
    actor.custom,
    actor.tacticalRoleSlug,
    actor.tacticalSpecialSlug,
    onCustomChange,
    onModeChange,
  ]);

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      <Panel contentClassName="stack gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="stack gap-1">
            <Text variant="h3" color="iron">
              Actor Card
            </Text>
            <Text variant="body" color="iron-light" className="text-sm">
              {actor.mode === "custom"
                ? "Author a custom actor card while preserving its generic setup."
                : "Layer the symbolic base, tactical role, and optional tactical special."}
            </Text>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            {onDelete ? (
              <button
                type="button"
                onClick={onDelete}
                disabled={!editable}
                className="inline-flex items-center rounded-full border-2 border-kac-blood-dark bg-kac-bone-light px-3 py-1 font-ui text-xs font-bold uppercase tracking-[0.08em] text-kac-blood-dark shadow-[1px_1px_0_0_#121b23] transition duration-100 hover:brightness-[1.03] active:translate-y-[1px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-55 disabled:shadow-none"
              >
                Delete Actor
              </button>
            ) : null}
          </div>
        </div>

        <div className="relative z-0 mx-auto w-full max-w-[16rem] pb-4">
          <ActorCard
            className="w-full"
            {...actorCardProps}
          />
          {detailLink ? (
            <SceneCardDetailLink
              href={detailLink.href}
              label={detailLink.label}
            />
          ) : null}
        </div>

        <ShortcodeField
          shortcode={`@actor/${actor.actorSlug}`}
          onAddToSelection={onAddActorCardToSelection}
        />

        <TextField
          label="Actor Name"
          maxLength={120}
          value={actor.title}
          onChange={(event) => onTitleChange(event.target.value)}
          onBlur={onFieldBlur}
          disabled={!editable}
        />

        <TextArea
          label="Summary"
          maxLength={500}
          rows={4}
          value={actor.summary ?? ""}
          onChange={(event) => onSummaryChange(event.target.value)}
          onBlur={onFieldBlur}
          disabled={!editable}
          description="Used in the Actors tab list and quick references."
        />

        <Toggle
          checked={actor.isPlayerCharacter}
          onCheckedChange={onIsPlayerCharacterChange}
          label="Player Character"
          description="Player characters can be claimed or created during campaign sessions."
          disabled={!editable}
        />

        <div className="flex justify-start">
          <RockerSwitch
            active={actor.mode === "custom"}
            color="cloth"
            size="sm"
            label="Card Mode"
            inactiveText="Make Custom"
            activeText="Make Generic"
            disabled={!editable}
            onClick={
              actor.mode === "custom"
                ? () => onModeChange("generic")
                : handleMakeCustom
            }
          />
        </div>

        {actor.mode === "generic" ? (
          <>
            <label className="grid gap-1">
              <Text as="span" variant="note" color="iron" className="text-base tracking-[0.04em]">
                Base Layer
              </Text>
              <select
                className={controlClassName}
                value={actor.baseLayerSlug}
                onChange={(event) =>
                  onBaseLayerChange(
                    event.target.value as AdventureModuleResolvedActor["baseLayerSlug"],
                  )
                }
                onBlur={onFieldBlur}
                disabled={!editable}
              >
                {actorBaseLayers.map((baseLayer) => (
                  <option key={baseLayer.slug} value={baseLayer.slug}>
                    {baseLayer.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1">
              <Text as="span" variant="note" color="iron" className="text-base tracking-[0.04em]">
                Tactical Role
              </Text>
              <select
                className={controlClassName}
                value={actor.tacticalRoleSlug}
                onChange={(event) =>
                  onTacticalRoleChange(
                    event.target.value as AdventureModuleResolvedActor["tacticalRoleSlug"],
                  )
                }
                onBlur={onFieldBlur}
                disabled={!editable}
              >
                {actorTacticalRoles.map((role) => (
                  <option key={role.slug} value={role.slug}>
                    {role.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1">
              <Text as="span" variant="note" color="iron" className="text-base tracking-[0.04em]">
                Tactical Special
              </Text>
              <select
                className={controlClassName}
                value={actor.tacticalSpecialSlug ?? ""}
                onChange={(event) =>
                  onTacticalSpecialChange(
                    event.target.value.trim().length > 0
                      ? (event.target.value as AdventureModuleResolvedActor["tacticalSpecialSlug"])
                      : undefined,
                  )
                }
                onBlur={onFieldBlur}
                disabled={!editable}
              >
                <option value="">None</option>
                {actorTacticalSpecials.map((special) => (
                  <option key={special.slug} value={special.slug}>
                    {special.name}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : (
          <>
            <AdventureModuleGeneratedImagePicker
              label="Custom Actor Image"
              promptLabel="Actor Image Prompt"
              promptDescription="Generate the main image for this custom actor card."
              contextLabel="Actor Image Context"
              contextDescription="Edit the base prompt text. Selected context tags are appended for generation and lookup, but are not shown in the prompt field."
              workflowContextIntro="Actor image prompt for a Mighty Decks card. Preserve a readable silhouette, expressive character identity, and a compact card-friendly composition."
              contextTagOptions={ACTOR_IMAGE_CONTEXT_TAG_OPTIONS}
              defaultContextTags={DEFAULT_ACTOR_IMAGE_CONTEXT_TAGS}
              resolveContextLines={resolveImageContextLines}
              emptyLabel="No custom actor image selected yet."
              emptyFrameClassName="aspect-[4/3] min-h-48"
              disabled={!editable}
              identityKey={`${actor.fragmentId}-custom-actor-image`}
              value={actor.custom.imageUrl}
              onChange={(nextValue) => updateCustomField("imageUrl", nextValue)}
              onBlur={onFieldBlur}
            />

            <TextField
              label="Adjective"
              maxLength={120}
              value={actor.custom.adjective}
              onChange={(event) =>
                updateCustomField("adjective", event.target.value)
              }
              onBlur={onFieldBlur}
              disabled={!editable}
              placeholder="Optional modifier, e.g. Grabbing"
            />

            <TextField
              label="Noun"
              maxLength={120}
              value={actor.custom.noun}
              onChange={(event) => updateCustomField("noun", event.target.value)}
              onBlur={onFieldBlur}
              disabled={!editable}
            />

            <ActorIconTokenTextEditor
              label="Noun Description"
              value={actor.custom.nounDescription}
              maxLength={500}
              rows={4}
              onChange={(nextValue) =>
                updateCustomField("nounDescription", nextValue)
              }
              onBlur={onFieldBlur}
              disabled={!editable}
              description="Body text with icon tokens such as [ranged], [injury3], and [stuck]."
            />

            <ActorIconTokenTextEditor
              label="Adjective Description"
              value={actor.custom.adjectiveDescription}
              maxLength={500}
              rows={3}
              onChange={(nextValue) =>
                updateCustomField("adjectiveDescription", nextValue)
              }
              onBlur={onFieldBlur}
              disabled={!editable}
              description="Optional special text for the adjective block."
            />
          </>
        )}
      </Panel>

      <div className="stack gap-4">
        <AdventureModuleMarkdownField
          label="Actor Markdown"
          description="Author the actor's public face, agenda, pressure moves, and other reusable guidance. Actor GameCards render inline in Rich Text."
          selfContextTag="Storyteller Info"
          smartContextDocument={smartContextDocument}
        actors={actors}
        counters={counters}
        assets={assets}
        encounters={encounters}
        locations={locations}
        quests={quests}
        value={actor.content}
          editable={editable}
          maxLength={MAX_MARKDOWN_LENGTH}
          onChange={onContentChange}
          onFieldBlur={onFieldBlur}
          onAdjustCounterValue={onAdjustCounterValue}
          contentEditableClassName="min-h-[18rem]"
        />

        <Text variant="note" color="iron-light" className="text-sm !opacity-100">
          Actor slug: <code>{actor.actorSlug}</code>. It is regenerated from the
          actor name when you save.
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
