import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

test("StyleguideSessionChatMock defines the responsive table and chat shell", () => {
  const sourcePath = new URL("./StyleguideSessionChatMock.tsx", import.meta.url);

  assert.equal(existsSync(sourcePath), true);

  const source = readFileSync(sourcePath, "utf8");

  assert.match(source, /ButtonRadioGroup/);
  assert.match(source, /useState<MobilePane>\("chat"\)/);
  assert.match(source, /onValueChange=\{setActiveMobilePane\}/);
  assert.match(source, /activeMobilePane === "table"/);
  assert.match(source, /activeMobilePane === "chat"/);
  assert.match(source, /Table/);
  assert.match(source, /Chat/);
  assert.match(source, /minmax\(0,2fr\)_minmax\(0,1fr\)/);
  assert.match(source, /viewerRole/);
  assert.match(source, /Shared/);
  assert.match(source, /kind: "stack"/);
  assert.match(source, /slice\(0, 5\)/);
  assert.match(source, /slice\(1\)/);
  assert.doesNotMatch(source, /Panel/);
  assert.doesNotMatch(source, /Lantern Vault Break-In/);
  assert.doesNotMatch(source, /Session Chat Table/);
});

test("StyleguideSessionChatMock keeps discard affordances role-aware", () => {
  const sourcePath = new URL("./StyleguideSessionChatMock.tsx", import.meta.url);

  assert.equal(existsSync(sourcePath), true);

  const source = readFileSync(sourcePath, "utf8");

  assert.match(source, /viewerRole === "storyteller"/);
  assert.match(source, /lane\.playerId === currentPlayerId/);
  assert.match(source, /lane\.groups\.flatMap\(\(group\) => group\.cards\)/);
  assert.match(source, /showDiscardControl/);
  assert.doesNotMatch(source, /TableGroup/);
  assert.doesNotMatch(source, /Discarded/);
  assert.doesNotMatch(source, /discardedCard/);
  assert.doesNotMatch(source, /discarded:/);
  assert.doesNotMatch(source, /Current Player/);
  assert.doesNotMatch(source, /Player Lane/);
  assert.doesNotMatch(source, /Player focus/);
  assert.doesNotMatch(source, /Discard visible/);
});
