import { z } from "zod";
import { trimLines } from "./text";

const stripCodeFence = (raw: string): string =>
  raw
    .trim()
    .replace(/^```(?:json|yaml|yml|text)?/i, "")
    .replace(/```$/i, "")
    .trim();

const extractJsonCandidate = (raw: string): string | null => {
  const trimmed = stripCodeFence(raw);
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return trimmed;
  }

  const objectStart = trimmed.indexOf("{");
  const objectEnd = trimmed.lastIndexOf("}");
  if (objectStart >= 0 && objectEnd > objectStart) {
    return trimmed.slice(objectStart, objectEnd + 1);
  }

  const arrayStart = trimmed.indexOf("[");
  const arrayEnd = trimmed.lastIndexOf("]");
  if (arrayStart >= 0 && arrayEnd > arrayStart) {
    return trimmed.slice(arrayStart, arrayEnd + 1);
  }

  return null;
};

const normalizeLabel = (value: string): string =>
  value.toLowerCase().replace(/[\s_-]/g, "");

const uniqueStrings = (values: string[]): string[] => {
  const seen = new Set<string>();
  const output: string[] = [];
  for (const value of values) {
    const trimmed = trimLines(value);
    if (trimmed.length === 0 || seen.has(trimmed)) {
      continue;
    }

    seen.add(trimmed);
    output.push(trimmed);
  }

  return output;
};

const decodeLooseScalar = (rawValue: string): string => {
  let value = rawValue.trim().replace(/,$/, "").trim();
  if (value.length === 0) {
    return "";
  }

  if (
    (value.startsWith("\"") && value.endsWith("\"")) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    if (value.startsWith("\"")) {
      try {
        return trimLines(JSON.parse(value) as string);
      } catch {
        // Fall through to manual cleanup.
      }
    }
    value = value.slice(1, -1);
  } else {
    if (value.startsWith("\"") || value.startsWith("'")) {
      value = value.slice(1);
    }
    if (value.endsWith("\"") || value.endsWith("'")) {
      value = value.slice(0, -1);
    }
  }

  return trimLines(
    value
      .replace(/\\n/g, "\n")
      .replace(/\\t/g, "\t")
      .replace(/\\"/g, "\"")
      .replace(/\\'/g, "'"),
  );
};

const parseInlineStringArray = (rawValue: string): string[] => {
  const trimmed = rawValue.trim();
  if (trimmed.length === 0) {
    return [];
  }

  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (item): item is string => typeof item === "string",
        );
      }
    } catch {
      // Continue with plain-text parsing below.
    }
  }

  const splitCandidates = [" | ", "; "];
  for (const separator of splitCandidates) {
    if (trimmed.includes(separator)) {
      return trimmed
        .split(separator)
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
    }
  }

  return [trimmed];
};

const parseLooseBoolean = (value: string | undefined): boolean | undefined => {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === "true" || normalized === "yes" || normalized === "1") {
    return true;
  }
  if (normalized === "false" || normalized === "no" || normalized === "0") {
    return false;
  }

  return undefined;
};

const parseLooseNumber = (value: string | undefined): number | undefined => {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

interface LooseKeyValueRecords {
  scalars: Map<string, string>;
  lists: Map<string, string[]>;
}

const parseLooseKeyValueRecords = (raw: string): LooseKeyValueRecords => {
  const cleaned = stripCodeFence(raw);
  const lines = cleaned.split("\n");
  const scalars = new Map<string, string>();
  const lists = new Map<string, string[]>();
  let listSection: string | null = null;

  const pushListValue = (key: string, value: string): void => {
    const decoded = decodeLooseScalar(value);
    if (decoded.length === 0) {
      return;
    }

    const current = lists.get(key) ?? [];
    current.push(decoded);
    lists.set(key, current);
  };

  const processKeyLine = (line: string): boolean => {
    const keyMatch = line.match(
      /^(?:"?([A-Za-z][A-Za-z0-9 _-]*)"?)\s*:\s*(.*)$/,
    );
    if (!keyMatch) {
      return false;
    }

    const key = normalizeLabel(keyMatch[1] ?? "");
    const rawValue = keyMatch[2]?.trim() ?? "";
    if (rawValue.length === 0) {
      listSection = key;
      return true;
    }

    if (rawValue.startsWith("[")) {
      const normalizedArray = rawValue.replace(/,$/, "").trim();
      if (normalizedArray.endsWith("]")) {
        const inlineValues = parseInlineStringArray(normalizedArray)
          .map((value) => decodeLooseScalar(value))
          .filter((value) => value.length > 0);
        if (inlineValues.length > 0) {
          lists.set(key, [...(lists.get(key) ?? []), ...inlineValues]);
        }
        return true;
      }

      listSection = key;
      const firstToken = normalizedArray.slice(1).trim();
      if (firstToken.length > 0) {
        pushListValue(key, firstToken);
      }
      return true;
    }

    const decoded = decodeLooseScalar(rawValue);
    if (decoded.length > 0) {
      scalars.set(key, decoded);
    }
    return true;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.length === 0) {
      continue;
    }

    if (listSection) {
      if (/^\],?$/.test(line)) {
        listSection = null;
        continue;
      }

      const isNewKey =
        !line.startsWith("-") &&
        !line.startsWith("*") &&
        /^\d+\.\s+/.test(line) === false &&
        /^(?:"?[A-Za-z][A-Za-z0-9 _-]*"?)\s*:/.test(line);

      if (!isNewKey) {
        const listValue = line
          .replace(/^[-*]\s+/, "")
          .replace(/^\d+\.\s+/, "")
          .trim();
        if (listValue.length > 0) {
          pushListValue(listSection, listValue);
        }
        continue;
      }

      listSection = null;
    }

    processKeyLine(line);
  }

  return { scalars, lists };
};

const readList = (records: LooseKeyValueRecords, key: string): string[] => {
  const normalizedKey = normalizeLabel(key);
  const listValues = records.lists.get(normalizedKey) ?? [];
  const scalarValues = parseInlineStringArray(
    records.scalars.get(normalizedKey) ?? "",
  )
    .map((value) => decodeLooseScalar(value))
    .filter((value) => value.length > 0);
  return uniqueStrings([...listValues, ...scalarValues]);
};

export interface LooseSceneStart {
  introProse?: string;
  orientationBullets?: string[];
  playerPrompt?: string;
  tension?: number;
  secrets?: string[];
  pacingNotes?: string[];
  continuityWarnings?: string[];
}

export interface LooseActionResponse {
  text?: string;
  closeScene?: boolean;
  sceneSummary?: string;
  tension?: number;
  secrets?: string[];
  pacingNotes?: string[];
  continuityWarnings?: string[];
}

export interface LooseSceneReaction {
  npcBeat?: string;
  consequence?: string;
  reward?: string;
  goalStatus?: "advanced" | "completed" | "blocked";
  failForward?: boolean;
  tensionShift?: "rise" | "fall" | "stable";
  tensionDelta?: number;
  sceneMode?: "low_tension" | "high_tension";
  turnOrderRequired?: boolean;
  tensionBand?: "low" | "medium" | "high";
  closeScene?: boolean;
  sceneSummary?: string;
  tension?: number;
  tensionReason?: string;
  reasoning?: string[];
  pacingNotes?: string[];
  continuityWarnings?: string[];
}

export interface LooseOutcomeCheckDecision {
  intent?: "information_request" | "direct_action";
  responseMode?: "concise" | "expanded";
  detailLevel?: "concise" | "standard" | "expanded";
  shouldCheck?: boolean;
  reason?: string;
  allowHardDenyWithoutOutcomeCheck?: boolean;
  hardDenyReason?: string;
  triggers?: {
    threat?: boolean;
    uncertainty?: boolean;
    highReward?: boolean;
  };
}

export const parseLooseSceneStart = (raw: string): LooseSceneStart | null => {
  const cleaned = stripCodeFence(raw);
  if (cleaned.length === 0) {
    return null;
  }

  const lines = cleaned
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const introParts: string[] = [];
  const orientationBullets: string[] = [];
  const playerPromptParts: string[] = [];
  const secrets: string[] = [];
  const pacingNotes: string[] = [];
  const continuityWarnings: string[] = [];
  let tension: number | undefined;
  let section:
    | "introProse"
    | "orientationBullets"
    | "playerPrompt"
    | "secrets"
    | "pacingNotes"
    | "continuityWarnings"
    | null = null;

  for (const line of lines) {
    const keyMatch = line.match(/^([A-Za-z][A-Za-z0-9 _-]*):\s*(.*)$/);
    if (keyMatch) {
      const label = normalizeLabel(keyMatch[1] ?? "");
      const value = keyMatch[2]?.trim() ?? "";

      if (label === "introprose") {
        section = "introProse";
        if (value.length > 0) {
          introParts.push(value);
        }
        continue;
      }

      if (label === "orientationbullets") {
        section = "orientationBullets";
        orientationBullets.push(...parseInlineStringArray(value));
        continue;
      }

      if (
        label === "playerprompt" ||
        label === "actionprompt" ||
        label === "playeractionprompt"
      ) {
        section = "playerPrompt";
        if (value.length > 0) {
          playerPromptParts.push(value);
        }
        continue;
      }

      if (label === "tension") {
        section = null;
        const parsed = Number(value);
        if (Number.isFinite(parsed)) {
          tension = Math.max(0, Math.min(100, parsed));
        }
        continue;
      }

      if (label === "secrets") {
        section = "secrets";
        secrets.push(...parseInlineStringArray(value));
        continue;
      }

      if (label === "pacingnotes") {
        section = "pacingNotes";
        pacingNotes.push(...parseInlineStringArray(value));
        continue;
      }

      if (label === "continuitywarnings") {
        section = "continuityWarnings";
        continuityWarnings.push(...parseInlineStringArray(value));
        continue;
      }
    }

    const listLine = line
      .replace(/^[-*]\s+/, "")
      .replace(/^\d+\.\s+/, "")
      .trim();
    if (listLine.length === 0) {
      continue;
    }

    if (section === "orientationBullets") {
      orientationBullets.push(listLine);
      continue;
    }

    if (section === "playerPrompt") {
      playerPromptParts.push(listLine);
      continue;
    }

    if (section === "secrets") {
      secrets.push(listLine);
      continue;
    }

    if (section === "pacingNotes") {
      pacingNotes.push(listLine);
      continue;
    }

    if (section === "continuityWarnings") {
      continuityWarnings.push(listLine);
      continue;
    }

    if (section === "introProse") {
      introParts.push(listLine);
    }
  }

  const introProse = trimLines(introParts.join("\n")).slice(0, 700);
  const normalizedBullets = uniqueStrings(orientationBullets).slice(0, 4);
  const playerPrompt = trimLines(playerPromptParts.join("\n")).slice(0, 320);
  const normalizedSecrets = uniqueStrings(secrets);
  const normalizedPacingNotes = uniqueStrings(pacingNotes);
  const normalizedContinuityWarnings = uniqueStrings(continuityWarnings);

  if (introProse.length === 0 && normalizedBullets.length === 0) {
    return null;
  }

  return {
    introProse: introProse.length > 0 ? introProse : undefined,
    orientationBullets: normalizedBullets,
    playerPrompt: playerPrompt.length > 0 ? playerPrompt : undefined,
    tension,
    secrets: normalizedSecrets,
    pacingNotes: normalizedPacingNotes,
    continuityWarnings: normalizedContinuityWarnings,
  };
};

export const parseLooseActionResponse = (
  raw: string,
): LooseActionResponse | null => {
  const records = parseLooseKeyValueRecords(raw);
  const text =
    records.scalars.get("text") ?? records.scalars.get("narration") ?? "";
  const parsedText = trimLines(text);
  if (parsedText.length === 0) {
    return null;
  }

  const closeScene = parseLooseBoolean(records.scalars.get("closescene"));
  const sceneSummary = records.scalars.get("scenesummary");
  const tension = parseLooseNumber(records.scalars.get("tension"));

  return {
    text: parsedText,
    closeScene,
    sceneSummary: sceneSummary ? trimLines(sceneSummary) : undefined,
    tension:
      tension !== undefined ? Math.max(0, Math.min(100, tension)) : undefined,
    secrets: readList(records, "secrets"),
    pacingNotes: readList(records, "pacingNotes"),
    continuityWarnings: readList(records, "continuityWarnings"),
  };
};

export const parseLooseSceneReaction = (
  raw: string,
): LooseSceneReaction | null => {
  const records = parseLooseKeyValueRecords(raw);
  const goalStatusRaw = records.scalars.get("goalstatus");
  const tensionShiftRaw = records.scalars.get("tensionshift");
  const sceneModeRaw = records.scalars.get("scenemode");
  const tensionBandRaw = records.scalars.get("tensionband");
  const goalStatus = goalStatusRaw && (
    goalStatusRaw === "advanced" ||
    goalStatusRaw === "completed" ||
    goalStatusRaw === "blocked"
  )
    ? goalStatusRaw
    : undefined;
  const tensionShift = tensionShiftRaw && (
    tensionShiftRaw === "rise" ||
    tensionShiftRaw === "fall" ||
    tensionShiftRaw === "stable"
  )
    ? tensionShiftRaw
    : undefined;
  const sceneMode = sceneModeRaw && (
    sceneModeRaw === "low_tension" ||
    sceneModeRaw === "high_tension"
  )
    ? sceneModeRaw
    : undefined;
  const tensionBand = tensionBandRaw && (
    tensionBandRaw === "low" ||
    tensionBandRaw === "medium" ||
    tensionBandRaw === "high"
  )
    ? tensionBandRaw
    : undefined;

  const reaction: LooseSceneReaction = {
    npcBeat: records.scalars.get("npcbeat"),
    consequence: records.scalars.get("consequence"),
    reward: records.scalars.get("reward"),
    goalStatus,
    failForward: parseLooseBoolean(records.scalars.get("failforward")),
    tensionShift,
    tensionDelta: parseLooseNumber(records.scalars.get("tensiondelta")),
    sceneMode,
    turnOrderRequired: parseLooseBoolean(records.scalars.get("turnorderrequired")),
    tensionBand,
    closeScene: parseLooseBoolean(records.scalars.get("closescene")),
    sceneSummary: records.scalars.get("scenesummary"),
    tension: parseLooseNumber(records.scalars.get("tension")),
    tensionReason: records.scalars.get("tensionreason"),
    reasoning: readList(records, "reasoning"),
    pacingNotes: readList(records, "pacingNotes"),
    continuityWarnings: readList(records, "continuityWarnings"),
  };

  const hasUsefulField = Boolean(
    reaction.npcBeat ||
      reaction.consequence ||
      reaction.reward ||
      reaction.goalStatus ||
      reaction.tensionShift ||
      reaction.sceneMode ||
      reaction.turnOrderRequired !== undefined ||
      reaction.tensionBand ||
      reaction.tension !== undefined ||
      reaction.tensionDelta !== undefined ||
      reaction.tensionReason ||
      reaction.reasoning?.length ||
      reaction.pacingNotes?.length ||
      reaction.continuityWarnings?.length ||
      reaction.closeScene !== undefined ||
      reaction.sceneSummary,
  );

  return hasUsefulField ? reaction : null;
};

export const parseLooseOutcomeCheckDecision = (
  raw: string,
): LooseOutcomeCheckDecision | null => {
  const records = parseLooseKeyValueRecords(raw);
  const intentRaw = records.scalars.get("intent");
  const responseModeRaw = records.scalars.get("responsemode");
  const detailLevelRaw = records.scalars.get("detaillevel");
  const reason =
    records.scalars.get("reason") ?? records.scalars.get("rationale");

  const intent = intentRaw && (
    intentRaw === "information_request" || intentRaw === "direct_action"
  )
    ? intentRaw
    : undefined;
  const responseMode = responseModeRaw && (
    responseModeRaw === "concise" || responseModeRaw === "expanded"
  )
    ? responseModeRaw
    : undefined;
  const detailLevel = detailLevelRaw && (
    detailLevelRaw === "concise" ||
    detailLevelRaw === "standard" ||
    detailLevelRaw === "expanded"
  )
    ? detailLevelRaw
    : undefined;
  const shouldCheck = parseLooseBoolean(records.scalars.get("shouldcheck"));
  const allowHardDenyWithoutOutcomeCheck = parseLooseBoolean(
    records.scalars.get("allowharddenywithoutoutcomecheck"),
  );
  const hardDenyReason = records.scalars.get("harddenyreason");
  const threat = parseLooseBoolean(records.scalars.get("threat"));
  const uncertainty = parseLooseBoolean(records.scalars.get("uncertainty"));
  const highReward = parseLooseBoolean(records.scalars.get("highreward"));

  const hasUsefulField = Boolean(
    intent ||
      responseMode ||
      detailLevel ||
      shouldCheck !== undefined ||
      reason ||
      allowHardDenyWithoutOutcomeCheck !== undefined ||
      hardDenyReason ||
      threat !== undefined ||
      uncertainty !== undefined ||
      highReward !== undefined,
  );

  if (!hasUsefulField) {
    return null;
  }

  return {
    intent,
    responseMode,
    detailLevel,
    shouldCheck,
    reason: reason ? trimLines(reason) : undefined,
    allowHardDenyWithoutOutcomeCheck,
    hardDenyReason,
    triggers: {
      threat,
      uncertainty,
      highReward,
    },
  };
};

export const parseJson = <T>(raw: string, schema: z.ZodType<T>): T | null => {
  const candidate = extractJsonCandidate(raw);
  if (!candidate) {
    return null;
  }

  try {
    const parsed = JSON.parse(candidate) as unknown;
    return schema.parse(parsed);
  } catch {
    return null;
  }
};
