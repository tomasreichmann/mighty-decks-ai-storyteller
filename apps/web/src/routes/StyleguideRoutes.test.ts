import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("App registers the hidden styleguide routes", () => {
  const source = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");

  assert.match(source, /SpaceshipPage/);
  assert.match(source, /StyleguideIndexPage/);
  assert.match(source, /StyleguideActorTokenPage/);
  assert.match(source, /StyleguideTypographyPage/);
  assert.match(source, /StyleguideInputsPage/);
  assert.match(source, /StyleguideLoadingPage/);
  assert.match(source, /StyleguideButtonsPage/);
  assert.match(source, /StyleguidePanelPage/);
  assert.match(source, /StyleguideCardsPage/);
  assert.match(source, /StyleguideTagsPage/);
  assert.match(source, /StyleguideLabelsPage/);
  assert.match(source, /StyleguideMessagesPage/);
  assert.match(source, /StyleguideControlsPage/);
  assert.match(source, /StyleguideSessionChatPage/);
  assert.match(source, /StyleguideLocationCardPage/);
  assert.match(source, /StyleguideEncounterCardPage/);
  assert.match(source, /StyleguideQuestCardPage/);
  assert.match(source, /StyleguideSessionChatPlayerPage/);
  assert.match(source, /StyleguideSessionChatStorytellerPage/);
  assert.match(source, /RouteShellBoundary/);
  assert.match(source, /path="\/spaceship"/);
  assert.match(source, /path="\/styleguide"/);
  assert.match(source, /path="\/styleguide\/actor-token"/);
  assert.match(source, /path="\/styleguide\/typography"/);
  assert.match(source, /path="\/styleguide\/inputs"/);
  assert.match(source, /path="\/styleguide\/loading"/);
  assert.match(source, /path="\/styleguide\/buttons"/);
  assert.match(source, /path="\/styleguide\/panel"/);
  assert.match(source, /path="\/styleguide\/cards"/);
  assert.match(source, /path="\/styleguide\/tags"/);
  assert.match(source, /path="\/styleguide\/labels"/);
  assert.match(source, /path="\/styleguide\/messages"/);
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
    /path="\/spaceship"[\s\S]*<RouteShellBoundary>[\s\S]*<SpaceshipPage \/>[\s\S]*<\/RouteShellBoundary>/,
  );
  assert.match(
    source,
    /path="\/styleguide\/actor-token"[\s\S]*<RouteShellBoundary>[\s\S]*<StyleguideActorTokenPage \/>[\s\S]*<\/RouteShellBoundary>/,
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
  assert.match(
    source,
    /path="\/styleguide\/labels"[\s\S]*<RouteShellBoundary>[\s\S]*<StyleguideLabelsPage \/>[\s\S]*<\/RouteShellBoundary>/,
  );
  assert.match(
    source,
    /path="\/styleguide\/messages"[\s\S]*<RouteShellBoundary>[\s\S]*<StyleguideMessagesPage \/>[\s\S]*<\/RouteShellBoundary>/,
  );
});

test("StyleguideIndexPage documents the design reference hub", () => {
  const source = readFileSync(
    new URL("./StyleguideIndexPage.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /StyleguideSectionNav/);
  assert.match(source, /styleguide-index-page/);
  assert.match(source, /Design principles/);
  assert.match(source, /Color families and swatches/);
  assert.match(source, /Common shared-component rules/);
  assert.match(source, /Component use cases/);
  assert.match(source, /Narration first/);
  assert.match(source, /Semantic color/);
  assert.match(source, /Shared primitives/);
  assert.match(source, /Contrast with restraint/);
  assert.match(source, /Label \/ Tag \/ ConnectionStatusPill/);
  assert.match(source, /Button \/ CTAButton/);
  assert.match(source, /TextField \/ TextArea/);
  assert.match(source, /backgroundColor: variant\.hex/);
  assert.doesNotMatch(source, /\/styleguide\/typography/);
  assert.doesNotMatch(source, /\/styleguide\/inputs/);
  assert.doesNotMatch(source, /\/styleguide\/buttons/);
  assert.doesNotMatch(source, /\/styleguide\/cards/);
  assert.doesNotMatch(source, /\/styleguide\/tags/);
  assert.doesNotMatch(source, /\/styleguide\/controls/);
  assert.doesNotMatch(source, /\/styleguide\/session-chat/);
});
