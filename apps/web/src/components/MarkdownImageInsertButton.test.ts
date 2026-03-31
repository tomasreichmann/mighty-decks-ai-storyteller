import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("MarkdownImageInsertButton renders a reusable image modal around the generated image field", () => {
  const source = readFileSync(
    new URL("./MarkdownImageInsertButton.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /AdventureModuleGeneratedImageField/);
  assert.match(source, /role="dialog"/);
  assert.match(source, /aria-modal="true"/);
  assert.match(source, /buildMarkdownImageSnippet/);
  assert.match(source, /variant="circle"/);
  assert.match(source, /overflow-y-auto/);
  assert.match(source, /max-h-\[calc\(100vh-2rem\)\]/);
  assert.match(source, /min-h-0 flex-1 overflow-y-auto overflow-x-hidden/);
  assert.match(source, /shrink-0 px-4 pb-3 pt-5/);
  assert.match(source, /shrink-0 border-t-2/);
  assert.match(source, /className="absolute left-4 top-0 -translate-y-1\/2"/);
  assert.match(source, /<div className="absolute right-4 top-0 -translate-y-1\/2">\s*<Button/);
});
