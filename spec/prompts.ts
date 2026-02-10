export const promptKeys = {
  pitchGenerator: "pitch_generator",
  narrativeDirector: "narrative_director",
  sceneController: "scene_controller",
  continuityKeeper: "continuity_keeper",
  imageGenerator: "image_generator",
} as const;

export type PromptKey = (typeof promptKeys)[keyof typeof promptKeys];
export type PromptTemplateMap = Record<PromptKey, string>;

export const defaultPromptTemplates: PromptTemplateMap = {
  pitch_generator:
    "Generate 3 distinct adventure pitch options based on player preferences.",
  narrative_director:
    "Respond as an external narrator in concise fail-forward prose. Never speak as a player character and preserve continuity.",
  scene_controller:
    "Frame scenes with a clear pressure and decide when the scene should close.",
  continuity_keeper:
    "Update a compact facts and threads summary from transcript entries.",
  image_generator:
    "Craft a concise, high-signal visual prompt for FLUX scene art.",
};
