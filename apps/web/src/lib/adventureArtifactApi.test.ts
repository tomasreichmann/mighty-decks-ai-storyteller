import assert from "node:assert/strict";
import test from "node:test";
import { uploadAdventureArtifactImage } from "./adventureArtifactApi";

test("uploadAdventureArtifactImage posts raw image bytes and returns the stored artifact", async (t) => {
  const originalFetch = globalThis.fetch;
  const requests: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = (async (input, init) => {
    requests.push({ input, init });
    return new Response(
      JSON.stringify({
        artifact: {
          fileName: "alien-container-123abc.png",
          fileUrl: "/api/adventure-artifacts/alien-container-123abc.png",
          contentType: "image/png",
        },
      }),
      {
        status: 201,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }) as typeof fetch;

  const file = new File([Buffer.from("raw-image")], "Alien Container.PNG", {
    type: "image/png",
  });

  const artifact = await uploadAdventureArtifactImage(file, {
    hint: "Alien Container.PNG",
  });

  assert.equal(artifact.fileName, "alien-container-123abc.png");
  assert.equal(
    artifact.fileUrl,
    "/api/adventure-artifacts/alien-container-123abc.png",
  );
  assert.equal(artifact.contentType, "image/png");

  const request = requests[0];
  assert.ok(request);
  assert.equal(request?.init?.method, "POST");
  const headers = new Headers(request?.init?.headers);
  assert.equal(headers.get("content-type"), "image/png");
  assert.equal(headers.get("x-upload-hint"), "Alien Container.PNG");
  assert.equal(request?.init?.body, file);
});
