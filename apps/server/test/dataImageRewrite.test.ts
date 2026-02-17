import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { AdventureArtifactStore } from "../src/persistence/AdventureArtifactStore";
import {
  hasInlineDataImage,
  redactInlineDataImages,
  rewriteDataImageUrisInText,
} from "../src/persistence/dataImageRewrite";

const ONE_PIXEL_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=";

test("rewrites multiple inline data images to local URLs", async () => {
  const rootDir = mkdtempSync(join(tmpdir(), "mighty-decks-rewrite-"));
  const store = new AdventureArtifactStore({
    rootDir,
    fileRouteBasePath: "/api/adventure-artifacts",
  });
  await store.initialize();

  const uri = `data:image/png;base64,${ONE_PIXEL_PNG_BASE64}`;
  const input = `First ${uri} and second ${uri}`;

  const result = await rewriteDataImageUrisInText(input, store, {
    hint: "ai-inline",
  });

  assert.equal(hasInlineDataImage(result.rewrittenText), false);
  assert.equal(result.replacements.length, 2);
  assert.match(result.rewrittenText, /\/api\/adventure-artifacts\//);
});

test("redacts inline payloads while preserving surrounding text", () => {
  const uri = `data:image/png;base64,${ONE_PIXEL_PNG_BASE64}`;
  const input = `Image: ${uri} done.`;
  const redacted = redactInlineDataImages(input);

  assert.equal(redacted.includes("done."), true);
  assert.equal(hasInlineDataImage(redacted), false);
  assert.match(redacted, /omitted inline image payload/i);
});
