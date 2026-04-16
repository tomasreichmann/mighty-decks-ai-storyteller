import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("Tag is a reusable chip primitive", () => {
  const source = readFileSync(new URL("./Tag.tsx", import.meta.url), "utf8");

  assert.match(source, /export const Tag/);
  assert.match(source, /leading\?: ReactNode/);
  assert.match(source, /trailing\?: ReactNode/);
  assert.match(source, /contentClassName\?: string/);
  assert.match(source, /className=\{cn\(/);
  assert.match(source, /"tag inline-flex items-stretch overflow-hidden rounded-md"/);
});

test("Tags composes the shared Tag shell", () => {
  const source = readFileSync(new URL("./Tags.tsx", import.meta.url), "utf8");

  assert.match(source, /import \{ Tag, type TagTone \} from "\.\/Tag"/);
  assert.match(source, /className=\{cn\("tags stack gap-1"/);
  assert.match(source, /tagVariant\?: TagTone/);
  assert.match(source, /trailing=\{/);
  assert.match(source, /tags__tag-remove/);
});

test("ConnectionStatusPill composes the shared Tag shell", () => {
  const source = readFileSync(
    new URL("./ConnectionStatusPill.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /connection-status-pill inline-flex/);
  assert.match(source, /leading=\{/);
  assert.match(source, /connection-status-pill__dot/);
  assert.match(source, /connection-status-pill__detail/);
});
