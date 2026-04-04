import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

test("StyleguideSessionChatPlayerPage configures the player session chat mock", () => {
  const sourcePath = new URL(
    "./StyleguideSessionChatPlayerPage.tsx",
    import.meta.url,
  );

  assert.equal(existsSync(sourcePath), true);

  const source = readFileSync(sourcePath, "utf8");

  assert.match(source, /StyleguideSessionChatMock/);
  assert.match(source, /viewerRole="player"/);
  assert.doesNotMatch(source, /Lantern Vault Break-In/);
  assert.doesNotMatch(source, /discard controls only on your table cards/i);
});
