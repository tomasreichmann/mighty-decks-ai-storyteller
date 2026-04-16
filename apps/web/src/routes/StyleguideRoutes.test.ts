import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("App registers the hidden styleguide routes", () => {
  const source = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");

  assert.match(source, /StyleguideIndexPage/);
  assert.match(source, /StyleguideCardsPage/);
  assert.match(source, /StyleguideTagsPage/);
  assert.match(source, /StyleguideControlsPage/);
  assert.match(source, /StyleguideSessionChatPage/);
  assert.match(source, /StyleguideLocationCardPage/);
  assert.match(source, /StyleguideEncounterCardPage/);
  assert.match(source, /StyleguideQuestCardPage/);
  assert.match(source, /StyleguideSessionChatPlayerPage/);
  assert.match(source, /StyleguideSessionChatStorytellerPage/);
  assert.match(source, /path="\/styleguide"/);
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
});

test("StyleguideIndexPage documents the scoped styleguide overview", () => {
  const source = readFileSync(
    new URL("./StyleguideIndexPage.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /StyleguideSectionNav/);
  assert.match(source, /styleguide-index-page/);
  assert.match(source, /Cards/);
  assert.match(source, /Tags/);
  assert.match(source, /Controls/);
  assert.match(source, /Session Chat/);
  assert.match(source, /\/styleguide\/cards/);
  assert.match(source, /\/styleguide\/tags/);
  assert.match(source, /\/styleguide\/controls/);
  assert.match(source, /\/styleguide\/session-chat/);
  assert.doesNotMatch(source, /ConnectionStatusPill/);
  assert.doesNotMatch(source, /ButtonRadioGroup/);
  assert.doesNotMatch(source, /ToggleButton/);
});
