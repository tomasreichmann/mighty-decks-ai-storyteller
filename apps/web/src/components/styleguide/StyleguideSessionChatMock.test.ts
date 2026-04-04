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
  assert.match(source, /fullCardHeightRem \+ peekCount \* stackPeekStepRem/);
  assert.match(source, /top: `\$\{peekCards\.length \* stackPeekStepRem\}rem`/);
  assert.match(source, /top: `\$\{index \* stackPeekStepRem\}rem`/);
  assert.match(source, /overflow-y-auto/);
  assert.match(source, /overflow-x-hidden/);
  assert.match(source, /100dvh/);
  assert.match(source, /max-w-\[6\.5rem\]/);
  assert.doesNotMatch(source, /Panel/);
  assert.doesNotMatch(source, /Lantern Vault Break-In/);
  assert.doesNotMatch(source, /Session Chat Table/);
});

test("StyleguideSessionChatMock keeps the table pane scrollable", () => {
  const sourcePath = new URL("./StyleguideSessionChatMock.tsx", import.meta.url);
  const cssPath = new URL("./StyleguideSessionChatMock.module.css", import.meta.url);

  assert.equal(existsSync(sourcePath), true);
  assert.equal(existsSync(cssPath), true);

  const source = readFileSync(sourcePath, "utf8");
  const css = readFileSync(cssPath, "utf8");

  assert.match(source, /overflow-y-auto overflow-x-hidden/);
  assert.match(source, /flex min-h-0 flex-1 flex-col/);
  assert.doesNotMatch(css, /\.tableBackdrop\s*\{[^}]*overflow:\s*hidden/s);
});

test("StyleguideSessionChatMock lets the global halftone background show through", () => {
  const cssPath = new URL("./StyleguideSessionChatMock.module.css", import.meta.url);

  assert.equal(existsSync(cssPath), true);

  const css = readFileSync(cssPath, "utf8");

  assert.doesNotMatch(css, /\.pageBackdrop\s*\{[^}]*background:/s);
  assert.doesNotMatch(css, /\.pageBackdrop::before\s*\{[^}]*background:/s);
  assert.doesNotMatch(css, /\.tableBackdrop\s*\{[^}]*background:/s);
  assert.doesNotMatch(css, /\.tableBackdrop::before\s*\{[^}]*background:/s);
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

test("StyleguideSessionChatMock uses label-led dividers instead of boxed player lanes", () => {
  const sourcePath = new URL("./StyleguideSessionChatMock.tsx", import.meta.url);
  const cssPath = new URL("./StyleguideSessionChatMock.module.css", import.meta.url);

  assert.equal(existsSync(sourcePath), true);
  assert.equal(existsSync(cssPath), true);

  const source = readFileSync(sourcePath, "utf8");
  const css = readFileSync(cssPath, "utf8");

  assert.match(source, /styles\.laneDividerRow/);
  assert.match(source, /styles\.laneDivider/);
  assert.match(source, /styles\.laneLabel/);
  assert.match(source, /styles\.stackTopCard/);
  assert.match(css, /\.laneDividerRow/);
  assert.match(css, /\.laneDivider/);
  assert.match(css, /\.laneLabel/);
  assert.match(css, /\.stackTopCard/);
  assert.match(css, /\.stackPeekViewport/);
  assert.match(css, /border-radius: 0\.55rem 0\.55rem 0 0/);
});
