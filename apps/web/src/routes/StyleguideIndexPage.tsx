import { Heading } from "../components/common/Heading";
import { Label } from "../components/common/Label";
import { Panel } from "../components/common/Panel";
import { Text } from "../components/common/Text";
import { StyleguideSectionNav } from "../components/styleguide/StyleguideSectionNav";

const designPrinciples = [
  {
    title: "Narration first",
    tone: "gold" as const,
    description:
      "Treat the interface like a story tool, not a dashboard. The emotional read should land before the control surface does.",
  },
  {
    title: "Semantic color",
    tone: "cloth" as const,
    description:
      "Use color for meaning, not decoration. The palette should tell the reader what something does before they inspect the copy.",
  },
  {
    title: "Shared primitives",
    tone: "steel" as const,
    description:
      "Prefer Panel, Heading, Text, Label, Tag, Button, TextField, and TextArea before inventing one-off shells.",
  },
  {
    title: "Contrast with restraint",
    tone: "fire" as const,
    description:
      "Reserve Iron for special high-contrast moments, especially when a colored plane gets busy and the message needs to cut through.",
  },
] as const;

const colorFamilies = [
  {
    name: "Gold",
    tone: "gold" as const,
    meaning: "Primary",
    description:
      "Lead accents, the main action, and the strongest emphasis in the system.",
    variants: [
      { token: "gold", hex: "#ffd23b" },
      { token: "gold-light", hex: "#fff5c0" },
      { token: "gold-dark", hex: "#f59d20" },
      { token: "gold-darker", hex: "#c37509" },
    ] as const,
  },
  {
    name: "Cloth",
    tone: "cloth" as const,
    meaning: "Info",
    description:
      "Helpful guidance, supporting context, and explanatory copy that should read as informative.",
    variants: [
      { token: "cloth", hex: "#5c77b2" },
      { token: "cloth-light", hex: "#80a0bc" },
      { token: "cloth-lightest", hex: "#d8e2ea" },
      { token: "cloth-dark", hex: "#32497b" },
    ] as const,
  },
  {
    name: "Bone",
    tone: "bone" as const,
    meaning: "Muted",
    description:
      "Secondary surfaces, quieter text, and anything that should recede instead of compete.",
    variants: [
      { token: "bone", hex: "#ecb87b" },
      { token: "bone-light", hex: "#e4ceb3" },
      { token: "bone-dark", hex: "#a3835f" },
      { token: "bone-darker", hex: "#856a4c" },
    ] as const,
  },
  {
    name: "Fire",
    tone: "fire" as const,
    meaning: "Warning",
    description:
      "Attention, caution, and urgent signals that need a fast read.",
    variants: [
      { token: "fire", hex: "#f50000" },
      { token: "fire-light", hex: "#f88b00" },
      { token: "fire-lightest", hex: "#ffe79b" },
      { token: "fire-dark", hex: "#950101" },
    ] as const,
  },
  {
    name: "Iron",
    tone: "iron" as const,
    meaning: "High contrast",
    description:
      "Special-case accents or text that need to stay legible on colored planes or noisy surfaces.",
    variants: [
      { token: "iron", hex: "#121b23" },
      { token: "iron-light", hex: "#23303d" },
      { token: "iron-dark", hex: "#090f15" },
    ] as const,
  },
  {
    name: "Steel",
    tone: "steel" as const,
    meaning: "Machine",
    description:
      "Technical cues, mechanical surfaces, and system-like feedback.",
    variants: [
      { token: "steel", hex: "#abb4c3" },
      { token: "steel-light", hex: "#f3f3f4" },
      { token: "steel-dark", hex: "#65738b" },
    ] as const,
  },
  {
    name: "Blood",
    tone: "blood" as const,
    meaning: "Destructive",
    description:
      "Removal, irreversible actions, and strong negative consequence.",
    variants: [
      { token: "blood", hex: "#7b001d" },
      { token: "blood-light", hex: "#e3132c" },
      { token: "blood-lighter", hex: "#ff6b6b" },
      { token: "blood-lightest", hex: "#ff9494" },
      { token: "blood-dark", hex: "#541423" },
    ] as const,
  },
  {
    name: "Curse",
    tone: "curse" as const,
    meaning: "Error",
    description:
      "Failures, invalid state, and anything that should read as a problem now.",
    variants: [
      { token: "curse", hex: "#f20170" },
      { token: "curse-light", hex: "#ff6883" },
      { token: "curse-lighter", hex: "#ffc8d1ff" },
      { token: "curse-lightest", hex: "#fff2f2" },
      { token: "curse-dark", hex: "#c10045" },
    ] as const,
  },
  {
    name: "Monster",
    tone: "monster" as const,
    meaning: "Success",
    description:
      "Positive completion, safe success states, and reassuring confirmation.",
    variants: [
      { token: "monster", hex: "#4ec342" },
      { token: "monster-light", hex: "#a4e9a4" },
      { token: "monster-lightest", hex: "#d7ffab" },
      { token: "monster-dark", hex: "#1aa62b" },
    ] as const,
  },
  {
    name: "Skin",
    tone: "skin" as const,
    meaning: "Human",
    description:
      "Personal, warm, and character-facing labels that should feel alive.",
    variants: [
      { token: "skin", hex: "#f7adae" },
      { token: "skin-light", hex: "#f2ced1" },
      { token: "skin-dark", hex: "#e6848c" },
    ] as const,
  },
] as const;

const sharedRules = [
  {
    title: "Panel",
    tone: "gold" as const,
    description:
      "Keep framed surfaces for major blocks only: summaries, route-level sections, and grouped guidance. If the content is just a small subsection, start with spacing first.",
  },
  {
    title: "Heading + Text",
    tone: "cloth" as const,
    description:
      "Use the shared typography primitives for titles, body copy, and helper text instead of restyling raw tags in every route.",
  },
  {
    title: "Label + Tag",
    tone: "steel" as const,
    description:
      "Reserve them for stickers, chips, and live status surfaces. Choose the tone for the meaning, not for decoration.",
  },
  {
    title: "Buttons + inputs",
    tone: "fire" as const,
    description:
      "Use Button for standard actions, CTAButton for the strongest call to action, and TextField or TextArea for typed input. Grouped choices belong in ToggleButton, ButtonRadioGroup, or RockerSwitch.",
  },
] as const;

const componentUseCases = [
  {
    title: "Panel",
    tone: "gold" as const,
    description:
      "Route-level frames, summary blocks, and the main story surface that should feel clearly framed.",
  },
  {
    title: "Heading / Text",
    tone: "cloth" as const,
    description:
      "Page titles, section headers, narrative copy, and helper notes.",
  },
  {
    title: "Label / Tag / ConnectionStatusPill",
    tone: "skin" as const,
    description:
      "Stickers, chips, badges, and live status indicators that need to feel like one family.",
  },
  {
    title: "Button / CTAButton",
    tone: "fire" as const,
    description:
      "Standard actions, confirmations, and the single highest-emphasis call to action.",
  },
  {
    title: "TextField / TextArea",
    tone: "bone" as const,
    description:
      "Names, prompts, descriptions, and other typed narrative input.",
  },
  {
    title: "ToggleButton / ButtonRadioGroup / RockerSwitch",
    tone: "steel" as const,
    description:
      "Grouped choices, binary settings, and segmented state controls.",
  },
] as const;

export const StyleguideIndexPage = (): JSX.Element => {
  return (
    <div className="styleguide-index-page app-shell stack gap-6 py-8">
      <StyleguideSectionNav />

      <div className="stack gap-2">
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
          Styleguide
        </Heading>
        <Text variant="body" color="iron-light" className="max-w-3xl text-sm">
          Use this page as the editorial map for the shared visual system:
          design principles, the complete color-family ledger, and
          shared-component rules before you open the detailed labs above.
        </Text>
      </div>

      <Panel as="section" tone="bone" contentClassName="stack gap-4">
        <div className="stack gap-1">
          <Text variant="h3" color="iron">
            Design principles
          </Text>
          <Text variant="body" color="iron-light" className="text-sm">
            These are the rules that keep the styleguide feeling tactile,
            semantic, and easy to read in a hurry.
          </Text>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {designPrinciples.map((principle) => (
            <div
              key={principle.title}
              className="stack gap-2 rounded-sm border-2 border-kac-iron bg-kac-bone-light/35 p-3 shadow-[2px_2px_0_0_#121b23]"
            >
              <Label color={principle.tone} size="sm" rotate={false} className="self-start">
                {principle.title}
              </Label>
              <Text variant="body" color="iron-light" className="text-sm">
                {principle.description}
              </Text>
            </div>
          ))}
        </div>
      </Panel>

      <section className="stack gap-4">
        <div className="stack gap-1">
          <Text variant="h3" color="iron">
            Color families and swatches
          </Text>
          <Text variant="body" color="iron-light" className="text-sm">
            Treat color as a shared language. Each family below has one job,
            and the swatches below show the exact token hex values used across
            the shared UI primitives.
          </Text>
        </div>
        <div className="stack gap-6">
          {colorFamilies.map((entry) => (
            <div key={entry.name} className="stack gap-4">
              <div className="stack gap-2">
                <Label
                  color={entry.tone === "iron" ? "steel" : entry.tone}
                  size="md"
                  rotate={false}
                  className="self-start"
                >
                  {entry.name}
                </Label>
                <Text variant="emphasised" color="iron">
                  {entry.meaning}
                </Text>
                <Text variant="body" color="iron-light" className="text-sm">
                  {entry.description}
                </Text>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {entry.variants.map((variant) => (
                  <div key={variant.token} className="flex items-center gap-3">
                    <div
                      className="h-16 w-16 shrink-0 rounded-sm border-2 border-kac-iron shadow-[2px_2px_0_0_#121b23]"
                      style={{ backgroundColor: variant.hex }}
                      role="img"
                      aria-label={`${entry.name} ${variant.token} ${variant.hex}`}
                    />
                    <div className="stack gap-0.5 min-w-0">
                      <Text variant="note" color="iron" className="text-xs !opacity-100">
                        {variant.token}
                      </Text>
                      <Text variant="note" color="iron-light" className="text-xs !opacity-100">
                        {variant.hex}
                      </Text>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel as="section" tone="gold" contentClassName="stack gap-4">
          <div className="stack gap-1">
            <Text variant="h3" color="iron">
              Common shared-component rules
            </Text>
            <Text variant="body" color="iron-light" className="text-sm">
              These rules keep the shared surface coherent when new labs or
              routes are added.
            </Text>
          </div>
          <div className="stack gap-3">
            {sharedRules.map((rule) => (
              <div
                key={rule.title}
                className="stack gap-1 border-t border-kac-iron/15 pt-3 first:border-t-0 first:pt-0"
              >
                <Label color={rule.tone} size="sm" rotate={false} className="self-start">
                  {rule.title}
                </Label>
                <Text variant="body" color="iron-light" className="text-sm">
                  {rule.description}
                </Text>
              </div>
            ))}
          </div>
        </Panel>

        <Panel as="section" tone="fire" contentClassName="stack gap-4">
          <div className="stack gap-1">
            <Text variant="h3" color="iron">
              Component use cases
            </Text>
            <Text variant="body" color="iron-light" className="text-sm">
              Reach for these primitives by default when building new surfaces
              so the system stays consistent from page to page.
            </Text>
          </div>
          <div className="stack gap-3">
            {componentUseCases.map((useCase) => (
              <div
                key={useCase.title}
                className="stack gap-1 border-t border-kac-iron/15 pt-3 first:border-t-0 first:pt-0"
              >
                <Label color={useCase.tone} size="sm" rotate={false} className="self-start">
                  {useCase.title}
                </Label>
                <Text variant="body" color="iron-light" className="text-sm">
                  {useCase.description}
                </Text>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel as="section" tone="bone" contentClassName="stack gap-2">
        <Text variant="h3" color="iron">
          How to use this page
        </Text>
        <Text variant="body" color="iron-light" className="text-sm">
          Stay here when you want the rules, tone, and color language that
          govern the system. Open the section nav above when you need the
          detailed component labs themselves.
        </Text>
      </Panel>
    </div>
  );
};
