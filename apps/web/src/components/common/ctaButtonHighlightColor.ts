import type { ButtonColors } from "./Button";

const colorMap: Record<ButtonColors, ButtonColors> = {
  steel: "steel-dark",
  "steel-light": "steel-dark",
  "steel-dark": "steel-dark",
  iron: "iron-light",
  "iron-light": "iron-light",
  "iron-dark": "iron-light",
  blood: "blood-light",
  "blood-light": "blood-light",
  "blood-lighter": "blood-light",
  "blood-lightest": "blood-light",
  "blood-dark": "blood-light",
  fire: "fire-light",
  "fire-light": "fire-light",
  "fire-lightest": "fire-light",
  "fire-dark": "fire-light",
  bone: "bone-light",
  "bone-light": "bone-light",
  "bone-dark": "bone-light",
  "bone-darker": "bone-light",
  skin: "skin-light",
  "skin-light": "skin-light",
  "skin-dark": "skin-light",
  gold: "gold-dark",
  "gold-light": "gold-dark",
  "gold-dark": "gold-dark",
  "gold-darker": "gold-dark",
  cloth: "cloth-light",
  "cloth-light": "cloth-light",
  "cloth-lightest": "cloth-light",
  "cloth-dark": "cloth-light",
  curse: "curse-light",
  "curse-light": "curse-light",
  "curse-lighter": "curse-light",
  "curse-lightest": "curse-light",
  "curse-dark": "curse-light",
  monster: "monster-dark",
  "monster-light": "monster-dark",
  "monster-lightest": "monster-dark",
  "monster-dark": "monster-dark",
};

export const resolveCTAButtonHighlightColor = (
  color: ButtonColors,
): ButtonColors => {
  return colorMap[color] ?? "gold-dark";
};
