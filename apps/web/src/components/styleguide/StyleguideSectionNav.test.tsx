import assert from "node:assert/strict";
import test from "node:test";
import { MemoryRouter } from "react-router-dom";
import TestRenderer, { act } from "react-test-renderer";
import { StyleguideSectionNav } from "./StyleguideSectionNav";

test("StyleguideSectionNav exposes the active Colors catalog entry", () => {
  let renderer!: TestRenderer.ReactTestRenderer;

  act(() => {
    renderer = TestRenderer.create(
      <MemoryRouter initialEntries={["/styleguide/colors"]}>
        <StyleguideSectionNav />
      </MemoryRouter>,
    );
  });

  const links = renderer.root.findAllByType("a");
  const colorLink = links.find((link) => link.props.href === "/styleguide/colors");

  assert.ok(colorLink, "the Colors catalog entry should be available in the navigation");
  assert.equal(colorLink.props["aria-current"], "page");
  assert.match(colorLink.props.className, /highlight-action/);
  assert.equal(
    colorLink.findByProps({ className: "highlight-action__label" }).children.join(""),
    "Colors",
  );
});

test("StyleguideSectionNav exposes the available Media catalog entry", () => {
  let renderer!: TestRenderer.ReactTestRenderer;

  act(() => {
    renderer = TestRenderer.create(
      <MemoryRouter initialEntries={["/styleguide"]}>
        <StyleguideSectionNav />
      </MemoryRouter>,
    );
  });

  const links = renderer.root.findAllByType("a");

  assert.equal(links.some((link) => link.props.href === "/styleguide/media"), true);
});
