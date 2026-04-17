import type { ButtonColors } from "./Button";

export type HighlightColor = ButtonColors;

const colorClassMap: Record<HighlightColor, string> = {
  steel: "text-kac-steel-light",
  "steel-light": "text-kac-steel-light",
  "steel-dark": "text-kac-steel-dark",
  iron: "text-kac-iron",
  "iron-light": "text-kac-iron-light",
  "iron-dark": "text-kac-iron-dark",
  blood: "text-kac-blood-light",
  "blood-light": "text-kac-blood-light",
  "blood-lighter": "text-kac-blood-lighter",
  "blood-lightest": "text-kac-blood-lightest",
  "blood-dark": "text-kac-blood-dark",
  fire: "text-kac-fire-light",
  "fire-light": "text-kac-fire-light",
  "fire-lightest": "text-kac-fire-lightest",
  "fire-dark": "text-kac-fire-dark",
  bone: "text-kac-bone-light",
  "bone-light": "text-kac-bone-light",
  "bone-dark": "text-kac-bone-dark",
  "bone-darker": "text-kac-bone-darker",
  skin: "text-kac-skin-light",
  "skin-light": "text-kac-skin-light",
  "skin-dark": "text-kac-skin-dark",
  gold: "text-kac-gold",
  "gold-light": "text-kac-gold-light",
  "gold-dark": "text-kac-gold-dark",
  "gold-darker": "text-kac-gold-darker",
  cloth: "text-kac-cloth-light",
  "cloth-light": "text-kac-cloth-light",
  "cloth-lightest": "text-kac-cloth-lightest",
  "cloth-dark": "text-kac-cloth-dark",
  curse: "text-kac-curse-light",
  "curse-light": "text-kac-curse-light",
  "curse-lighter": "text-kac-curse-lighter",
  "curse-lightest": "text-kac-curse-lightest",
  "curse-dark": "text-kac-curse-dark",
  monster: "text-kac-monster-light",
  "monster-light": "text-kac-monster-light",
  "monster-lightest": "text-kac-monster-lightest",
  "monster-dark": "text-kac-monster-dark",
};

export const resolveHeadingHighlightColorClass = (
  color: HighlightColor,
): string => {
  return colorClassMap[color] ?? colorClassMap.gold;
};
