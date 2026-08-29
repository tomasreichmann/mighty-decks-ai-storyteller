import assert from "node:assert/strict";
import test from "node:test";
import Fastify from "fastify";
import { registerReadinessRoutes } from "../src/routes/registerReadinessRoutes";

test("registerReadinessRoutes reports the service is ready", async (t) => {
  const app = Fastify();
  registerReadinessRoutes(app);
  t.after(async () => {
    await app.close();
  });

  const response = await app.inject({
    method: "GET",
    url: "/api/readiness",
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(Object.keys(response.json()).sort(), [
    "ok",
    "service",
    "status",
    "timestamp",
  ]);
  assert.equal(response.json().ok, true);
  assert.equal(response.json().status, "ready");
  assert.equal(response.json().service, "mighty-decks-ai-storyteller");
  assert.match(response.json().timestamp, /^\d{4}-\d{2}-\d{2}T/);
});
