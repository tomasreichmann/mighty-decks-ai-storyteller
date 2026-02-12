import { ElementType, PropsWithChildren } from "react";
import { cn } from "../../utils/cn";

export type TextVariant =
  | "h1"
  | "h2"
  | "h3"
  | "body"
  | "quote"
  | "note"
  | "emphasised";

export type TextColor =
  | "inherit"
  | "iron"
  | "iron-light"
  | "iron-dark"
  | "steel"
  | "steel-light"
  | "steel-dark"
  | "gold"
  | "gold-dark"
  | "bone"
  | "fire"
  | "cloth"
  | "curse"
  | "monster"
  | "blood"
  | "paper";

interface TextProps extends PropsWithChildren {
  variant?: TextVariant;
  color?: TextColor;
  as?: ElementType;
  className?: string;
}

const variantClassMap: Record<TextVariant, string> = {
  h1: "font-heading font-bold text-4xl/none sm:text-5xl/none tracking-tight transform rotate(1deg) skewX(-5deg) ",
  h2: "font-heading font-bold text-3xl/none sm:text-4xl/none tracking-tight",
  h3: "font-heading font-bold text-2xl/none sm:text-3xl/none tracking-tight",
  body: "font-ui text-base leading-relaxed",
  emphasised: "font-heading text-base font-bold leading-tight",
  quote: "font-ui text-lg italic leading-relaxed",
  note: "font-ui text-xs leading-snug opacity-70",
};

const variantTagMap: Record<TextVariant, ElementType> = {
  h1: "h1",
  h2: "h2",
  h3: "h3",
  body: "p",
  emphasised: "p",
  quote: "blockquote",
  note: "p",
};

const colorClassMap: Record<TextColor, string> = {
  iron: "text-kac-iron",
  "iron-light": "text-kac-iron-light",
  "iron-dark": "text-kac-iron-dark",
  steel: "text-kac-steel",
  "steel-light": "text-kac-steel-light",
  "steel-dark": "text-kac-steel-dark",
  gold: "text-kac-gold",
  "gold-dark": "text-kac-gold-darker",
  bone: "text-kac-bone-dark",
  fire: "text-kac-fire-dark",
  cloth: "text-kac-cloth-dark",
  curse: "text-kac-curse-dark",
  monster: "text-kac-monster-dark",
  blood: "text-kac-blood",
  paper: "text-paper",
  inherit: "",
};

export const Text = ({
  variant = "body",
  color = "inherit",
  as,
  className = "",
  children,
}: TextProps): JSX.Element => {
  const Component = as ?? variantTagMap[variant];

  return (
    <Component
      className={cn(variantClassMap[variant], colorClassMap[color], className)}
    >
      {children}
    </Component>
  );
};
