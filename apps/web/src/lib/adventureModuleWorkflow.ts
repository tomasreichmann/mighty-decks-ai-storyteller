import {
  getWorkflowLabRun,
  startWorkflowLabRun,
  subscribeWorkflowLabRunEvents,
} from "./workflowLabApi";

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const asString = (value: unknown, fallback = ""): string =>
  typeof value === "string" ? value : fallback;

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];

const asBoolean = (value: unknown, fallback = false): boolean =>
  typeof value === "boolean" ? value : fallback;

type FragmentAudience = "players" | "storyteller" | "shared";

const asAudience = (value: unknown): FragmentAudience => {
  if (value === "players" || value === "storyteller" || value === "shared") {
    return value;
  }
  return "shared";
};

export interface SeedScaffoldResult {
  title: string;
  summary: string;
  intent: string;
  dos: string[];
  donts: string[];
  tags: string[];
  starterFragments: Array<{
    kind: string;
    title: string;
    summary: string;
    containsSpoilers: boolean;
    intendedAudience: "players" | "storyteller" | "shared";
  }>;
}

export interface BrainstormResult {
  target: string;
  options: Array<{
    optionId: string;
    title: string;
    rationale: string;
    candidateText: string;
  }>;
}

export interface ExpandFragmentsResult {
  fragments: Array<{
    kind: string;
    title: string;
    summary: string;
    containsSpoilers: boolean;
    intendedAudience: "players" | "storyteller" | "shared";
    content: string;
  }>;
}

export interface PolishContinuityResult {
  issues: string[];
  revisions: Array<{
    fragmentId: string;
    reason: string;
    revisedContent: string;
  }>;
}

const parseSeedScaffold = (value: unknown): SeedScaffoldResult => {
  const record = asRecord(value);
  const starterFragments = Array.isArray(record.starterFragments)
    ? record.starterFragments
        .map((entry) => asRecord(entry))
        .map((entry) => {
          return {
            kind: asString(entry.kind),
            title: asString(entry.title),
            summary: asString(entry.summary),
            containsSpoilers: asBoolean(entry.containsSpoilers, false),
            intendedAudience: asAudience(entry.intendedAudience),
          };
        })
        .filter((entry) => entry.kind.length > 0 && entry.title.length > 0)
    : [];

  return {
    title: asString(record.title),
    summary: asString(record.summary),
    intent: asString(record.intent),
    dos: asStringArray(record.dos),
    donts: asStringArray(record.donts),
    tags: asStringArray(record.tags),
    starterFragments,
  };
};

const parseBrainstorm = (value: unknown): BrainstormResult => {
  const record = asRecord(value);
  const options = Array.isArray(record.options)
    ? record.options
        .map((entry) => asRecord(entry))
        .map((entry) => ({
          optionId: asString(entry.optionId),
          title: asString(entry.title),
          rationale: asString(entry.rationale),
          candidateText: asString(entry.candidateText),
        }))
        .filter(
          (entry) =>
            entry.optionId.length > 0 &&
            entry.title.length > 0 &&
            entry.candidateText.length > 0,
        )
    : [];

  return {
    target: asString(record.target, "summary"),
    options,
  };
};

const parseExpand = (value: unknown): ExpandFragmentsResult => {
  const record = asRecord(value);
  const fragments = Array.isArray(record.fragments)
    ? record.fragments
        .map((entry) => asRecord(entry))
        .map((entry) => {
          return {
            kind: asString(entry.kind),
            title: asString(entry.title),
            summary: asString(entry.summary),
            containsSpoilers: asBoolean(entry.containsSpoilers, false),
            intendedAudience: asAudience(entry.intendedAudience),
            content: asString(entry.content),
          };
        })
        .filter((entry) => entry.kind.length > 0 && entry.content.length > 0)
    : [];

  return {
    fragments,
  };
};

const parsePolish = (value: unknown): PolishContinuityResult => {
  const record = asRecord(value);
  const revisions = Array.isArray(record.revisions)
    ? record.revisions
        .map((entry) => asRecord(entry))
        .map((entry) => ({
          fragmentId: asString(entry.fragmentId),
          reason: asString(entry.reason),
          revisedContent: asString(entry.revisedContent),
        }))
        .filter(
          (entry) =>
            entry.fragmentId.length > 0 &&
            entry.reason.length > 0 &&
            entry.revisedContent.length > 0,
        )
    : [];

  return {
    issues: asStringArray(record.issues),
    revisions,
  };
};

const waitForRunCompletion = async (runId: string): Promise<Record<string, unknown>> => {
  for (let attempt = 0; attempt < 600; attempt += 1) {
    const snapshot = await getWorkflowLabRun(runId);
    if (snapshot.status === "completed") {
      return snapshot.outputs as Record<string, unknown>;
    }
    if (snapshot.status === "failed" || snapshot.status === "timed_out") {
      throw new Error(`Workflow run ${snapshot.status}.`);
    }
    await sleep(500);
  }
  throw new Error("Workflow run timed out while waiting for completion.");
};

const runAndCollectOutputs = async (
  workflowId: string,
  input: unknown,
  onEvent?: (message: string) => void,
): Promise<Record<string, unknown>> => {
  const started = await startWorkflowLabRun({
    workflowId,
    input: input as never,
  });

  const source = subscribeWorkflowLabRunEvents(started.runId, {
    onEvent: (event) => {
      if (event.type === "step_progress" && event.message && onEvent) {
        onEvent(event.message);
      }
    },
  });

  try {
    return await waitForRunCompletion(started.runId);
  } finally {
    source.close();
  }
};

export const runAdventureModuleSeedScaffold = async (
  input: {
    seedPrompt: string;
    titleHint?: string;
    toneHint?: string;
  },
  onEvent?: (message: string) => void,
): Promise<SeedScaffoldResult> => {
  const outputs = await runAndCollectOutputs(
    "adventure_module_seed_scaffold",
    input,
    onEvent,
  );
  return parseSeedScaffold(outputs.scaffold);
};

export const runAdventureModuleBrainstorm = async (
  input: {
    target: "palette" | "hooks" | "tone" | "setting" | "summary";
    moduleTitle?: string;
    contextText: string;
  },
  onEvent?: (message: string) => void,
): Promise<BrainstormResult> => {
  const outputs = await runAndCollectOutputs(
    "adventure_module_brainstorm_options",
    input,
    onEvent,
  );
  return parseBrainstorm(outputs.options);
};

export const runAdventureModuleExpandFragments = async (
  input: {
    moduleTitle: string;
    moduleSummary: string;
    fragmentKinds: string[];
    contextText?: string;
  },
  onEvent?: (message: string) => void,
): Promise<ExpandFragmentsResult> => {
  const outputs = await runAndCollectOutputs(
    "adventure_module_expand_fragments",
    input,
    onEvent,
  );
  return parseExpand(outputs.fragments);
};

export const runAdventureModulePolishContinuity = async (
  input: {
    moduleTitle: string;
    fragments: Array<{
      fragmentId: string;
      title: string;
      content: string;
    }>;
    styleHint?: string;
  },
  onEvent?: (message: string) => void,
): Promise<PolishContinuityResult> => {
  const outputs = await runAndCollectOutputs(
    "adventure_module_polish_continuity",
    input,
    onEvent,
  );
  return parsePolish(outputs.polish);
};
