import { useState } from "react";
import { Link } from "react-router-dom";
import { Heading } from "../components/common/Heading";
import { Panel } from "../components/common/Panel";
import { StepNavigation, type StepNavigationStep } from "../components/common/StepNavigation";
import { Text } from "../components/common/Text";
import { StyleguideSectionNav } from "../components/styleguide/StyleguideSectionNav";

const steps: readonly StepNavigationStep[] = [
  { id: "start", label: "Start" },
  { id: "invite", label: "Invite" },
  { id: "choose", label: "Choose" },
  { id: "play", label: "Play" },
];

export const StyleguideStepNavigationPage = (): JSX.Element => {
  const [clickableStep, setClickableStep] = useState("invite");

  return (
    <div className="styleguide-step-navigation-page app-shell stack gap-6 py-8">
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
            className: "left-1/2 bottom-[0.08em] h-[0.5em] w-[calc(100%+0.22em)] -translate-x-1/2",
          }}
        >
          Step Navigation
        </Heading>
        <Text variant="body" color="iron-light" className="max-w-3xl text-sm">
          Use progress steps for a short, ordered flow. Keep them as links when
          they navigate; use buttons only when changing the visible step in place.
        </Text>
      </div>

      <Panel as="section" tone="bone" contentClassName="stack gap-5">
        <div className="stack gap-1">
          <Text variant="h3" color="iron">Progress states</Text>
          <Text variant="body" color="iron-light" className="text-sm">
            Completed steps are Cloth, the current step carries the semantic accent,
            and upcoming steps stay Bone and Steel.
          </Text>
        </div>
        <div className="stack gap-6">
          {(["start", "choose", "play"] as const).map((currentStep) => (
            <div key={currentStep} className="stack gap-2">
              <Text variant="note" color="iron-light" className="text-xs uppercase">
                Current: {currentStep}
              </Text>
              <StepNavigation steps={steps} currentStep={currentStep} color="gold" />
            </div>
          ))}
        </div>
      </Panel>

      <Panel as="section" tone="cloth" contentClassName="stack gap-5">
        <div className="stack gap-1">
          <Text variant="h3" color="iron">Clickable and display-only</Text>
          <Text variant="body" color="iron-light" className="text-sm">
            This interactive lab changes its visible step in place. The second
            example intentionally remains read-only status, without fake controls.
          </Text>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="stack gap-2">
            <Text variant="note" color="iron-light" className="text-xs uppercase">
              Clickable
            </Text>
            <StepNavigation
              steps={steps}
              currentStep={clickableStep}
              color="monster"
              onStepChange={setClickableStep}
            />
          </div>
          <div className="stack gap-2">
            <Text variant="note" color="iron-light" className="text-xs uppercase">
              Display-only
            </Text>
            <StepNavigation steps={steps} currentStep="choose" color="gold" />
          </div>
        </div>
      </Panel>

      <Panel as="section" tone="bone" contentClassName="stack gap-4">
        <div className="stack gap-1">
          <Text variant="h3" color="iron">Compact mobile layout</Text>
          <Text variant="body" color="iron-light" className="text-sm">
            Narrow containers switch to a two-column grid, retaining readable labels
            without a cramped connector line.
          </Text>
        </div>
        <div className="max-w-xs">
          <StepNavigation steps={steps} currentStep="invite" color="monster" />
        </div>
      </Panel>

      <Link
        to="/styleguide"
        className="inline-flex items-center gap-2 self-start font-ui text-sm font-bold uppercase tracking-[0.08em] text-kac-iron transition hover:text-kac-blood-dark"
      >
        <span aria-hidden="true">&larr;</span>
        Back to Overview
      </Link>
    </div>
  );
};
