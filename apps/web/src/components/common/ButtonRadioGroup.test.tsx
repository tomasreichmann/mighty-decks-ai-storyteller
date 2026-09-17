import assert from "node:assert/strict";
import test from "node:test";
import TestRenderer, { act } from "react-test-renderer";
import { ButtonRadioGroup } from "./ButtonRadioGroup";

test("ButtonRadioGroup exposes a single-select radio group and changes only to enabled options", () => {
  let renderer: TestRenderer.ReactTestRenderer | null = null;
  const selected: string[] = [];

  act(() => {
    renderer = TestRenderer.create(
      <ButtonRadioGroup
        ariaLabel="Narrative point of view"
        onValueChange={(value) => selected.push(value)}
        options={[
          { label: "First person", value: "first" },
          { label: "Third person", value: "third" },
          { disabled: true, label: "Second person", value: "second" },
        ]}
        value="first"
      />,
    );
  });

  if (!renderer) {
    throw new Error("Renderer was not created");
  }

  const group = (renderer as TestRenderer.ReactTestRenderer).root.findByProps({
    role: "radiogroup",
  });
  assert.equal(group.props["aria-label"], "Narrative point of view");

  const radios = group.findAll(
    (node) => node.type === "button" && node.props.role === "radio",
  );
  assert.equal(radios.length, 3);
  assert.deepEqual(
    radios.map((radio) => radio.props["aria-checked"]),
    [true, false, false],
  );
  assert.deepEqual(
    radios.map((radio) => radio.props.tabIndex),
    [0, -1, -1],
  );
  assert.equal(radios[2]?.props.disabled, true);

  act(() => {
    radios[1]?.props.onClick();
    radios[0]?.props.onClick();
    radios[2]?.props.onClick();
  });

  assert.deepEqual(selected, ["third"]);
});
