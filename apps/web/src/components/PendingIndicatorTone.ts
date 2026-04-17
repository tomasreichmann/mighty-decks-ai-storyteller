import type { MessageColor } from "./common/Message";

export interface PendingIndicatorTone {
  labelClassName: string;
  dotClassName: string;
}

export const resolvePendingDotBorderClass = (color: MessageColor): string => {
  switch (color) {
    case "iron":
    case "iron-light":
    case "iron-dark":
      return "border-kac-steel";
    default:
      return "border-kac-iron";
  }
};

export const resolvePendingDotFillClass = (color: MessageColor): string => {
  switch (color) {
    case "gold":
    case "gold-light":
    case "gold-dark":
    case "gold-darker":
      return "bg-kac-gold";
    case "fire":
    case "fire-light":
    case "fire-lightest":
    case "fire-dark":
      return "bg-kac-fire-light";
    case "blood":
    case "blood-light":
    case "blood-lighter":
    case "blood-lightest":
    case "blood-dark":
      return "bg-kac-blood-light";
    case "bone":
    case "bone-light":
    case "bone-dark":
    case "bone-darker":
      return "bg-kac-bone-light";
    case "steel":
    case "steel-light":
    case "steel-dark":
      return "bg-kac-steel-light";
    case "skin":
    case "skin-light":
    case "skin-dark":
      return "bg-kac-skin";
    case "cloth":
    case "cloth-light":
    case "cloth-lightest":
    case "cloth-dark":
      return "bg-kac-cloth-light";
    case "curse":
    case "curse-light":
    case "curse-lighter":
    case "curse-lightest":
    case "curse-dark":
      return "bg-kac-curse-light";
    case "monster":
    case "monster-light":
    case "monster-lightest":
    case "monster-dark":
      return "bg-kac-monster-light";
    case "iron":
    case "iron-light":
    case "iron-dark":
    default:
      return "bg-kac-iron-light";
  }
};

export const resolvePendingIndicatorTone = (
  color: MessageColor,
): PendingIndicatorTone => {
  const dotBorderClassName = resolvePendingDotBorderClass(color);
  const dotFillClassName = resolvePendingDotFillClass(color);

  switch (color) {
    case "cloth-dark":
      return {
        labelClassName: "text-kac-steel-light",
        dotClassName: `${dotFillClassName} ${dotBorderClassName}`,
      };
    case "curse-dark":
      return {
        labelClassName: "text-kac-curse-lightest",
        dotClassName: `${dotFillClassName} ${dotBorderClassName}`,
      };
    case "blood-dark":
      return {
        labelClassName: "text-kac-curse-lightest",
        dotClassName: `${dotFillClassName} ${dotBorderClassName}`,
      };
    case "iron-dark":
    case "steel-dark":
      return {
        labelClassName: "text-kac-steel-light",
        dotClassName: `${dotFillClassName} ${dotBorderClassName}`,
      };
    default:
      return {
        labelClassName: "text-kac-iron-dark",
        dotClassName: `${dotFillClassName} ${dotBorderClassName}`,
      };
  }
};
