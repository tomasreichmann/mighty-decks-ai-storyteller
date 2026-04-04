import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

test("StyleguideSessionChatStorytellerPage configures the storyteller session chat mock", () => {
  const sourcePath = new URL(
    "./StyleguideSessionChatStorytellerPage.tsx",
    import.meta.url,
  );

  assert.equal(existsSync(sourcePath), true);

  const source = readFileSync(sourcePath, "utf8");

  assert.match(source, /StyleguideSessionChatMock/);
  assert.match(source, /viewerRole="storyteller"/);
  assert.doesNotMatch(source, /Lantern Vault Break-In/);
  assert.doesNotMatch(source, /discard controls across every lane and shared card/i);
});
