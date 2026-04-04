import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("App registers the hidden styleguide routes", () => {
  const source = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");

  assert.match(source, /StyleguideIndexPage/);
  assert.match(source, /StyleguideLocationCardPage/);
  assert.match(source, /StyleguideEncounterCardPage/);
  assert.match(source, /StyleguideQuestCardPage/);
  assert.match(source, /StyleguideSessionChatPlayerPage/);
  assert.match(source, /StyleguideSessionChatStorytellerPage/);
  assert.match(source, /path="\/styleguide"/);
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

test("StyleguideIndexPage documents the shared CTA and connection pills", () => {
  const source = readFileSync(
    new URL("./StyleguideIndexPage.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /CTAButton/);
  assert.match(source, /ConnectionStatusPill/);
  assert.match(source, /Shared CTA and Status Pills/);
});

test("StyleguideIndexPage documents the toggle-button controls lab", () => {
  const source = readFileSync(
    new URL("./StyleguideIndexPage.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /ToggleButton/);
  assert.match(source, /ButtonRadioGroup/);
  assert.match(source, /Toggle and Radio Buttons/);
  assert.match(source, /gold/);
  assert.match(source, /fire/);
  assert.match(source, /monster/);
  assert.match(source, /cloth/);
  assert.match(source, /bone/);
  assert.match(source, /curse/);
});

test("StyleguideIndexPage links to the session chat styleguide labs", () => {
  const source = readFileSync(
    new URL("./StyleguideIndexPage.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /Session Chat Player/);
  assert.match(source, /Session Chat Storyteller/);
  assert.match(source, /\/styleguide\/session-chat-player/);
  assert.match(source, /\/styleguide\/session-chat-storyteller/);
  assert.match(source, /Table/);
  assert.match(source, /Chat/);
});
