import type { ButtonColors } from "./Button";

const colorMap: Record<ButtonColors, ButtonColors> = {
  steel: "steel-light",
  "steel-light": "steel-light",
  "steel-dark": "steel-light",
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
  gold: "gold-light",
  "gold-light": "gold-light",
  "gold-dark": "gold-light",
  "gold-darker": "gold-light",
  cloth: "cloth-light",
  "cloth-light": "cloth-light",
  "cloth-lightest": "cloth-light",
  "cloth-dark": "cloth-light",
  curse: "curse-light",
  "curse-light": "curse-light",
  "curse-lighter": "curse-light",
  "curse-lightest": "curse-light",
  "curse-dark": "curse-light",
  monster: "monster-light",
  "monster-light": "monster-light",
  "monster-lightest": "monster-light",
  "monster-dark": "monster-light",
};

export const resolveCTAButtonHighlightColor = (
  color: ButtonColors,
): ButtonColors => {
  return colorMap[color] ?? "gold-light";
};
