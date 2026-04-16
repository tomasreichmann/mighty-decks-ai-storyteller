import { type KeyboardEvent, useId, useMemo, useState } from "react";
import { cn } from "../../utils/cn";
import { Button } from "./Button";
import { DepressedInput } from "./DepressedInput";
import { Dropdown } from "./Dropdown";
import { InputDescriptionHint } from "./InputDescriptionHint";
import { Label, type LabelVariant } from "./Label";
import { Tag, type TagTone } from "./Tag";
import { Text } from "./Text";

export interface TagOption {
  value: string;
  label?: string;
}

interface NormalizedTagOption {
  value: string;
  label: string;
  key: string;
}

export interface TagsProps {
  label: string;
  description?: string;
  value: string[];
  onChange: (nextTags: string[]) => void;
  onBlur?: () => void;
  options?: Array<string | TagOption>;
  disabled?: boolean;
  maxTags?: number;
  maxTagLength?: number;
  allowCustom?: boolean;
  placeholder?: string;
  addButtonLabel?: string;
  className?: string;
  labelColor?: LabelVariant;
  tagVariant?: TagTone;
  removeTone?: "blood" | "iron" | "cloth" | "gold" | "monster";
  chrome?: "default" | "borderless";
  showLabel?: boolean;
  showEmptyState?: boolean;
  showCounter?: boolean;
}

const normalizeTag = (value: string): string =>
  value.trim().replace(/\s+/g, " ");

type RemoveTone = NonNullable<TagsProps["removeTone"]>;

const removeToneClassMap: Record<RemoveTone, string> = {
  blood:
    "bg-gradient-to-b from-[#ff8d8d] via-kac-blood-light to-kac-blood-dark text-kac-curse-lightest",
  iron:
    "bg-gradient-to-b from-kac-steel-light via-kac-iron-light to-kac-iron-dark text-kac-steel-light",
  cloth:
    "bg-gradient-to-b from-kac-cloth-light via-kac-cloth to-kac-cloth-dark text-kac-steel-light",
  gold:
    "bg-gradient-to-b from-kac-gold-light via-kac-gold to-kac-gold-darker text-kac-iron-dark",
  monster:
    "bg-gradient-to-b from-kac-monster-light via-kac-monster to-kac-monster-dark text-kac-iron-dark",
};

const toNormalizedOptions = (
  options: Array<string | TagOption>,
): NormalizedTagOption[] => {
  const seen = new Set<string>();
  const normalized: NormalizedTagOption[] = [];

  for (const option of options) {
    const rawValue = typeof option === "string" ? option : option.value;
    const normalizedValue = normalizeTag(rawValue);
    if (!normalizedValue) {
      continue;
    }
    const key = normalizedValue.toLocaleLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);

    const rawLabel = typeof option === "string" ? option : option.label ?? option.value;
    const normalizedLabel = normalizeTag(rawLabel) || normalizedValue;
    normalized.push({
      value: normalizedValue,
      label: normalizedLabel,
      key,
    });
  }

  return normalized;
};

export const Tags = ({
  label,
  description,
  value,
  onChange,
  onBlur,
  options = [],
  disabled = false,
  maxTags = 12,
  maxTagLength = 160,
  allowCustom = true,
  placeholder = "Search tags...",
  addButtonLabel = "Add Tag",
  className = "",
  labelColor,
  tagVariant = "cloth",
  removeTone = "blood",
  chrome = "default",
  showLabel = true,
  showEmptyState = true,
  showCounter = true,
}: TagsProps): JSX.Element => {
  const searchInputId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const selectedKeySet = useMemo(
    () =>
      new Set(
        value
          .map((tag) => normalizeTag(tag).toLocaleLowerCase())
          .filter((tag) => tag.length > 0),
      ),
    [value],
  );

  const normalizedOptions = useMemo(() => toNormalizedOptions(options), [options]);

  const availableOptions = useMemo(
    () => normalizedOptions.filter((option) => !selectedKeySet.has(option.key)),
    [normalizedOptions, selectedKeySet],
  );

  const normalizedQuery = useMemo(() => normalizeTag(query), [query]);
  const normalizedQueryKey = normalizedQuery.toLocaleLowerCase();

  const filteredOptions = useMemo(() => {
    if (!normalizedQuery) {
      return availableOptions;
    }

    return availableOptions.filter((option) => {
      return (
        option.key.includes(normalizedQueryKey) ||
        option.label.toLocaleLowerCase().includes(normalizedQueryKey)
      );
    });
  }, [availableOptions, normalizedQuery, normalizedQueryKey]);

  const exactOptionMatch = useMemo(() => {
    if (!normalizedQuery) {
      return null;
    }

    return (
      availableOptions.find((option) => option.key === normalizedQueryKey) ?? null
    );
  }, [availableOptions, normalizedQuery, normalizedQueryKey]);

  const canAddMore = value.length < maxTags;
  const queryTooLong = normalizedQuery.length > maxTagLength;
  const bordered = chrome === "default";
  const canShowCustomAdd =
    allowCustom &&
    normalizedQuery.length > 0 &&
    !queryTooLong &&
    !selectedKeySet.has(normalizedQueryKey) &&
    exactOptionMatch === null &&
    canAddMore;

  const applyAddTag = (rawTag: string): void => {
    if (disabled) {
      return;
    }

    const nextTag = normalizeTag(rawTag);
    if (!nextTag) {
      setFeedback("Tag cannot be empty.");
      return;
    }
    if (nextTag.length > maxTagLength) {
      setFeedback(`Tags can be at most ${maxTagLength} characters.`);
      return;
    }
    if (!canAddMore) {
      setFeedback(`You can add at most ${maxTags} tags.`);
      return;
    }

    const nextKey = nextTag.toLocaleLowerCase();
    if (selectedKeySet.has(nextKey)) {
      setFeedback("Tag already added.");
      return;
    }

    onChange([...value, nextTag]);
    window.setTimeout(() => {
      onBlur?.();
    }, 0);
    setQuery("");
    setFeedback(null);
    setOpen(false);
  };

  const handleSearchSubmit = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key !== "Enter") {
      return;
    }
    event.preventDefault();

    if (exactOptionMatch) {
      applyAddTag(exactOptionMatch.value);
      return;
    }
    if (allowCustom && normalizedQuery) {
      applyAddTag(normalizedQuery);
      return;
    }
    if (!allowCustom && filteredOptions.length > 0) {
      applyAddTag(filteredOptions[0].value);
      return;
    }
    if (normalizedQuery) {
      setFeedback("No matching tag.");
    }
  };

  const handleRemoveTag = (targetTag: string): void => {
    if (disabled) {
      return;
    }

    const targetKey = normalizeTag(targetTag).toLocaleLowerCase();
    const nextTags = value.filter(
      (candidate) => normalizeTag(candidate).toLocaleLowerCase() !== targetKey,
    );
    if (nextTags.length === value.length) {
      return;
    }

    onChange(nextTags);
    window.setTimeout(() => {
      onBlur?.();
    }, 0);
    setFeedback(null);
  };

  return (
    <div className={cn("tags stack gap-1", className)}>
      {showLabel ? (
        <div className="-mb-2 -ml-1 relative self-start z-20 inline-flex items-center gap-2">
          <Label color={labelColor}>{label}</Label>
          {description ? (
            <InputDescriptionHint
              description={description}
              className="-translate-y-1"
            />
          ) : null}
        </div>
      ) : null}
      <div
        className={cn(
          bordered
            ? "relative w-full rounded-sm border-2 border-kac-iron bg-gradient-to-b from-[#f8efd8] to-[#e5d4b9] px-3 py-2 shadow-[inset_2px_2px_0_0_#9f8a6d,inset_-2px_-2px_0_0_#fff7e6]"
            : "relative w-full",
          disabled && "cursor-not-allowed opacity-60",
        )}
      >
        <div className="stack gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {value.map((tag, index) => (
              <Tag
                key={`${tag}-${index}`}
                tone={tagVariant}
                size="sm"
                className="tags__tag max-w-full"
                contentClassName="tags__tag-label max-w-[15rem] truncate"
                trailing={
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    disabled={disabled}
                    aria-label={`Remove ${tag}`}
                    className={cn(
                      "tags__tag-remove inline-flex h-full min-w-[1.9rem] items-center justify-center border-l border-kac-iron px-1.5",
                      "font-heading text-sm/none font-bold",
                      "shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]",
                      "[text-shadow:0_1px_0_rgba(0,0,0,0.35)] transition duration-100",
                      "hover:brightness-105",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kac-gold-dark/50",
                      removeToneClassMap[removeTone],
                      disabled &&
                        "cursor-not-allowed opacity-60 hover:brightness-100",
                    )}
                  >
                    x
                  </button>
                }
              >
                <span title={tag}>{tag}</span>
              </Tag>
            ))}

            <Dropdown
              open={open}
              onOpenChange={(nextOpen) => {
                setOpen(nextOpen);
                if (!nextOpen) {
                  setQuery("");
                  setFeedback(null);
                }
              }}
              menuClassName="z-50"
              renderTrigger={(triggerProps) => (
                <Button
                  variant="circle"
                  color="gold"
                  size="sm"
                  onClick={triggerProps.onClick}
                  aria-haspopup={triggerProps["aria-haspopup"]}
                  aria-expanded={triggerProps["aria-expanded"]}
                  aria-controls={triggerProps["aria-controls"]}
                  aria-label={addButtonLabel}
                  title={addButtonLabel}
                  disabled={disabled || !canAddMore}
                  className="h-8 w-8 p-0 text-base"
                >
                  +
                </Button>
              )}
            >
              {(ctx) => (
                <div
                  className={cn(
                    "w-[min(24rem,calc(100vw-3rem))] rounded-sm border-2 border-kac-iron-dark",
                    "bg-[linear-gradient(179deg,var(--tw-gradient-stops))] from-[#f8efd8] to-kac-bone-light",
                    "p-2 shadow-[2px_2px_0_0_#121b23]",
                  )}
                >
                  <div className="stack gap-2">
                    <DepressedInput
                      id={`${searchInputId}-search`}
                      label="Search tags"
                      value={query}
                      onChange={(event) => {
                        setQuery(event.target.value);
                        setFeedback(null);
                      }}
                      onKeyDown={handleSearchSubmit}
                      onBlur={onBlur}
                      placeholder={placeholder}
                      disabled={disabled}
                      autoFocus
                    />

                    <div className="stack max-h-56 gap-1 overflow-y-auto pr-0.5">
                      {queryTooLong ? (
                        <Text
                          variant="note"
                          color="blood"
                          className="px-1 text-sm normal-case tracking-normal !opacity-100"
                        >
                          Search exceeds {maxTagLength} characters.
                        </Text>
                      ) : null}

                      {canShowCustomAdd ? (
                        <Button
                          variant="ghost"
                          color="monster"
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => {
                            applyAddTag(normalizedQuery);
                            ctx.close();
                          }}
                        >
                          Add "{normalizedQuery}"
                        </Button>
                      ) : null}

                      {filteredOptions.map((option) => (
                        <Button
                          key={option.key}
                          variant="ghost"
                          color="cloth"
                          size="sm"
                          className="w-full justify-start normal-case tracking-normal"
                          onClick={() => {
                            applyAddTag(option.value);
                            ctx.close();
                          }}
                        >
                          {option.label}
                        </Button>
                      ))}

                      {!queryTooLong &&
                      filteredOptions.length === 0 &&
                      !canShowCustomAdd ? (
                        <Text
                          variant="note"
                          color="iron-light"
                          className="px-1 text-sm normal-case tracking-normal !opacity-100"
                        >
                          No matching tags.
                        </Text>
                      ) : null}
                    </div>
                  </div>
                </div>
              )}
            </Dropdown>
          </div>

          {showEmptyState && value.length === 0 ? (
            <Text variant="note" color="iron-light" className="text-sm !opacity-100">
              No tags added yet.
            </Text>
          ) : null}

          {showCounter ? (
            <Text variant="note" color="iron-light" className="text-sm !opacity-100">
              {value.length} / {maxTags} tags
            </Text>
          ) : null}
        </div>
      </div>

      {feedback ? (
        <Text variant="note" color="blood" className="text-sm !opacity-100">
          {feedback}
        </Text>
      ) : null}
    </div>
  );
};
