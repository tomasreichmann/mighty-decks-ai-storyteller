import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";

import {
  AdventureModuleSectionMenu,
} from "./AdventureModuleTabNav";

test("AdventureModuleSectionMenu shows the active section name in the trigger", () => {
  const markup = renderToStaticMarkup(
    React.createElement(
      StaticRouter,
      {
        location: "/adventure-module/aurora-spire/storyteller-info/editor",
      },
      React.createElement(AdventureModuleSectionMenu, {
        moduleSlug: "aurora-spire",
        tabs: [
          { id: "base", label: "Base" },
          { id: "storyteller-info", label: "Storyteller Info" },
          { id: "quests", label: "Quests" },
        ],
      }),
    ),
  );

  assert.match(markup, /Open adventure module sections menu: Storyteller Info/);
  assert.match(markup, />\s*Storyteller Info\s*</);
  assert.match(markup, /\u25b8/);
  assert.doesNotMatch(markup, /Base/);
  assert.doesNotMatch(markup, /Quests/);
});
