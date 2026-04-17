import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const assertWrapped = (file: string, pattern: RegExp): void => {
  const source = readFileSync(new URL(file, import.meta.url), "utf8");
  assert.match(source, /CardBoundary/);
  assert.match(source, pattern);
};

test("runtime GameCardView render paths are wrapped in CardBoundary", () => {
  assertWrapped(
    "./CampaignSessionMessageContent.tsx",
    /<CardBoundary[\s\S]*<GameCardView gameCard=\{resolved\} \/>[\s\S]*<\/CardBoundary>/,
  );
  assertWrapped(
    "../components/adventure-module/GameCardJsxEditor.tsx",
    /<CardBoundary[\s\S]*<GameCardView gameCard=\{resolvedGameCard\} \/>[\s\S]*<\/CardBoundary>/,
  );
  assertWrapped(
    "../lib/InlineGameCardNode.tsx",
    /<CardBoundary[\s\S]*<GameCardView gameCard=\{resolvedGameCard\} \/>[\s\S]*<\/CardBoundary>/,
  );
  assertWrapped(
    "../components/styleguide/StyleguideSessionChatMock.tsx",
    /<CardBoundary[\s\S]*<GameCardView gameCard=\{card\.card\}[\s\S]*<\/CardBoundary>/,
  );
  assertWrapped(
    "../components/session/campaignSessionTable/resolveReference.tsx",
    /<CardBoundary[\s\S]*<GameCardView gameCard=\{resolved\}[\s\S]*<\/CardBoundary>/,
  );
});
