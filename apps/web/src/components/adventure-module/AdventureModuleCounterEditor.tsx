import type { AdventureModuleResolvedCounter } from "@mighty-decks/spec/adventureModuleAuthoring";
import type { CounterIconSlug } from "@mighty-decks/spec/counterCards";
import type { CounterAdjustTarget } from "../../lib/gameCardCatalogContext";
import { counterIcons } from "../../data/counterCards";
import { CounterCard } from "../cards/CounterCard";
import { Panel } from "../common/Panel";
import { Text } from "../common/Text";
import { TextArea } from "../common/TextArea";
import { TextField } from "../common/TextField";
import { ShortcodeField } from "./ShortcodeField";

interface AdventureModuleCounterEditorProps {
  counter: AdventureModuleResolvedCounter;
  editable: boolean;
  validationMessage?: string | null;
  onTitleChange: (nextValue: string) => void;
  onIconSlugChange: (nextValue: CounterIconSlug) => void;
  onCurrentValueChange: (nextValue: string) => void;
  onMaxValueChange: (nextValue: string) => void;
  onDescriptionChange: (nextValue: string) => void;
  onFieldBlur: () => void;
  onAdjustCounterValue?: (
    counterSlug: string,
    delta: number,
    target?: CounterAdjustTarget,
  ) => void;
  onDelete?: () => void;
  onAddCounterCardToSelection?: () => void;
}

const controlClassName =
  "border-[3px] border-b-[6px] border-kac-iron bg-gradient-to-b from-[#fffdf5] to-kac-bone-light px-3 py-2 text-kac-iron shadow-[2px_2px_0_0_#121b23] outline-none transition duration-100 focus-visible:border-kac-gold-darker focus-visible:ring-2 focus-visible:ring-kac-gold-dark/40 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-[1px_1px_0_0_#121b23] font-ui";

export const AdventureModuleCounterEditor = ({
  counter,
  editable,
  validationMessage,
  onTitleChange,
  onIconSlugChange,
  onCurrentValueChange,
  onMaxValueChange,
  onDescriptionChange,
  onFieldBlur,
  onAdjustCounterValue,
  onDelete,
  onAddCounterCardToSelection,
}: AdventureModuleCounterEditorProps): JSX.Element => {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      <Panel contentClassName="stack gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="stack gap-1">
            <Text variant="h3" color="iron">
              Counter Card
            </Text>
            <Text variant="body" color="iron-light" className="text-sm">
              Choose a symbolic icon, set the shared value, and describe what this counter tracks.
            </Text>
          </div>
          {onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              disabled={!editable}
              className="inline-flex items-center rounded-full border-2 border-kac-blood-dark bg-kac-bone-light px-3 py-1 font-ui text-xs font-bold uppercase tracking-[0.08em] text-kac-blood-dark shadow-[1px_1px_0_0_#121b23] transition duration-100 hover:brightness-[1.03] active:translate-y-[1px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-55 disabled:shadow-none"
            >
              Delete Counter
            </button>
          ) : null}
        </div>

        <CounterCard
          className="mx-auto w-full max-w-[16rem]"
          iconSlug={counter.iconSlug}
          title={counter.title}
          currentValue={counter.currentValue}
          maxValue={counter.maxValue}
          description={counter.description}
          onDecrement={
            onAdjustCounterValue
              ? () => onAdjustCounterValue(counter.slug, -1)
              : undefined
          }
          onIncrement={
            onAdjustCounterValue
              ? () => onAdjustCounterValue(counter.slug, 1)
              : undefined
          }
          onDecrementMaxValue={
            onAdjustCounterValue && typeof counter.maxValue === "number"
              ? () => onAdjustCounterValue(counter.slug, -1, "max")
              : undefined
          }
          onIncrementMaxValue={
            onAdjustCounterValue && typeof counter.maxValue === "number"
              ? () => onAdjustCounterValue(counter.slug, 1, "max")
              : undefined
          }
        />

        <ShortcodeField
          shortcode={`@counter/${counter.slug}`}
          onAddToSelection={onAddCounterCardToSelection}
        />

        <TextField
          label="Counter Name"
          maxLength={120}
          value={counter.title}
          onChange={(event) => onTitleChange(event.target.value)}
          onBlur={onFieldBlur}
          disabled={!editable}
        />

        <label className="grid gap-1">
          <Text as="span" variant="note" color="iron" className="text-base tracking-[0.04em]">
            Icon
          </Text>
          <select
            className={controlClassName}
            value={counter.iconSlug}
            onChange={(event) =>
              onIconSlugChange(event.target.value as CounterIconSlug)
            }
            onBlur={onFieldBlur}
            disabled={!editable}
          >
            {counterIcons.map((icon) => (
              <option key={icon.slug} value={icon.slug}>
                {icon.label}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid min-w-0 gap-1">
            <Text as="span" variant="note" color="iron" className="text-base tracking-[0.04em]">
              Current Value
            </Text>
            <input
              type="number"
              min={0}
              step={1}
              className={`${controlClassName} min-w-0 w-full`}
              value={counter.currentValue}
              onChange={(event) => onCurrentValueChange(event.target.value)}
              onBlur={onFieldBlur}
              disabled={!editable}
            />
          </label>

          <label className="grid min-w-0 gap-1">
            <Text as="span" variant="note" color="iron" className="text-base tracking-[0.04em]">
              Max Value
            </Text>
            <input
              type="number"
              min={0}
              step={1}
              className={`${controlClassName} min-w-0 w-full`}
              value={typeof counter.maxValue === "number" ? counter.maxValue : ""}
              onChange={(event) => onMaxValueChange(event.target.value)}
              onBlur={onFieldBlur}
              disabled={!editable}
              placeholder="No max"
            />
          </label>
        </div>

        <TextArea
          label="Description"
          maxLength={500}
          rows={5}
          value={counter.description}
          onChange={(event) => onDescriptionChange(event.target.value)}
          onBlur={onFieldBlur}
          disabled={!editable}
          description="Shown in the Counters tab list, inline card body, and quick references."
        />
      </Panel>

      <div className="stack gap-4">
        <Text variant="note" color="iron-light" className="text-sm !opacity-100">
          Counter slug: <code>{counter.slug}</code>. It is regenerated from the
          counter name when you save.
        </Text>

        <Text variant="note" color="iron-light" className="text-sm !opacity-100">
          Plus and minus on any rendered CounterCard update the same stored current
          and max values across Adventure Module authoring.
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
