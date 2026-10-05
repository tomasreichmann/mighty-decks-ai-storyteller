import assert from "node:assert/strict";
import { test } from "node:test";
import { canonicalPositionSchema, runIdSchema, sessionScopeSchema } from "./aiRuntimeIds";

test("runtime IDs and canonical positions validate boundary values", () => {
  assert.equal(runIdSchema.parse("run:one"), "run:one");
  assert.equal(runIdSchema.safeParse("bad id").success, false);
  assert.equal(canonicalPositionSchema.safeParse({ branchId: "main", commit: -1 }).success, false);
  assert.equal(canonicalPositionSchema.parse({ branchId: "main", commit: 0 }).commit, 0);
  assert.equal(sessionScopeSchema.safeParse({ campaignId: "c1", sessionId: "s1", extra: 1 }).success, false);
});
