import type { SceneDebug, ScenePublic } from "@mighty-decks/spec/adventureState";
import type { PitchInput, PitchOption } from "./types";
import { trimLines } from "./text";

export const DEFAULT_ORIENTATION_BULLETS = [
  "Goal: establish a concrete advantage before the situation worsens.",
  "Pressure: complications escalate if the group hesitates.",
  "Exits: risky direct move, careful investigation, or negotiated detour.",
];

export const buildFallbackScenePlayerPrompt = (partyMembers: string[]): string => {
  const namedParty = partyMembers
    .map((member) => member.trim())
    .filter((member) => member.length > 0)
    .slice(0, 5);
  const partyHint = namedParty.length > 0 ? ` (${namedParty.join(", ")})` : "";
  return `Each player${partyHint}, state why your character cares about this scene, then take one concrete action now.`;
};

export const normalizeImagePrompt = (raw: string): string =>
  trimLines(
    raw
      .replace(/^prompt\s*:\s*/i, "")
      .replace(/^```(?:text)?/i, "")
      .replace(/```$/i, ""),
  ).slice(0, 900);

export const buildFallbackImagePrompt = (scene: ScenePublic): string => {
  const bulletHints = scene.orientationBullets.slice(0, 3).join(" ");
  const summaryHint = scene.summary
    ? `Resolution moment: ${scene.summary}`
    : "";
  return trimLines(
    [
      "Cinematic fantasy illustration, no text overlay, no logo, no watermark.",
      `Primary moment: ${scene.introProse}`,
      summaryHint,
      `Scene cues: ${bulletHints}`,
      "Moody volumetric lighting, rich environmental detail, dynamic composition, painterly realism.",
    ].join(" "),
  ).slice(0, 900);
};

export const toDebugState = (source: {
  tension?: number;
  secrets?: string[];
  pacingNotes?: string[];
  continuityWarnings?: string[];
}): SceneDebug => ({
  tension: source.tension,
  secrets: source.secrets ?? [],
  pacingNotes: source.pacingNotes ?? [],
  continuityWarnings: source.continuityWarnings ?? [],
  aiRequests: [],
  recentDecisions: [],
});

export const buildFallbackPitches = (inputs: PitchInput[]): PitchOption[] => {
  const preferenceHints = inputs
    .map((input) => input.adventurePreference.trim())
    .filter((value) => value.length > 0);
  const mergedHint =
    preferenceHints[0] ?? "tense mystery with escalating pressure";

  return [
    {
      title: "The Salt Clock",
      description: `A coastal city loses its tidal heartbeat overnight. The party must restore the clock before dawn while rival crews exploit the chaos. Tone hint: ${mergedHint}.`,
    },
    {
      title: "Ash Market",
      description:
        "At a midnight bazaar where memories are currency, someone is buying tomorrow's disasters in advance. The party must uncover who profits before the district burns.",
    },
    {
      title: "Lanterns Below",
      description:
        "An underground rail line starts delivering empty trains with fresh mud and unknown symbols. The party descends to trace the route before the next departure arrives occupied.",
    },
  ];
};
