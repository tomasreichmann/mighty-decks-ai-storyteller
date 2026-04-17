import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("Tags truncates long labels in the actual text span", () => {
  const source = readFileSync(new URL("./Tags.tsx", import.meta.url), "utf8");

  assert.match(source, /className="tags__tag min-w-0 max-w-full"/);
  assert.match(
    source,
    /contentClassName="tags__tag-label min-w-0 max-w-\[15rem\]"/,
  );
  assert.match(
    source,
    /title=\{tag\}[\s\S]*className="tags__tag-label-text min-w-0 flex-1 truncate"/,
  );
});
