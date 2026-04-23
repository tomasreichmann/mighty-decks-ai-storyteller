import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("App registers the public privacy and terms routes", () => {
  const source = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");

  assert.match(source, /PrivacyPolicyPage/);
  assert.match(source, /TermsOfServicePage/);
  assert.match(source, /path="\/privacy-policy"/);
  assert.match(source, /path="\/terms-of-service"/);
  assert.match(source, /RouteShellBoundary/);
});
