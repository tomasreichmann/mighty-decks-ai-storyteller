import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("StyleguideSessionChatPage groups the session chat labs", () => {
  const source = readFileSync(
    new URL("./StyleguideSessionChatPage.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /StyleguideSectionNav/);
  assert.match(source, /Session Chat Player/);
  assert.match(source, /Session Chat Storyteller/);
  assert.match(source, /\/styleguide\/session-chat-player/);
  assert.match(source, /\/styleguide\/session-chat-storyteller/);
  assert.match(source, /styleguide-session-chat-page/);
});
