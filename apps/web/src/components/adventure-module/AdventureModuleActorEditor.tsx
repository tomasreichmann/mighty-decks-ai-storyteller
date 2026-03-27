import type {
  AdventureModuleResolvedActor,
  AdventureModuleResolvedAsset,
  AdventureModuleResolvedCounter,
  AdventureModuleResolvedEncounter,
} from "@mighty-decks/spec/adventureModuleAuthoring";
import type { SmartInputDocumentContext } from "../../lib/smartInputContext";
import type { CounterAdjustTarget } from "../../lib/gameCardCatalogContext";
import {
  actorBaseLayers,
  actorTacticalRoles,
  actorTacticalSpecials,
} from "../../data/actorCards";
import { ActorCard } from "../cards/ActorCard";
import { Panel } from "../common/Panel";
import { Text } from "../common/Text";
import { TextArea } from "../common/TextArea";
import { TextField } from "../common/TextField";
import { AdventureModuleMarkdownField } from "./AdventureModuleMarkdownField";

interface AdventureModuleActorEditorProps {
  actor: AdventureModuleResolvedActor;
  actors: AdventureModuleResolvedActor[];
  counters?: AdventureModuleResolvedCounter[];
  assets?: AdventureModuleResolvedAsset[];
  encounters?: AdventureModuleResolvedEncounter[];
  smartContextDocument: SmartInputDocumentContext;
  editable: boolean;
  validationMessage?: string | null;
  onTitleChange: (nextValue: string) => void;
  onSummaryChange: (nextValue: string) => void;
  onBaseLayerChange: (nextValue: AdventureModuleResolvedActor["baseLayerSlug"]) => void;
  onTacticalRoleChange: (
    nextValue: AdventureModuleResolvedActor["tacticalRoleSlug"],
  ) => void;
  onTacticalSpecialChange: (
    nextValue: AdventureModuleResolvedActor["tacticalSpecialSlug"],
  ) => void;
  onContentChange: (nextValue: string) => void;
  onFieldBlur: () => void;
  onAdjustCounterValue?: (
    counterSlug: string,
    delta: number,
    target?: CounterAdjustTarget,
  ) => void;
  onDelete?: () => void;
}

const MAX_MARKDOWN_LENGTH = 200_000;
const controlClassName =
  "border-[3px] border-b-[6px] border-kac-iron bg-gradient-to-b from-[#fffdf5] to-kac-bone-light px-3 py-2 text-kac-iron shadow-[2px_2px_0_0_#121b23] outline-none transition duration-100 focus-visible:border-kac-gold-darker focus-visible:ring-2 focus-visible:ring-kac-gold-dark/40 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-[1px_1px_0_0_#121b23] font-ui";

export const AdventureModuleActorEditor = ({
  actor,
  actors,
  counters = [],
  assets = [],
  encounters = [],
  smartContextDocument,
  editable,
  validationMessage,
  onTitleChange,
  onSummaryChange,
  onBaseLayerChange,
  onTacticalRoleChange,
  onTacticalSpecialChange,
  onContentChange,
  onFieldBlur,
  onAdjustCounterValue,
  onDelete,
}: AdventureModuleActorEditorProps): JSX.Element => {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      <Panel contentClassName="stack gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="stack gap-1">
            <Text variant="h3" color="iron">
              Actor Card
            </Text>
            <Text variant="body" color="iron-light" className="text-sm">
              Layer the symbolic base, tactical role, and optional tactical special.
            </Text>
          </div>
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

        <ActorCard
          className="mx-auto w-full max-w-[16rem]"
          baseLayerSlug={actor.baseLayerSlug}
          tacticalRoleSlug={actor.tacticalRoleSlug}
          tacticalSpecialSlug={actor.tacticalSpecialSlug}
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
