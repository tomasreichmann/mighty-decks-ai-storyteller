import assert from "node:assert/strict";
import Fastify from "fastify";
import test from "node:test";
import { registerComponentResources } from "../src/registerComponentResources";

test("serves package resources and legacy artwork aliases without exposing package metadata", async () => {
  const app = Fastify();
  await registerComponentResources(app);
  const [png, legacy, missing, escaped] = await Promise.all([
    app.inject("/mighty-decks/generated/png/en/outcome/success/full/1024.png"),
    app.inject("/actors/base/beast.png"),
    app.inject("/mighty-decks/generated/png/en/outcome/missing/full/1024.png"),
    app.inject("/mighty-decks/../package.json"),
  ]);
  assert.equal(png.statusCode, 200);
  assert.match(png.headers["content-type"] ?? "", /^image\/png/);
  assert.equal(legacy.statusCode, 200);
  assert.equal(missing.statusCode, 404);
  assert.equal(escaped.statusCode, 404);
  await app.close();
});
