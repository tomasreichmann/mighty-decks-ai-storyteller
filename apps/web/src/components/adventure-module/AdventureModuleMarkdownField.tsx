import { useEffect, useMemo, useRef, useState } from "react";
import type { ClipboardEvent, FocusEvent } from "react";
import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  CreateLink,
  DiffSourceToggleWrapper,
  InsertThematicBreak,
  ListsToggle,
  MDXEditor,
  type MDXEditorMethods,
  Separator,
  UndoRedo,
  diffSourcePlugin,
  headingsPlugin,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  markdownShortcutPlugin,
  quotePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
  jsxPlugin,
  type JsxComponentDescriptor,
} from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";
import {
  getWorkflowLabRun,
  startWorkflowLabRun,
  stopWorkflowLabRun,
} from "../../lib/workflowLabApi";
import { Button } from "../common/Button";
import { ContextMenu, type ContextMenuRow } from "../common/ContextMenu";
import type { DropdownTriggerRenderProps } from "../common/Dropdown";
import { InputDescriptionHint } from "../common/InputDescriptionHint";
import { Label } from "../common/Label";
import { Tags } from "../common/Tags";
import { Text } from "../common/Text";
import {
  buildSmartInputContextDescription,
  getDefaultSmartContextTags,
  getSmartContextTagOptions,
  normalizeSmartContextTags,
  type SmartInputContextTag,
  type SmartInputDocumentContext,
} from "../../lib/smartInputContext";
import {
  defaultGameCardType,
  gameCardOptionsByType,
  gameCardTypeLabel,
  type GameCardOption,
  type GameCardType,
} from "../../lib/markdownGameComponents";
import { normalizeLegacyGameCardMarkdown } from "../../lib/gameCardMarkdown";
import { GameCardJsxEditor } from "./GameCardJsxEditor";
import styles from "./AdventureModulePlayerInfoTabPanel.module.css";

type SmartInputAction =
  | "make_changes"
  | "to_prose"
  | "to_bullets"
  | "expand"
  | "compact";

interface UseMarkdownSmartActionsArgs {
  contextDescription: string;
  value: string;
  editable: boolean;
  maxLength: number;
  onChange: (nextValue: string) => void;
}

interface UseMarkdownSmartActionsResult {
  menuRows: ContextMenuRow[];
  menuOpen: boolean;
  onMenuOpenChange: (nextOpen: boolean) => void;
  running: boolean;
  statusMessage: string | null;
  errorMessage: string | null;
}

export interface AdventureModuleMarkdownFieldProps {
  label: string;
  description: string;
  selfContextTag: SmartInputContextTag;
  smartContextDocument: SmartInputDocumentContext;
  value: string;
  editable: boolean;
  maxLength: number;
  onChange: (nextValue: string) => void;
  onFieldBlur: () => void;
  contentEditableClassName: string;
}

const SMART_ACTION_INPUT_MAX_LENGTH = 4_000;

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const parseTransformedText = (
  outputs: Record<string, unknown>,
  maxLength: number,
): string => {
  const transformed = asRecord(outputs.transformed);
  const text = transformed.text;
  if (typeof text !== "string") {
    throw new Error("Workflow did not return transformed text.");
  }
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    throw new Error("Workflow returned empty text.");
  }
  if (trimmed.length > maxLength) {
    throw new Error(
      `Workflow returned text longer than ${maxLength.toLocaleString()} characters.`,
    );
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

const renderSmartMenuTrigger = (
  triggerProps: DropdownTriggerRenderProps,
  disabled: boolean,
): JSX.Element => (
  <button
    type="button"
    className={`inline-flex h-7 w-7 items-center justify-center rounded-full border-2 text-kac-iron transition duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kac-gold-dark/50 disabled:cursor-not-allowed disabled:opacity-55 ${
      triggerProps["aria-expanded"]
        ? "translate-y-[1px] border-kac-iron-dark bg-gradient-to-b from-[#dbc4a3] to-[#c7ab87] shadow-none ring-2 ring-kac-gold-dark/30"
        : "border-kac-iron bg-gradient-to-b from-kac-steel-light to-kac-bone-light shadow-[1px_1px_0_0_#121b23] hover:brightness-[1.03] active:translate-y-[1px] active:shadow-none"
    }`}
    aria-label="Open smart actions"
    disabled={disabled}
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
);

interface CreateEditorPluginsArgs {
  insertType: GameCardType;
  insertSlug: string;
  insertOptions: GameCardOption[];
  insertDisabled: boolean;
  onInsertTypeChange: (nextType: GameCardType) => void;
  onInsertSlugChange: (nextSlug: string) => void;
  onInsert: () => void;
}

const gameCardJsxDescriptor: JsxComponentDescriptor = {
  name: "GameCard",
  kind: "text",
  props: [
    { name: "type", type: "string", required: true },
    { name: "slug", type: "string", required: true },
  ],
  hasChildren: false,
  Editor: GameCardJsxEditor,
};

const renderToolbarInsertControls = ({
  insertType,
  insertSlug,
  insertOptions,
  insertDisabled,
  onInsertTypeChange,
  onInsertSlugChange,
  onInsert,
}: CreateEditorPluginsArgs): JSX.Element => (
  <span className="ml-1 inline-flex items-center gap-1 border-l-2 border-kac-iron-dark/30 pl-2">
    <select
      aria-label="Insert card type"
      value={insertType}
      onChange={(event) =>
        onInsertTypeChange(event.target.value as GameCardType)
      }
      disabled={insertDisabled}
      className="h-7 min-w-[6.6rem] border-2 border-kac-iron rounded-sm bg-gradient-to-b from-[#f8efd8] to-[#e5d4b9] px-1.5 text-xs text-kac-iron font-ui disabled:cursor-not-allowed disabled:opacity-60"
    >
      <option value="OutcomeCard">Outcome</option>
      <option value="EffectCard">Effect</option>
      <option value="StuntCard">Stunt</option>
    </select>
    <select
      aria-label="Insert card"
      value={insertSlug}
      onChange={(event) => onInsertSlugChange(event.target.value)}
      disabled={insertDisabled}
      className="h-7 min-w-[11rem] max-w-[14rem] border-2 border-kac-iron rounded-sm bg-gradient-to-b from-[#f8efd8] to-[#e5d4b9] px-1.5 text-xs text-kac-iron font-ui disabled:cursor-not-allowed disabled:opacity-60"
    >
      {insertOptions.length > 0 ? (
        insertOptions.map((option) => (
          <option key={option.legacyToken} value={option.slug}>
            {option.label}
          </option>
        ))
      ) : (
        <option value="">No cards</option>
      )}
    </select>
    <Button
      variant="solid"
      color="gold"
      size="sm"
      disabled={insertDisabled}
      className="h-7 px-2 text-xs"
      onClick={onInsert}
    >
      Insert
    </Button>
  </span>
);

const createEditorPlugins = (toolbarArgs: CreateEditorPluginsArgs) => [
  headingsPlugin(),
  listsPlugin(),
  quotePlugin(),
  thematicBreakPlugin(),
  linkPlugin(),
  linkDialogPlugin(),
  jsxPlugin({
    jsxComponentDescriptors: [gameCardJsxDescriptor],
  }),
  markdownShortcutPlugin(),
  diffSourcePlugin({
    viewMode: "rich-text",
  }),
  toolbarPlugin({
    toolbarContents: () => (
      <DiffSourceToggleWrapper options={["rich-text", "source"]}>
        <UndoRedo />
        <Separator />
        <BoldItalicUnderlineToggles />
        <Separator />
        <BlockTypeSelect />
        <Separator />
        <ListsToggle />
        <CreateLink />
        <InsertThematicBreak />
        {renderToolbarInsertControls(toolbarArgs)}
      </DiffSourceToggleWrapper>
    ),
  }),
];

const handleEditorBlur = (
  event: FocusEvent,
  onFieldBlur: () => void,
  editable: boolean,
): void => {
  if (!editable) {
    return;
  }
  const currentTarget = event.currentTarget as HTMLElement | null;
  const nextTarget = event.relatedTarget as Node | null;
  if (currentTarget && nextTarget && currentTarget.contains(nextTarget)) {
    return;
  }
  onFieldBlur();
};

const useMarkdownSmartActions = ({
  contextDescription,
  value,
  editable,
  maxLength,
  onChange,
}: UseMarkdownSmartActionsArgs): UseMarkdownSmartActionsResult => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [instruction, setInstruction] = useState("");
  const [expandPercent, setExpandPercent] = useState("20");
  const [compactPercent, setCompactPercent] = useState("20");
  const [running, setRunning] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastAppliedPreviousValue, setLastAppliedPreviousValue] = useState<
    string | null
  >(null);

  const activeRunIdRef = useRef<string | null>(null);
  const activeTokenRef = useRef<number | null>(null);
  const discardedTokensRef = useRef(new Set<number>());
  const nextTokenRef = useRef(0);

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
    if (!editable || running) {
      return;
    }

    const sourceText = value.trim();
    if (sourceText.length === 0) {
      setErrorMessage("Text is required before running smart actions.");
      return;
    }
    if (sourceText.length > SMART_ACTION_INPUT_MAX_LENGTH) {
      setErrorMessage(
        `Smart actions currently support up to ${SMART_ACTION_INPUT_MAX_LENGTH.toLocaleString()} characters.`,
      );
      return;
    }

    const contextInput =
      contextDescription.trim().length > 0
        ? { contextDescription: contextDescription.trim() }
        : {};

    let workflowId = "";
    let input: Record<string, unknown> = { text: sourceText, ...contextInput };
    let actionLabel = "";

    try {
      switch (action) {
        case "make_changes":
          if (!instruction.trim()) {
            throw new Error(
              "Provide a change request before running Make Changes.",
            );
          }
          workflowId = "adventure_module_premise_make_changes";
          input = {
            text: sourceText,
            instruction: instruction.trim(),
            ...contextInput,
          };
          actionLabel = "Applying changes";
          break;
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
            text: sourceText,
            percent: toPercentValue(expandPercent, "Expand"),
            ...contextInput,
          };
          actionLabel = "Expanding text";
          break;
        case "compact":
          workflowId = "adventure_module_premise_compact";
          input = {
            text: sourceText,
            percent: toPercentValue(compactPercent, "Compact"),
            ...contextInput,
          };
          actionLabel = "Compacting text";
          break;
      }
    } catch (validationError) {
      setErrorMessage(
        validationError instanceof Error
          ? validationError.message
          : "Could not start smart action.",
      );
      return;
    }

    setErrorMessage(null);
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
            maxLength,
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
        setErrorMessage(
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
      setErrorMessage(
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
    setErrorMessage(null);
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
    if (running || !editable || lastAppliedPreviousValue === null) {
      return;
    }
    onChange(lastAppliedPreviousValue);
    setLastAppliedPreviousValue(null);
    setErrorMessage(null);
    setStatusMessage("Rolled back.");
  };

  const transformControlsDisabled = !editable || running;
  const menuRows: ContextMenuRow[] = [
    {
      kind: "custom",
      id: "make-changes",
      render: ({ close }) => (
        <div
          className={`${menuRowBaseClassName} grid-cols-[7rem_minmax(0,1fr)_auto]`}
        >
          <span className={menuLabelClassName}>Make Changes</span>
          <input
            type="text"
            value={instruction}
            onChange={(event) => setInstruction(event.target.value)}
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
            disabled={!editable}
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
            disabled={!editable}
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
            disabled={!editable}
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

  return {
    menuRows,
    menuOpen,
    onMenuOpenChange: (nextOpen: boolean): void => {
      setMenuOpen(nextOpen);
    },
    running,
    statusMessage,
    errorMessage,
  };
};

export const AdventureModuleMarkdownField = ({
  label,
  description,
  selfContextTag,
  smartContextDocument,
  value,
  editable,
  maxLength,
  onChange,
  onFieldBlur,
  contentEditableClassName,
}: AdventureModuleMarkdownFieldProps): JSX.Element => {
  const editorRef = useRef<MDXEditorMethods>(null);
  const editorMarkdown = useMemo(
    () => normalizeLegacyGameCardMarkdown(value),
    [value],
  );
  const contextOptions = useMemo(
    () => getSmartContextTagOptions([selfContextTag]),
    [selfContextTag],
  );
  const [selectedContextTags, setSelectedContextTags] = useState<
    SmartInputContextTag[]
  >(() => getDefaultSmartContextTags([selfContextTag]));
  const [insertType, setInsertType] = useState<GameCardType>(defaultGameCardType);
  const [insertSlug, setInsertSlug] = useState<string>(
    () => gameCardOptionsByType[defaultGameCardType][0]?.slug ?? "",
  );
  const [insertStatusMessage, setInsertStatusMessage] = useState<string | null>(
    null,
  );
  const [insertErrorMessage, setInsertErrorMessage] = useState<string | null>(
    null,
  );
  const contextDescription = useMemo(
    () =>
      buildSmartInputContextDescription({
        inputLabel: label,
        inputDescription: description,
        selectedTags: selectedContextTags,
        context: smartContextDocument,
        currentInputValue: editorMarkdown,
      }),
    [
      description,
      editorMarkdown,
      label,
      selectedContextTags,
      smartContextDocument,
    ],
  );
  useEffect(() => {
    const options = gameCardOptionsByType[insertType];
    if (options.length === 0) {
      if (insertSlug !== "") {
        setInsertSlug("");
      }
      return;
    }
    if (!options.some((option) => option.slug === insertSlug)) {
      setInsertSlug(options[0].slug);
    }
  }, [insertSlug, insertType]);

  const handleInsertComponent = (componentMarkdown: string): boolean => {
    if (!editable || !editorRef.current) {
      return false;
    }

    const normalizedMarkdown = componentMarkdown.trim();
    if (normalizedMarkdown.length === 0) {
      return false;
    }

    const insertText = `\n${normalizedMarkdown}\n`;
    if (editorMarkdown.length + insertText.length > maxLength) {
      setInsertErrorMessage(
        `Inserting this card would exceed the ${maxLength.toLocaleString()} character limit.`,
      );
      return false;
    }

    editorRef.current.focus(() => {
      editorRef.current?.insertMarkdown(insertText);
    });
    setInsertErrorMessage(null);
    return true;
  };

  const smartActions = useMarkdownSmartActions({
    contextDescription,
    value: editorMarkdown,
    editable,
    maxLength,
    onChange,
  });
  const insertOptions = gameCardOptionsByType[insertType];
  const insertDisabled =
    !editable || smartActions.running || insertOptions.length === 0;
  const handleInsertFromToolbar = (): void => {
    const selected = insertOptions.find((option) => option.slug === insertSlug);
    if (!selected) {
      setInsertErrorMessage("Select a card before inserting.");
      return;
    }
    if (!handleInsertComponent(selected.jsx)) {
      return;
    }
    setInsertStatusMessage(
      `Inserted ${gameCardTypeLabel[insertType]} card.`,
    );
  };
  const plugins = useMemo(
    () =>
      createEditorPlugins({
        insertType,
        insertSlug,
        insertOptions,
        insertDisabled,
        onInsertTypeChange: (nextType) => {
          setInsertType(nextType);
          setInsertErrorMessage(null);
        },
        onInsertSlugChange: (nextSlug) => {
          setInsertSlug(nextSlug);
          setInsertErrorMessage(null);
        },
        onInsert: handleInsertFromToolbar,
      }),
    [
      handleInsertFromToolbar,
      insertDisabled,
      insertOptions,
      insertSlug,
      insertType,
    ],
  );

  useEffect(() => {
    if (!editorRef.current) {
      return;
    }
    if (editorRef.current.getMarkdown() === editorMarkdown) {
      return;
    }
    editorRef.current.setMarkdown(editorMarkdown);
  }, [editorMarkdown]);
  useEffect(() => {
    if (insertStatusMessage) {
      setInsertStatusMessage(null);
    }
    if (insertErrorMessage) {
      setInsertErrorMessage(null);
    }
  }, [editorMarkdown]);

  const handlePasteCapture = (event: ClipboardEvent<HTMLDivElement>): void => {
    if (!editable || smartActions.running || !editorRef.current) {
      return;
    }

    const plainText = event.clipboardData.getData("text/plain");
    if (plainText.trim().length === 0) {
      return;
    }

    const normalized = normalizeLegacyGameCardMarkdown(plainText);
    if (normalized === plainText) {
      return;
    }

    const insertText = normalized;
    if (insertText.trim().length === 0) {
      return;
    }
    if (editorMarkdown.length + insertText.length > maxLength) {
      setInsertErrorMessage(
        `Pasting this card content would exceed the ${maxLength.toLocaleString()} character limit.`,
      );
      return;
    }

    event.preventDefault();
    editorRef.current.focus(() => {
      editorRef.current?.insertMarkdown(insertText);
    });
    setInsertErrorMessage(null);
    setInsertStatusMessage("Converted pasted legacy card tokens.");
  };

  return (
    <div className={styles.fieldShell}>
      <div className={styles.fieldLabelRow}>
        <div className={styles.fieldLabelMain}>
          <Label variant="gold" className="-mb-2 -ml-1 relative self-start z-20">
            {label}
          </Label>
          <InputDescriptionHint
            description={description}
            className="-translate-y-1 z-50"
          />
        </div>
        <Tags
          label="Smart Context"
          value={selectedContextTags}
          onChange={(nextValue) =>
            setSelectedContextTags(
              normalizeSmartContextTags(nextValue, contextOptions),
            )
          }
          options={contextOptions}
          allowCustom={false}
          addButtonLabel="Add Context"
          placeholder="Search context..."
          disabled={!editable || smartActions.running}
          chrome="borderless"
          showLabel={false}
          showEmptyState={false}
          showCounter={false}
          className={styles.fieldContextTags}
        />
      </div>

      <div
        className={styles.editorShell}
        onBlur={(event) => handleEditorBlur(event, onFieldBlur, editable)}
        onPasteCapture={handlePasteCapture}
      >
        <div className={styles.smartMenuAnchor}>
          <ContextMenu
            rows={smartActions.menuRows}
            open={smartActions.menuOpen}
            onOpenChange={smartActions.onMenuOpenChange}
            direction="bottom"
            align="end"
            menuClassName="w-[34rem] max-w-[90vw] max-h-[70vh] overflow-y-auto p-1.5 border-kac-iron-dark from-kac-steel-light to-[#f7f9fc] shadow-[4px_4px_0_0_#121b23]"
            renderTrigger={(triggerProps) =>
              renderSmartMenuTrigger(triggerProps, !editable)
            }
          />
        </div>
        <div className={styles.editorFrame}>
          <MDXEditor
            ref={editorRef}
            markdown={editorMarkdown}
            readOnly={!editable || smartActions.running}
            suppressHtmlProcessing
            plugins={plugins}
            className={styles.editorRoot}
            contentEditableClassName={`${styles.contentEditable} ${contentEditableClassName}`}
            onChange={(nextMarkdown, initialMarkdownNormalize) => {
              if (initialMarkdownNormalize || !editable || smartActions.running) {
                return;
              }
              if (nextMarkdown.length > maxLength) {
                return;
              }
              onChange(nextMarkdown);
            }}
          />
        </div>
      </div>

      <Text variant="note" color="iron-light" className="text-xs !opacity-100">
        {editorMarkdown.length.toLocaleString()} / {maxLength.toLocaleString()}{" "}
        characters
      </Text>
      {smartActions.statusMessage ? (
        <Text variant="note" color="iron-light" className="text-sm !opacity-100">
          {smartActions.statusMessage}
        </Text>
      ) : null}
      {smartActions.errorMessage ? (
        <Text variant="note" color="blood" className="text-sm !opacity-100">
          {smartActions.errorMessage}
        </Text>
      ) : null}
      {insertStatusMessage ? (
        <Text variant="note" color="iron-light" className="text-sm !opacity-100">
          {insertStatusMessage}
        </Text>
      ) : null}
      {insertErrorMessage ? (
        <Text variant="note" color="blood" className="text-sm !opacity-100">
          {insertErrorMessage}
        </Text>
      ) : null}
    </div>
  );
};
