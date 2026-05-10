import type { ButtonColors } from "../common/Button";
import { Token, type TokenColor, type TokenSize } from "../common/Token";

interface ActorTokenProps {
  label: string;
  imageUrl: string;
  tone?: ButtonColors;
  size?: TokenSize;
  className?: string;
}

const actorTokenToneMap: Record<ButtonColors, TokenColor> = {
  steel: "steel",
  "steel-light": "steel",
  "steel-dark": "steel",
  iron: "iron",
  "iron-light": "iron",
  "iron-dark": "iron",
  blood: "blood",
  "blood-light": "blood",
  "blood-lighter": "blood",
  "blood-lightest": "blood",
  "blood-dark": "blood",
  fire: "fire",
  "fire-light": "fire",
  "fire-lightest": "fire",
  "fire-dark": "fire",
  bone: "bone",
  "bone-light": "bone",
  "bone-dark": "bone",
  "bone-darker": "bone",
  skin: "skin",
  "skin-light": "skin",
  "skin-dark": "skin",
  gold: "gold",
  "gold-light": "gold",
  "gold-dark": "gold",
  "gold-darker": "gold",
  cloth: "cloth",
  "cloth-light": "cloth",
  "cloth-lightest": "cloth",
  "cloth-dark": "cloth",
  curse: "curse",
  "curse-light": "curse",
  "curse-lighter": "curse",
  "curse-lightest": "curse",
  "curse-dark": "curse",
  monster: "monster",
  "monster-light": "monster",
  "monster-lightest": "monster",
  "monster-dark": "monster",
};

export const ActorToken = ({
  label,
  imageUrl,
  tone = "gold",
  size = "md",
  className = "",
}: ActorTokenProps): JSX.Element => {
  return (
    <Token
      className={`actor-token ${className}`.trim()}
      color={actorTokenToneMap[tone]}
      imageAlt={label}
      imageUrl={imageUrl}
      label={label}
      size={size}
    />
  );
};
