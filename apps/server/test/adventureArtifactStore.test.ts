import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { AdventureArtifactStore } from "../src/persistence/AdventureArtifactStore";

const ONE_PIXEL_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=";

test("persists data image URI and deduplicates by payload hash", async () => {
  const rootDir = mkdtempSync(join(tmpdir(), "mighty-decks-artifacts-"));
  const store = new AdventureArtifactStore({
    rootDir,
    fileRouteBasePath: "/api/adventure-artifacts",
  });
  await store.initialize();

  const uri = `data:image/png;base64,${ONE_PIXEL_PNG_BASE64}`;
  const first = await store.persistDataImageUri(uri, { hint: "debug" });
  const second = await store.persistDataImageUri(uri, { hint: "ignored" });

  assert.equal(first.fileName, second.fileName);
  assert.equal(first.fileUrl, second.fileUrl);
  assert.ok(first.fileName.endsWith(".png"));

  const record = await store.getFileRecord(first.fileName);
  assert.ok(record);
  assert.equal(record?.contentType, "image/png");
});

test("rejects malformed data image URI", async () => {
  const rootDir = mkdtempSync(join(tmpdir(), "mighty-decks-artifacts-"));
  const store = new AdventureArtifactStore({
    rootDir,
    fileRouteBasePath: "/api/adventure-artifacts",
  });
  await store.initialize();

  await assert.rejects(
    () => store.persistDataImageUri("data:text/plain;base64,SGVsbG8=", { hint: "bad" }),
    /invalid data image URI|unsupported data image content type/i,
  );
});
