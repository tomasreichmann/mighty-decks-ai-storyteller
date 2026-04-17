import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("App registers the hidden styleguide routes", () => {
  const source = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");

  assert.match(source, /StyleguideIndexPage/);
  assert.match(source, /StyleguideTypographyPage/);
  assert.match(source, /StyleguideInputsPage/);
  assert.match(source, /StyleguideLoadingPage/);
  assert.match(source, /StyleguideButtonsPage/);
  assert.match(source, /StyleguidePanelPage/);
  assert.match(source, /StyleguideCardsPage/);
  assert.match(source, /StyleguideTagsPage/);
  assert.match(source, /StyleguideControlsPage/);
  assert.match(source, /StyleguideSessionChatPage/);
  assert.match(source, /StyleguideLocationCardPage/);
  assert.match(source, /StyleguideEncounterCardPage/);
  assert.match(source, /StyleguideQuestCardPage/);
  assert.match(source, /StyleguideSessionChatPlayerPage/);
  assert.match(source, /StyleguideSessionChatStorytellerPage/);
  assert.match(source, /RouteShellBoundary/);
  assert.match(source, /path="\/styleguide"/);
  assert.match(source, /path="\/styleguide\/typography"/);
  assert.match(source, /path="\/styleguide\/inputs"/);
  assert.match(source, /path="\/styleguide\/loading"/);
  assert.match(source, /path="\/styleguide\/buttons"/);
  assert.match(source, /path="\/styleguide\/panel"/);
  assert.match(source, /path="\/styleguide\/cards"/);
  assert.match(source, /path="\/styleguide\/tags"/);
  assert.match(source, /path="\/styleguide\/controls"/);
  assert.match(source, /path="\/styleguide\/session-chat"/);
  assert.match(source, /path="location-card"|path="\/styleguide\/location-card"/);
  assert.match(source, /path="encounter-card"|path="\/styleguide\/encounter-card"/);
  assert.match(source, /path="quest-card"|path="\/styleguide\/quest-card"/);
  assert.match(
    source,
    /path="session-chat-player"|path="\/styleguide\/session-chat-player"/,
  );
  assert.match(
    source,
    /path="session-chat-storyteller"|path="\/styleguide\/session-chat-storyteller"/,
  );
  assert.match(
    source,
    /path="\/styleguide\/cards"[\s\S]*<RouteShellBoundary>[\s\S]*<StyleguideCardsPage \/>[\s\S]*<\/RouteShellBoundary>/,
  );
  assert.match(
    source,
    /path="\/styleguide\/loading"[\s\S]*<RouteShellBoundary>[\s\S]*<StyleguideLoadingPage \/>[\s\S]*<\/RouteShellBoundary>/,
  );
  assert.match(
    source,
    /path="\/styleguide\/location-card"[\s\S]*<RouteShellBoundary>[\s\S]*<StyleguideLocationCardPage \/>[\s\S]*<\/RouteShellBoundary>/,
  );
  assert.match(
    source,
    /path="\/styleguide\/encounter-card"[\s\S]*<RouteShellBoundary>[\s\S]*<StyleguideEncounterCardPage \/>[\s\S]*<\/RouteShellBoundary>/,
  );
  assert.match(
    source,
    /path="\/styleguide\/quest-card"[\s\S]*<RouteShellBoundary>[\s\S]*<StyleguideQuestCardPage \/>[\s\S]*<\/RouteShellBoundary>/,
  );
});

test("StyleguideIndexPage documents the scoped styleguide overview", () => {
  const source = readFileSync(
    new URL("./StyleguideIndexPage.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /StyleguideSectionNav/);
  assert.match(source, /styleguide-index-page/);
  assert.match(source, /Typography/);
  assert.match(source, /Inputs/);
  assert.match(source, /Buttons/);
  assert.match(source, /Cards/);
  assert.match(source, /Tags/);
  assert.match(source, /Controls/);
  assert.match(source, /Session Chat/);
  assert.match(source, /\/styleguide\/typography/);
  assert.match(source, /\/styleguide\/inputs/);
  assert.match(source, /\/styleguide\/buttons/);
  assert.match(source, /\/styleguide\/cards/);
  assert.match(source, /\/styleguide\/tags/);
  assert.match(source, /\/styleguide\/controls/);
  assert.match(source, /\/styleguide\/session-chat/);
  assert.doesNotMatch(source, /ConnectionStatusPill/);
  assert.doesNotMatch(source, /ButtonRadioGroup/);
  assert.doesNotMatch(source, /ToggleButton/);
});
