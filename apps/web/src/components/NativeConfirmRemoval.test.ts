import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const sourceFiles = [
  new URL("./ActionComposer.tsx", import.meta.url),
  new URL("./EndSessionButton.tsx", import.meta.url),
  new URL("./campaign/CampaignStorytellerSessionShell.tsx", import.meta.url),
  new URL("./adventure-module/AdventureModuleGeneratedImageField.tsx", import.meta.url),
  new URL("./adventure-module/EntityList.tsx", import.meta.url),
  new URL("../lib/authoring/store/AuthoringProvider.tsx", import.meta.url),
  new URL("../routes/ImageGenerator.tsx", import.meta.url),
];

test("web destructive flows no longer rely on native confirm dialogs", () => {
  for (const fileUrl of sourceFiles) {
    const source = readFileSync(fileUrl, "utf8");
    assert.doesNotMatch(source, /window\.confirm\(/, `${fileUrl.pathname} still uses window.confirm`);
  }
});
