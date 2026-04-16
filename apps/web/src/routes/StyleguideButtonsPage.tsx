import { Link } from "react-router-dom";
import { Button } from "../components/common/Button";
import { CTAButton } from "../components/common/CTAButton";
import { Heading } from "../components/common/Heading";
import { Label } from "../components/common/Label";
import { Panel } from "../components/common/Panel";
import { Text } from "../components/common/Text";
import { StyleguideSectionNav } from "../components/styleguide/StyleguideSectionNav";

const buttonColors = ["gold", "cloth", "bone", "fire"] as const;

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
          Validate the core button API here. The rows below check size, color,
          variant, and the slanted CTA wrapper without mixing in other control
          families.
        </Text>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel as="section" tone="bone" contentClassName="stack gap-4">
          <div className="stack gap-1">
            <Text variant="h3" color="iron">
              Button size ladder
            </Text>
            <Text variant="body" color="iron-light" className="text-sm">
              Use the shared `sm`, `md`, and `lg` sizes so buttons line up with
              inputs and other controls.
            </Text>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm" color="gold">
              Small
            </Button>
            <Button size="md" color="gold">
              Medium
            </Button>
            <Button size="lg" color="gold">
              Large
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {buttonColors.map((color) => (
              <Button key={color} size="md" color={color}>
                {color}
              </Button>
            ))}
          </div>
        </Panel>

        <Panel as="section" tone="cloth" contentClassName="stack gap-4">
          <div className="stack gap-1">
            <Text variant="h3" color="iron">
              Variant samples
            </Text>
            <Text variant="body" color="iron-light" className="text-sm">
              Solid, ghost, and circle buttons all share the same sizing API
              now, so you can swap variants without breaking the rhythm.
            </Text>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="solid" color="cloth">
              Solid
            </Button>
            <Button variant="ghost" color="cloth">
              Ghost
            </Button>
            <Button variant="circle" color="cloth" size="sm" aria-label="Add">
              +
            </Button>
            <Button variant="circle" color="cloth" size="md" aria-label="Add">
              +
            </Button>
            <Button variant="circle" color="cloth" size="lg" aria-label="Add">
              +
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="ghost" color="gold">
              Gold
            </Button>
            <Button variant="ghost" color="fire">
              Fire
            </Button>
            <Button variant="ghost" color="bone">
              Bone
            </Button>
            <Button variant="ghost" color="monster">
              Monster
            </Button>
          </div>
        </Panel>
      </div>

      <Panel as="section" tone="gold" contentClassName="stack gap-4">
        <div className="stack gap-1">
          <Text variant="h3" color="iron">
            CTAButton wrapper
          </Text>
          <Text variant="body" color="iron-light" className="text-sm">
            `CTAButton` layers the skewed hero treatment on top of the shared
            `Button` primitive for strong primary actions.
          </Text>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <CTAButton color="gold" size="md">
            Primary CTA
          </CTAButton>
          <CTAButton color="cloth" size="sm">
            Secondary CTA
          </CTAButton>
        </div>
      </Panel>

      <Panel as="section" tone="bone" contentClassName="stack gap-2">
        <Text variant="h3" color="iron">
          Where to use it
        </Text>
        <Text variant="body" color="iron-light" className="text-sm">
          Use `Button` for the standard action surfaces in forms, dialogs, and
          toolbars. Reach for `CTAButton` when the action should carry extra
          visual weight and a more heroic presentation.
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
