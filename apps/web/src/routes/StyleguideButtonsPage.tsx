import { Link } from "react-router-dom";
import { Button, type ButtonColors, type ButtonSize } from "../components/common/Button";
import { CTAButton } from "../components/common/CTAButton";
import { Heading } from "../components/common/Heading";
import { Label, type LabelColor } from "../components/common/Label";
import { Panel } from "../components/common/Panel";
import { Text } from "../components/common/Text";
import { StyleguideSectionNav } from "../components/styleguide/StyleguideSectionNav";

const buttonPalette = [
  { name: "Gold", color: "gold" as const },
  { name: "Cloth", color: "cloth" as const },
  { name: "Bone", color: "bone" as const },
  { name: "Fire", color: "fire" as const },
  { name: "Iron", color: "iron" as const },
  { name: "Steel", color: "steel" as const },
  { name: "Blood", color: "blood" as const },
  { name: "Curse", color: "curse" as const },
  { name: "Monster", color: "monster" as const },
  { name: "Skin", color: "skin" as const },
] as const;

const sizeLadderLabels: Record<ButtonSize, string> = {
  sm: "Small",
  md: "Medium",
  lg: "Large",
};

type ShowcaseKind = "solid" | "cta" | "circle" | "ghost";

const sizeShowcaseCards = [
  {
    name: "Solid",
    kind: "solid" as const,
    sampleColor: "gold" as const,
    description:
      "The shared filled action shell. Use it for default actions and primary choices.",
  },
  {
    name: "CTA",
    kind: "cta" as const,
    sampleColor: "cloth" as const,
    description:
      "The slanted hero wrapper. Use it when the action should feel more editorial and forceful.",
  },
  {
    name: "Circle",
    kind: "circle" as const,
    sampleColor: "iron" as const,
    description:
      "The icon-only control for compact utility actions and small toolbars.",
  },
  {
    name: "Ghost",
    kind: "ghost" as const,
    sampleColor: "steel" as const,
    description:
      "The outlined secondary action with the hard border shadow treatment.",
  },
] as const;

const colorShowcaseRows = [
  {
    name: "Solid",
    kind: "solid" as const,
    description: "The filled button shell across the full palette.",
  },
  {
    name: "CTA",
    kind: "cta" as const,
    description:
      "The slanted CTA wrapper across the full palette, with a family-matched hover highlight.",
  },
  {
    name: "Circle",
    kind: "circle" as const,
    description: "The compact icon-only circle across the full palette.",
  },
  {
    name: "Ghost",
    kind: "ghost" as const,
    description: "The outlined ghost button across the full palette, now including the corrected fire tone.",
  },
] as const;

const resolveLabelColor = (color: ButtonColors): LabelColor =>
  (color === "iron" ? "steel" : color) as LabelColor;

const renderShowcaseButton = (
  kind: ShowcaseKind,
  color: ButtonColors,
  content: string,
  size: ButtonSize,
  options: { ariaLabel?: string; wide?: boolean } = {},
): JSX.Element => {
  const { ariaLabel, wide = false } = options;
  const widthClassName = wide ? "w-full" : "";

  switch (kind) {
    case "solid":
      return (
        <Button variant="solid" color={color} size={size} className={widthClassName}>
          {content}
        </Button>
      );
    case "cta":
      return (
        <CTAButton
          color={color}
          size={size}
          containerClassName={widthClassName}
          className={widthClassName}
        >
          {content}
        </CTAButton>
      );
    case "circle":
      return (
        <Button
          variant="circle"
          color={color}
          size={size}
          aria-label={ariaLabel ?? content}
        >
          {content}
        </Button>
      );
    case "ghost":
      return (
        <Button variant="ghost" color={color} size={size} className={widthClassName}>
          {content}
        </Button>
      );
  }
};

export const StyleguideButtonsPage = (): JSX.Element => {
  return (
    <div className="styleguide-buttons-page app-shell stack gap-6 py-8">
      <StyleguideSectionNav />

      <div className="stack gap-2">
        <Label color="gold" className="self-start">
          Buttons
        </Label>
        <Heading
          level="h1"
          color="iron"
          className="relative z-0 text-[2.4rem] leading-none sm:text-[3.4rem] sm:leading-none"
          highlightProps={{
            color: "gold",
            lineHeight: 8,
            brushHeight: 6,
            lineOffsets: [0, 8, 14, 20],
            className:
              "left-1/2 bottom-[0.08em] h-[0.5em] w-[calc(100%+0.22em)] -translate-x-1/2",
          }}
        >
          Buttons
        </Heading>
        <Text variant="body" color="iron-light" className="max-w-3xl text-sm">
          Validate the core button API here. The rows below show each button
          family at a single representative color for size comparison, then fan
          solid, CTA, circle, and ghost buttons across the full palette without
          mixing in other control families.
        </Text>
      </div>

      <section className="stack gap-4">
        <div className="stack gap-1">
          <Text variant="h3" color="iron">
            Button size ladders
          </Text>
          <Text variant="body" color="iron-light" className="text-sm">
            Each example uses one representative color so you can compare how the
            four button families hold their proportions at `sm`, `md`, and
            `lg`.
          </Text>
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          {sizeShowcaseCards.map((card) => (
            <div key={card.name} className="stack gap-3">
              <Text variant="body" color="iron-light" className="text-xs">
                {card.description}
              </Text>
              <div className="grid gap-3 sm:grid-cols-3">
                {(Object.keys(sizeLadderLabels) as ButtonSize[]).map((size) => (
                  <div key={size} className="stack gap-2">
                    <Label
                      color={resolveLabelColor(card.sampleColor)}
                      size="sm"
                      rotate={false}
                      className="self-start"
                    >
                      {sizeLadderLabels[size]}
                    </Label>
                    {renderShowcaseButton(
                      card.kind,
                      card.sampleColor,
                      card.kind === "circle" ? "+" : card.name,
                      size,
                      {
                        ariaLabel: `${sizeLadderLabels[size]} ${card.name}`,
                      },
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="stack gap-4">
        {colorShowcaseRows.map((row) => (
          <section key={row.name} className="stack gap-4">
            <div className="stack gap-1">
              <Text variant="h3" color="iron">
                {row.name} colors
              </Text>
              <Text variant="body" color="iron-light" className="text-sm">
                {row.description}
              </Text>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {buttonPalette.map((palette) => (
                <div key={palette.name} className="stack gap-2">
                  {renderShowcaseButton(
                    row.kind,
                    palette.color,
                    row.kind === "circle" ? "+" : palette.name,
                    "md",
                    {
                      ariaLabel: `${palette.name} ${row.name.toLowerCase()}`,
                      wide: row.kind !== "circle",
                    },
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <Panel as="section" tone="bone" contentClassName="stack gap-2">
        <Text variant="h3" color="iron">
          Where to use it
        </Text>
        <Text variant="body" color="iron-light" className="text-sm">
          Use `Button` for standard action surfaces in forms, dialogs, and
          toolbars. Reach for `CTAButton` when the action should carry extra
          visual weight, a more heroic presentation, and a family-matched
          hover highlight. Use the size ladders above to keep the shared height
          rhythm intact.
        </Text>
        <Link
          to="/styleguide"
          className="inline-flex items-center gap-2 self-start font-ui text-sm font-bold uppercase tracking-[0.08em] text-kac-iron transition hover:text-kac-blood-dark"
        >
          <span aria-hidden="true">&larr;</span>
          Back to Overview
        </Link>
      </Panel>
    </div>
  );
};
