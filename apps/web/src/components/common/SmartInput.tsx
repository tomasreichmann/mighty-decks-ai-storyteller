import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "./Button";
import { ContextMenu, type ContextMenuRow } from "./ContextMenu";
import { Message } from "./Message";
import { Text } from "./Text";
import { TextArea } from "./TextArea";
import {
  getWorkflowLabRun,
  startWorkflowLabRun,
  stopWorkflowLabRun,
} from "../../lib/workflowLabApi";

type SmartInputAction =
  | "make_changes"
  | "to_prose"
  | "to_bullets"
  | "expand"
  | "compact";

interface SmartInputProps {
  label: string;
  description?: string;
  workflowContextDescription?: string;
  value: string;
  disabled?: boolean;
  maxLength?: number;
  placeholder?: string;
  className?: string;
  showLabel?: boolean;
  onChange: (nextValue: string) => void;
  onBlur?: () => void;
}

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const parseTransformedText = (outputs: Record<string, unknown>): string => {
  const transformed = asRecord(outputs.transformed);
  const text = transformed.text;
  if (typeof text !== "string") {
    throw new Error("Workflow did not return transformed text.");
  }
  const trimmed = text.trim();
  if (trimmed.length === 0 || trimmed.length > 500) {
    throw new Error("Workflow returned invalid text length.");
  }
  return trimmed;
};

const toPercentValue = (value: string, label: string): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${label} percent must be a number.`);
  }
  if (parsed < 1 || parsed > 200) {
    throw new Error(`${label} percent must be between 1 and 200.`);
  }
  return Math.round(parsed);
};

const menuRowBaseClassName = "grid items-center gap-1.5";
const menuLabelClassName =
  "text-xs font-ui font-bold uppercase tracking-[0.08em] text-kac-iron-light text-right pr-1";
const menuInputClassName =
  "w-full min-w-0 border-2 border-kac-iron rounded-sm bg-gradient-to-b from-[#f8efd8] to-[#e5d4b9] px-2 py-1.5 text-sm text-kac-iron outline-none transition duration-100 font-ui shadow-[inset_2px_2px_0_0_#9f8a6d,inset_-2px_-2px_0_0_#fff7e6] placeholder:text-kac-steel-dark/70 disabled:cursor-not-allowed disabled:opacity-60";

const SMART_INPUT_PRESET_STORAGE_PREFIX =
  "mighty_decks_smart_input_instruction_presets_v1";
const MAX_INSTRUCTION_PRESETS = 20;
const MAX_INSTRUCTION_PRESET_LENGTH = 4000;
const MAX_INSTRUCTION_PRESET_NAME_LENGTH = 60;

interface SmartInstructionPreset {
  id: string;
  name: string;
  instruction: string;
}

const normalizeInstructionText = (value: string): string =>
  value.trim().replace(/\s+/g, " ");

const normalizePresetValue = (value: string): string =>
  value.replace(/\r\n/g, "\n").trim();

const normalizePresetName = (value: string): string =>
  value.trim().replace(/\s+/g, " ");

const createPresetId = (): string => {
  if (
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return `sip-${globalThis.crypto.randomUUID()}`;
  }
  return `sip-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
};

const fallbackPresetName = (instruction: string): string => {
  const base = instruction.slice(0, MAX_INSTRUCTION_PRESET_NAME_LENGTH).trim();
  return base.length > 0 ? base : "Preset";
};

const toPresetScope = (inputName: string): string => {
  const normalized = inputName
    .trim()
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized.length > 0 ? normalized : "default";
};

const buildPresetStorageKey = (scope: string): string =>
  `${SMART_INPUT_PRESET_STORAGE_PREFIX}:${scope}`;

const coercePreset = (
  value: unknown,
  index: number,
): SmartInstructionPreset | null => {
  if (typeof value === "string") {
    const instruction = normalizePresetValue(value);
    if (
      instruction.length === 0 ||
      instruction.length > MAX_INSTRUCTION_PRESET_LENGTH
    ) {
      return null;
    }
    return {
      id: `legacy-${index}`,
      name: fallbackPresetName(instruction),
      instruction,
    };
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const record = value as Partial<SmartInstructionPreset> & {
    value?: string;
  };
  const instruction = normalizePresetValue(
    typeof record.instruction === "string"
      ? record.instruction
      : typeof record.value === "string"
        ? record.value
        : "",
  );
  if (
    instruction.length === 0 ||
    instruction.length > MAX_INSTRUCTION_PRESET_LENGTH
  ) {
    return null;
  }

  const name = normalizePresetName(
    typeof record.name === "string" ? record.name : "",
  );
  const resolvedName = (
    name.length > 0 ? name : fallbackPresetName(instruction)
  ).slice(0, MAX_INSTRUCTION_PRESET_NAME_LENGTH);
  if (resolvedName.length === 0) {
    return null;
  }

  return {
    id:
      typeof record.id === "string" && record.id.trim().length > 0
        ? record.id
        : `legacy-${index}-${resolvedName.toLocaleLowerCase()}`,
    name: resolvedName,
    instruction,
  };
};

const dedupePresets = (
  entries: SmartInstructionPreset[],
): SmartInstructionPreset[] => {
  const seen = new Set<string>();
  const deduped: SmartInstructionPreset[] = [];

  for (const entry of entries) {
    const name = normalizePresetName(entry.name).slice(
      0,
      MAX_INSTRUCTION_PRESET_NAME_LENGTH,
    );
    const instruction = normalizePresetValue(entry.instruction);
    if (
      name.length === 0 ||
      instruction.length === 0 ||
      instruction.length > MAX_INSTRUCTION_PRESET_LENGTH
    ) {
      continue;
    }
    const key = name.toLocaleLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    deduped.push({
      id: entry.id || createPresetId(),
      name,
      instruction,
    });
  }

  return deduped.slice(0, MAX_INSTRUCTION_PRESETS);
};

const loadInstructionPresets = (storageKey: string): SmartInstructionPreset[] => {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(storageKey);
    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue) as unknown;
    if (!Array.isArray(parsedValue)) {
      return [];
    }

    const coerced = parsedValue
      .map((entry, index) => coercePreset(entry, index))
      .filter((entry): entry is SmartInstructionPreset => entry !== null);
    return dedupePresets(coerced);
  } catch {
    return [];
  }
};

const persistInstructionPresets = (
  storageKey: string,
  presets: SmartInstructionPreset[],
): void => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(storageKey, JSON.stringify(presets));
};

export const SmartInput = ({
  label,
  description,
  workflowContextDescription,
  value,
  disabled = false,
  maxLength = 500,
  placeholder,
  className,
  showLabel = true,
  onChange,
  onBlur,
}: SmartInputProps): JSX.Element => {
  const presetScope = useMemo(() => toPresetScope(label), [label]);
  const presetStorageKey = useMemo(
    () => buildPresetStorageKey(presetScope),
    [presetScope],
  );
  const [instruction, setInstruction] = useState("");
  const [savedInstructionPresets, setSavedInstructionPresets] = useState<
    SmartInstructionPreset[]
  >(() => loadInstructionPresets(buildPresetStorageKey(toPresetScope(label))));
  const [presetName, setPresetName] = useState("");
  const [presetMessage, setPresetMessage] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [expandPercent, setExpandPercent] = useState("20");
  const [compactPercent, setCompactPercent] = useState("20");
  const [running, setRunning] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastAppliedPreviousValue, setLastAppliedPreviousValue] = useState<
    string | null
  >(null);

  const activeRunIdRef = useRef<string | null>(null);
  const activeTokenRef = useRef<number | null>(null);
  const discardedTokensRef = useRef(new Set<number>());
  const nextTokenRef = useRef(0);

  useEffect(() => {
    setSavedInstructionPresets(loadInstructionPresets(presetStorageKey));
    setPresetName("");
    setPresetMessage(null);
  }, [presetStorageKey]);

  useEffect(() => {
    return () => {
      const runId = activeRunIdRef.current;
      const token = activeTokenRef.current;
      if (token !== null) {
        discardedTokensRef.current.add(token);
      }
      activeTokenRef.current = null;
      activeRunIdRef.current = null;
      if (runId) {
        void stopWorkflowLabRun(runId, { reason: "component unmounted" }).catch(
          () => undefined,
        );
      }
    };
  }, []);

  const runTransform = async (action: SmartInputAction): Promise<void> => {
    if (disabled || running) {
      return;
    }

    const premiseText = value.trim();
    if (premiseText.length === 0) {
      setError("Text is required before running smart actions.");
      return;
    }

    const contextDescription =
      workflowContextDescription?.trim() || description?.trim();
    const contextInput =
      contextDescription && contextDescription.length > 0
        ? { contextDescription }
        : {};

    let workflowId = "";
    let input: Record<string, unknown> = { text: premiseText, ...contextInput };
    let actionLabel = "";

    try {
      switch (action) {
        case "make_changes": {
          const nextInstruction = normalizeInstructionText(instruction);
          if (!nextInstruction) {
            throw new Error("Provide a change request before running Make Changes.");
          }
          workflowId = "adventure_module_premise_make_changes";
          input = {
            text: premiseText,
            instruction: nextInstruction,
            ...contextInput,
          };
          actionLabel = "Applying changes";
          break;
        }
        case "to_prose":
          workflowId = "adventure_module_premise_to_prose";
          actionLabel = "Converting to prose";
          break;
        case "to_bullets":
          workflowId = "adventure_module_premise_to_bullets";
          actionLabel = "Converting to bullets";
          break;
        case "expand":
          workflowId = "adventure_module_premise_expand";
          input = {
            text: premiseText,
            percent: toPercentValue(expandPercent, "Expand"),
            ...contextInput,
          };
          actionLabel = "Expanding premise";
          break;
        case "compact":
          workflowId = "adventure_module_premise_compact";
          input = {
            text: premiseText,
            percent: toPercentValue(compactPercent, "Compact"),
            ...contextInput,
          };
          actionLabel = "Compacting premise";
          break;
      }
    } catch (validationError) {
      setError(
        validationError instanceof Error
          ? validationError.message
          : "Could not start smart action.",
      );
      return;
    }

    setError(null);
    setStatusMessage(`${actionLabel}...`);
    setRunning(true);

    const token = nextTokenRef.current + 1;
    nextTokenRef.current = token;
    activeTokenRef.current = token;
    const previousValue = value;

    try {
      const started = await startWorkflowLabRun({
        workflowId,
        input: input as never,
      });
      activeRunIdRef.current = started.runId;

      for (let attempt = 0; attempt < 600; attempt += 1) {
        if (activeTokenRef.current !== token) {
          return;
        }
        const snapshot = await getWorkflowLabRun(started.runId);
        if (activeTokenRef.current !== token) {
          return;
        }

        if (snapshot.status === "completed") {
          if (discardedTokensRef.current.has(token)) {
            return;
          }
          const transformedText = parseTransformedText(
            snapshot.outputs as Record<string, unknown>,
          );
          onChange(transformedText);
          setLastAppliedPreviousValue(previousValue);
          setStatusMessage("Applied.");
          return;
        }

        if (snapshot.status === "failed" || snapshot.status === "timed_out") {
          if (discardedTokensRef.current.has(token)) {
            setStatusMessage("Discarded.");
            return;
          }
          throw new Error(`Smart action ${snapshot.status}.`);
        }

        await sleep(400);
      }

      throw new Error("Smart action timed out while waiting for completion.");
    } catch (runError) {
      if (!discardedTokensRef.current.has(token)) {
        setError(
          runError instanceof Error ? runError.message : "Smart action failed.",
        );
        setStatusMessage("Error.");
      }
    } finally {
      if (activeTokenRef.current === token) {
        activeTokenRef.current = null;
        activeRunIdRef.current = null;
        setRunning(false);
      }
    }
  };

  const handleStop = async (): Promise<void> => {
    const runId = activeRunIdRef.current;
    if (!runId) {
      return;
    }
    setStatusMessage("Stopping...");
    try {
      await stopWorkflowLabRun(runId, { reason: "manual stop" });
    } catch (stopError) {
      setError(
        stopError instanceof Error
          ? stopError.message
          : "Could not stop smart action.",
      );
    }
  };

  const handleDiscard = async (): Promise<void> => {
    const runId = activeRunIdRef.current;
    const token = activeTokenRef.current;
    if (token === null) {
      return;
    }

    discardedTokensRef.current.add(token);
    activeTokenRef.current = null;
    activeRunIdRef.current = null;
    setRunning(false);
    setError(null);
    setStatusMessage("Discarded.");

    if (!runId) {
      return;
    }
    try {
      await stopWorkflowLabRun(runId, { reason: "discarded by user" });
    } catch {
      // Ignore stop errors because discard already detached local state.
    }
  };

  const handleRollback = (): void => {
    if (running || disabled || lastAppliedPreviousValue === null) {
      return;
    }
    onChange(lastAppliedPreviousValue);
    setLastAppliedPreviousValue(null);
    setError(null);
    setStatusMessage("Rolled back.");
  };

  const handleSaveInstructionPreset = (): void => {
    if (disabled) {
      return;
    }

    const normalizedPresetValue = normalizePresetValue(value);
    if (normalizedPresetValue.length === 0) {
      setPresetMessage("Write Smart Input text before saving a preset.");
      return;
    }
    if (normalizedPresetValue.length > maxLength) {
      setPresetMessage(
        `Preset text can be at most ${maxLength.toLocaleString()} characters.`,
      );
      return;
    }
    const normalizedPresetName = normalizePresetName(presetName);
    if (normalizedPresetName.length === 0) {
      setPresetMessage("Enter a preset name before saving.");
      return;
    }
    if (normalizedPresetName.length > MAX_INSTRUCTION_PRESET_NAME_LENGTH) {
      setPresetMessage(
        `Preset name can be at most ${MAX_INSTRUCTION_PRESET_NAME_LENGTH} characters.`,
      );
      return;
    }

    const normalizedNameKey = normalizedPresetName.toLocaleLowerCase();
    const duplicate = savedInstructionPresets.find(
      (preset) => preset.name.toLocaleLowerCase() === normalizedNameKey,
    );
    const nextPreset: SmartInstructionPreset = {
      id: duplicate?.id ?? createPresetId(),
      name: normalizedPresetName,
      instruction: normalizedPresetValue,
    };
    const nextPresets = [
      nextPreset,
      ...savedInstructionPresets.filter(
        (preset) => preset.name.toLocaleLowerCase() !== normalizedNameKey,
      ),
    ];
    const persisted = dedupePresets(nextPresets);

    setSavedInstructionPresets(persisted);
    persistInstructionPresets(presetStorageKey, persisted);
    setPresetName(normalizedPresetName);
    setPresetMessage(duplicate ? "Preset updated." : "Preset saved.");
  };

  const handleLoadInstructionPreset = (preset: SmartInstructionPreset): void => {
    onChange(preset.instruction);
    setPresetName(preset.name);
    setPresetMessage("Preset loaded.");
  };

  const readOnly = disabled;
  const transformControlsDisabled = readOnly || running;
  const menuRows: ContextMenuRow[] = [
    {
      kind: "custom",
      id: "make-changes",
      render: ({ close }) => (
        <div className={`${menuRowBaseClassName} grid-cols-[7rem_minmax(0,1fr)_auto]`}>
          <span className={menuLabelClassName}>Make Changes</span>
          <input
            type="text"
            value={instruction}
            onChange={(event) => {
              setInstruction(event.target.value);
              setPresetMessage(null);
            }}
            placeholder="Add stronger urgency and clearer stakes."
            disabled={transformControlsDisabled}
            className={menuInputClassName}
          />
          <Button
            variant="solid"
            color="gold"
            size="sm"
            disabled={transformControlsDisabled}
            className="justify-self-start"
            onClick={() => {
              close();
              void runTransform("make_changes");
            }}
          >
            Apply
          </Button>
        </div>
      ),
    },
    {
      kind: "custom",
      id: "save-preset",
      render: () => (
        <div className={`${menuRowBaseClassName} grid-cols-[7rem_minmax(0,1fr)_auto]`}>
          <span className={menuLabelClassName}>Preset Name</span>
          <input
            type="text"
            value={presetName}
            onChange={(event) => {
              setPresetName(event.target.value);
              setPresetMessage(null);
            }}
            placeholder="Dark mystery tone"
            maxLength={MAX_INSTRUCTION_PRESET_NAME_LENGTH}
            disabled={transformControlsDisabled}
            className={menuInputClassName}
          />
          <Button
            variant="solid"
            color="cloth"
            size="sm"
            disabled={transformControlsDisabled}
            className="justify-self-start"
            onClick={handleSaveInstructionPreset}
          >
            Save as Preset
          </Button>
        </div>
      ),
    },
    {
      kind: "custom",
      id: "preset-meta",
      render: () => (
        <div className={`${menuRowBaseClassName} grid-cols-[7rem_1fr]`}>
          <span className={menuLabelClassName}>Scope</span>
          <Text
            variant="note"
            color="iron-light"
            className="self-center text-sm normal-case tracking-normal !opacity-100"
          >
            {presetMessage ?? label}
          </Text>
        </div>
      ),
    },
    {
      kind: "custom",
      id: "preset-tags",
      render: () => (
        <div className={`${menuRowBaseClassName} grid-cols-[7rem_minmax(0,1fr)]`}>
          <span className={menuLabelClassName}>Preset Tags</span>
          <div className="flex min-w-0 flex-wrap gap-1.5">
            {savedInstructionPresets.length > 0 ? (
              savedInstructionPresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  title={`${preset.name}: ${preset.instruction}`}
                  disabled={transformControlsDisabled}
                  onClick={() => handleLoadInstructionPreset(preset)}
                  className="inline-flex max-w-[14rem] items-center border-2 border-kac-iron bg-kac-cloth-light px-2 pt-1.5 pb-1 font-heading text-xs/none font-bold uppercase tracking-wide text-kac-iron shadow-[2px_2px_0_0_#121b23] transition duration-100 hover:brightness-[1.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kac-gold-dark/50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="truncate">{preset.name}</span>
                </button>
              ))
            ) : (
              <Text
                variant="note"
                color="iron-light"
                className="text-sm normal-case tracking-normal !opacity-100"
              >
                No presets saved yet.
              </Text>
            )}
          </div>
        </div>
      ),
    },
    {
      kind: "custom",
      id: "convert-actions",
      render: ({ close }) => (
        <div className={`${menuRowBaseClassName} grid-cols-[1fr_1fr]`}>
          <Button
            variant="solid"
            color="gold"
            size="sm"
            disabled={transformControlsDisabled}
            className="w-full justify-center"
            onClick={() => {
              close();
              void runTransform("to_prose");
            }}
          >
            Convert to Prose
          </Button>
          <Button
            variant="solid"
            color="gold"
            size="sm"
            disabled={transformControlsDisabled}
            className="w-full justify-center"
            onClick={() => {
              close();
              void runTransform("to_bullets");
            }}
          >
            Convert to Bullets
          </Button>
        </div>
      ),
    },
    {
      kind: "custom",
      id: "expand",
      render: ({ close }) => (
        <div className={`${menuRowBaseClassName} grid-cols-[7rem_5.5rem_auto]`}>
          <span className={menuLabelClassName}>Expand (%)</span>
          <input
            type="number"
            min={1}
            max={200}
            value={expandPercent}
            onChange={(event) => setExpandPercent(event.target.value)}
            disabled={transformControlsDisabled}
            className={menuInputClassName}
          />
          <Button
            variant="solid"
            color="gold"
            size="sm"
            disabled={transformControlsDisabled}
            className="justify-self-start"
            onClick={() => {
              close();
              void runTransform("expand");
            }}
          >
            Expand
          </Button>
        </div>
      ),
    },
    {
      kind: "custom",
      id: "compact",
      render: ({ close }) => (
        <div className={`${menuRowBaseClassName} grid-cols-[7rem_5.5rem_auto]`}>
          <span className={menuLabelClassName}>Compact (%)</span>
          <input
            type="number"
            min={1}
            max={200}
            value={compactPercent}
            onChange={(event) => setCompactPercent(event.target.value)}
            disabled={transformControlsDisabled}
            className={menuInputClassName}
          />
          <Button
            variant="solid"
            color="gold"
            size="sm"
            disabled={transformControlsDisabled}
            className="justify-self-start"
            onClick={() => {
              close();
              void runTransform("compact");
            }}
          >
            Compact
          </Button>
        </div>
      ),
    },
  ];

  if (running) {
    menuRows.push({
      kind: "custom",
      id: "run-controls",
      render: ({ close }) => (
        <div className={`${menuRowBaseClassName} grid-cols-[7rem_auto_auto]`}>
          <span className={menuLabelClassName}>Running</span>
          <Button
            variant="solid"
            color="blood"
            size="sm"
            disabled={readOnly}
            className="justify-self-start"
            onClick={() => {
              close();
              void handleStop();
            }}
          >
            Stop
          </Button>
          <Button
            variant="solid"
            color="cloth"
            size="sm"
            disabled={readOnly}
            className="justify-self-start"
            onClick={() => {
              close();
              void handleDiscard();
            }}
          >
            Discard
          </Button>
        </div>
      ),
    });
  }

  if (!running && lastAppliedPreviousValue !== null) {
    menuRows.push({
      kind: "custom",
      id: "rollback",
      render: ({ close }) => (
        <div className={`${menuRowBaseClassName} grid-cols-[7rem_auto]`}>
          <span className={menuLabelClassName}>Rollback</span>
          <Button
            variant="solid"
            color="cloth"
            size="sm"
            disabled={readOnly}
            className="justify-self-start"
            onClick={() => {
              close();
              handleRollback();
            }}
          >
            Last Change
          </Button>
        </div>
      ),
    });
  }

  return (
    <div className={className}>
      <TextArea
        label={label}
        description={description}
        showLabel={showLabel}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={() => onBlur?.()}
        disabled={readOnly || running}
        maxLength={maxLength}
        placeholder={placeholder}
        controlClassName="pr-12"
        topRightControl={
          <ContextMenu
            rows={menuRows}
            open={menuOpen}
            onOpenChange={(nextOpen) => {
              setMenuOpen(nextOpen);
            }}
            direction="bottom"
            align="end"
            menuClassName="w-[34rem] max-w-[90vw] p-1.5 border-kac-iron-dark from-kac-steel-light to-[#f7f9fc] shadow-[4px_4px_0_0_#121b23]"
            renderTrigger={(triggerProps) => (
              <button
                type="button"
                className={`inline-flex h-7 w-7 items-center justify-center rounded-full border-2 text-kac-iron transition duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kac-gold-dark/50 disabled:cursor-not-allowed disabled:opacity-55 ${
                  triggerProps["aria-expanded"]
                    ? "translate-y-[1px] border-kac-iron-dark bg-gradient-to-b from-[#dbc4a3] to-[#c7ab87] shadow-none ring-2 ring-kac-gold-dark/30"
                    : "border-kac-iron bg-gradient-to-b from-kac-steel-light to-kac-bone-light shadow-[1px_1px_0_0_#121b23] hover:brightness-[1.03] active:translate-y-[1px] active:shadow-none"
                }`}
                aria-label="Open smart actions"
                disabled={readOnly}
                onClick={triggerProps.onClick}
                aria-haspopup={triggerProps["aria-haspopup"]}
                aria-expanded={triggerProps["aria-expanded"]}
                aria-controls={triggerProps["aria-controls"]}
              >
                <span
                  aria-hidden="true"
                  className="flex flex-col items-center justify-center gap-[2px]"
                >
                  <span className="h-0.5 w-0.5 rounded-full bg-kac-iron" />
                  <span className="h-0.5 w-0.5 rounded-full bg-kac-iron" />
                  <span className="h-0.5 w-0.5 rounded-full bg-kac-iron" />
                </span>
              </button>
            )}
          />
        }
        showCharCount
      />

      <div className="mt-3 stack gap-2">
        {statusMessage ? (
          <Text variant="note" color="iron-light" className="text-sm !opacity-100">
            {statusMessage}
          </Text>
        ) : null}

        {error ? (
          <Message label="Smart Input" color="blood">
            {error}
          </Message>
        ) : null}
      </div>
    </div>
  );
};
