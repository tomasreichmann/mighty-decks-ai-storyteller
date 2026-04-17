import { Button } from "../components/common/Button";
import { Heading } from "../components/common/Heading";
import { Label } from "../components/common/Label";
import { Panel } from "../components/common/Panel";
import { Text } from "../components/common/Text";
import { StyleguideSectionNav } from "../components/styleguide/StyleguideSectionNav";

const overviewSections = [
  {
    title: "Typography",
    tone: "gold" as const,
    description:
      "Validate the Label, Text, and Heading APIs before you touch the rest of the component surface.",
    href: "/styleguide/typography",
    buttonLabel: "Open Typography Lab",
  },
  {
    title: "Inputs",
    tone: "cloth" as const,
    description:
      "Check TextField and TextArea side by side with matching button heights.",
    href: "/styleguide/inputs",
    buttonLabel: "Open Inputs Lab",
  },
  {
    title: "Buttons",
    tone: "fire" as const,
    description:
      "Review the shared Button API and the CTAButton wrapper in one focused view.",
    href: "/styleguide/buttons",
    buttonLabel: "Open Buttons Lab",
  },
  {
    title: "Panel",
    tone: "bone" as const,
    description:
      "Validate the lighter framed surface before you reach for it in the rest of the app.",
    href: "/styleguide/panel",
    buttonLabel: "Open Panel Lab",
  },
  {
    title: "Cards",
    tone: "bone" as const,
    description:
      "Review the card gallery in one place when you want to compare the supported location, encounter, and quest directions.",
    href: "/styleguide/cards",
    buttonLabel: "Open Card Gallery",
  },
  {
    title: "Tags",
    tone: "cloth" as const,
    description:
      "Review the shared chip primitive, the editable tag field, and the connection status pill in one place.",
    href: "/styleguide/tags",
    buttonLabel: "Open Tag Lab",
  },
  {
    title: "Controls",
    tone: "cloth" as const,
    description:
      "Keep the grouped toggle controls and rocker switches scoped to a single page.",
    href: "/styleguide/controls",
    buttonLabel: "Open Control Lab",
  },
  {
    title: "Session Chat",
    tone: "fire" as const,
    description:
      "Use the session chat overview to jump into the player and storyteller full-screen mocks.",
    href: "/styleguide/session-chat",
    buttonLabel: "Open Session Labs",
  },
] as const;

export const StyleguideIndexPage = (): JSX.Element => {
  return (
    <div className="styleguide-index-page app-shell stack gap-6 py-8">
      <StyleguideSectionNav />

      <div className="stack gap-2">
        <Label color="gold" className="self-start">
          Styleguide
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
          Styleguide
        </Heading>
        <Text variant="body" color="iron-light" className="max-w-3xl text-sm">
          Hidden component playground for scoped iteration. Use the navigation
          to jump between typography, input, button, panel, card, tag, grouped
          control, or session chat labs before you move into broader feature
          work.
        </Text>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {overviewSections.map((section) => (
          <Panel
            key={section.title}
            as="section"
            tone={section.tone}
            contentClassName="stack gap-3"
          >
            <div className="stack gap-1">
              <Text variant="h3" color="iron">
                {section.title}
              </Text>
              <Text variant="body" color="iron-light" className="text-sm">
                {section.description}
              </Text>
            </div>
            <Button href={section.href} color="gold" size="sm">
              {section.buttonLabel}
            </Button>
          </Panel>
        ))}
      </div>

      <Panel as="section" tone="bone" contentClassName="stack gap-2">
        <Text variant="h3" color="iron">
          What moved where
        </Text>
        <Text variant="body" color="iron-light" className="text-sm">
          The old all-in-one landing page now lives on scoped subpages, so
          contributors can open only the lab they are working on and validate
          the API they care about without extra noise.
        </Text>
      </Panel>
    </div>
  );
};
