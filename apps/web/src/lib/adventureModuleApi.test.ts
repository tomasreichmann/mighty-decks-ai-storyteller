import test from "node:test";
import assert from "node:assert/strict";
import { buildHeaders } from "./adventureModuleApi";
import { ADVENTURE_MODULE_CREATOR_TOKEN_HEADER } from "./adventureModuleIdentity";

test("buildHeaders only sets JSON content type when a request body is present", () => {
  assert.deepEqual(buildHeaders("creator-a"), {
    [ADVENTURE_MODULE_CREATOR_TOKEN_HEADER]: "creator-a",
  });

  assert.deepEqual(buildHeaders("creator-a", { jsonContentType: true }), {
    "Content-Type": "application/json",
    [ADVENTURE_MODULE_CREATOR_TOKEN_HEADER]: "creator-a",
  });
});
