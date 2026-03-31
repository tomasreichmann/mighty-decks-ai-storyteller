import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("Page gives the Workflow Lab nav item extra desktop width for its longer label", () => {
  const source = readFileSync(new URL("./Page.tsx", import.meta.url), "utf8");
  const styles = readFileSync(new URL("./Page.module.css", import.meta.url), "utf8");

  assert.match(
    source,
    /label: "Workflow Lab"[\s\S]*linkClassName: styles\.comicNavLinkWide/,
  );
  assert.match(source, /item\.linkClassName/);
  assert.match(styles, /\.comicNavLinkWide\s*\{/);
  assert.match(styles, /flex-grow:\s*1\.\d+/);
  assert.match(styles, /min-width:\s*8\.\d+rem/);
});
