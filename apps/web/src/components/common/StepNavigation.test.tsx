import assert from "node:assert/strict";
import test from "node:test";
import TestRenderer, { act } from "react-test-renderer";
import { StepNavigation } from "./StepNavigation";

const steps = [
  { id: "start", label: "Start", href: "/start" },
  { id: "invite", label: "Invite", href: "/invite" },
  { id: "choose", label: "Choose" },
  { id: "play", label: "Play", disabled: true },
];

test("StepNavigation exposes linked progress and the current step semantically", () => {
  let renderer: TestRenderer.ReactTestRenderer | null = null;

  act(() => {
    renderer = TestRenderer.create(
      <StepNavigation steps={steps} currentStep="invite" />, 
    );
  });

  if (!renderer) {
    throw new Error("Renderer was not created");
  }

  const root = (renderer as TestRenderer.ReactTestRenderer).root;
  const nav = root.findByType("nav");
  assert.equal(nav.props["aria-label"], "Progress");

  const links = root.findAllByType("a");
  assert.deepEqual(links.map((link) => link.props.href), ["/start", "/invite"]);
  assert.equal(links[1]?.props["aria-current"], "step");

  const statusItems = root.findAllByProps({ "data-step-kind": "status" });
  assert.equal(statusItems.length, 2);
  assert.equal(statusItems[1]?.props["aria-disabled"], true);
  assert.equal(statusItems[1]?.props.tabIndex, undefined);
});

test("StepNavigation makes steps buttons only when an explicit change handler is provided", () => {
  let renderer: TestRenderer.ReactTestRenderer | null = null;
  const changedSteps: string[] = [];

  act(() => {
    renderer = TestRenderer.create(
      <StepNavigation
        steps={steps}
        currentStep="start"
        onStepChange={(stepId) => changedSteps.push(stepId)}
      />,
    );
  });

  if (!renderer) {
    throw new Error("Renderer was not created");
  }

  const root = (renderer as TestRenderer.ReactTestRenderer).root;
  const chooseButton = root.findAllByType("button").find((button) =>
    button.findAll(
      (node) =>
        typeof node.props.className === "string" &&
        node.props.className.includes("step-navigation__label") &&
        node.children.join("") === "Choose",
    ).length > 0,
  );
  if (!chooseButton) {
    throw new Error("Choose button was not rendered");
  }

  act(() => {
    chooseButton.props.onClick();
  });

  assert.deepEqual(changedSteps, ["choose"]);
  assert.equal(root.findAllByType("button").length, 1);
});
