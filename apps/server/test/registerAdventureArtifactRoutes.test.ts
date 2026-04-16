import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import Fastify from "fastify";
import { AdventureArtifactStore } from "../src/persistence/AdventureArtifactStore";
import { registerAdventureArtifactRoutes } from "../src/adventureArtifacts/registerAdventureArtifactRoutes";

const createTempDir = async (): Promise<string> =>
  mkdtemp(join(tmpdir(), "md-adventure-artifacts-"));

const ONE_PIXEL_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=";

test("registerAdventureArtifactRoutes saves raw image uploads on the server", async (t) => {
  const rootDir = await createTempDir();
  const app = Fastify();

  t.after(async () => {
    await app.close();
    await rm(rootDir, { recursive: true, force: true });
  });

  const store = new AdventureArtifactStore({
    rootDir,
    fileRouteBasePath: "/api/adventure-artifacts",
  });
  await store.initialize();

  registerAdventureArtifactRoutes(app, { store });

  const uploadResponse = await app.inject({
    method: "POST",
    url: "/api/adventure-artifacts/images",
    headers: {
      "content-type": "image/png",
      "x-upload-hint": "alien-container.png",
    },
    payload: Buffer.from(ONE_PIXEL_PNG_BASE64, "base64"),
  });

  assert.equal(uploadResponse.statusCode, 201);
  const uploadPayload = uploadResponse.json() as {
    artifact?: {
      fileName: string;
      fileUrl: string;
      contentType: string;
    };
  };
  assert.ok(uploadPayload.artifact);
  assert.equal(uploadPayload.artifact?.contentType, "image/png");
  assert.match(uploadPayload.artifact?.fileUrl ?? "", /^\/api\/adventure-artifacts\//);

  const fetchResponse = await app.inject({
    method: "GET",
    url: uploadPayload.artifact?.fileUrl ?? "",
  });
  assert.equal(fetchResponse.statusCode, 200);
  assert.equal(fetchResponse.headers["content-type"], "image/png");
});
