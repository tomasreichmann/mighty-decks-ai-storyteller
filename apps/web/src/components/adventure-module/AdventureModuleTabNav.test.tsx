import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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
  assert.match(markup, /text-\[1\.8rem\]/);
  assert.doesNotMatch(markup, /Base/);
  assert.doesNotMatch(markup, /Quests/);
});

test("AdventureModuleTabNav orders compact menu chrome between leading and trailing content", () => {
  const source = readFileSync(
    new URL("./AdventureModuleTabNav.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /className="order-1 shrink-0"/);
  assert.match(source, /className="order-2 lg:order-4 lg:hidden"/);
  assert.match(source, /className="order-3 shrink-0 ml-auto lg:ml-0 lg:order-3"/);
  assert.match(source, /className="order-4 hidden min-w-0 flex-1 lg:order-2 lg:flex"/);
});

test("AdventureModuleSectionMenu raises its dropdown above authoring editor chrome", () => {
  const source = readFileSync(
    new URL("./AdventureModuleTabNav.tsx", import.meta.url),
    "utf8",
  );

  assert.match(
    source,
    /menuClassName="z-50 w-fit min-w-\[12rem\] max-w-\[calc\(100vw-1rem\)\] rounded-sm border-2/,
  );
});
