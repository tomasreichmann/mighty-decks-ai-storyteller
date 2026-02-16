import assert from "node:assert/strict";
import test from "node:test";
import {
  buildImageFileBaseName,
  isSafeFileName,
  toCacheKey,
  toGroupKey,
  toModelHash,
  toPromptHash,
} from "../src/image/ImageNaming";

test("image naming hashes are deterministic", () => {
  const prompt = "  A Hero In A Storm   ";
  const provider = "fal";
  const model = "Leonardo Vision XL";

  const promptHashA = toPromptHash(prompt);
  const promptHashB = toPromptHash("A Hero In A Storm");
  assert.equal(promptHashA, promptHashB);

  const modelHashA = toModelHash(model);
  const modelHashB = toModelHash("Leonardo Vision XL");
  assert.equal(modelHashA, modelHashB);

  const groupKey = toGroupKey(prompt, provider, model);
  assert.match(groupKey, /^[a-f0-9]{64}$/);

  const cacheKey = toCacheKey(prompt, provider, model, {
    width: 1024,
    height: 1024,
  });
  assert.match(cacheKey, /^[a-f0-9]{64}$/);
});

test("buildImageFileBaseName is file-safe and encodes batch/image position", () => {
  const fileBaseName = buildImageFileBaseName({
    prompt: "Fog over the old harbor! @ dawn #42",
    promptHash: toPromptHash("Fog over the old harbor! @ dawn #42"),
    modelHash: toModelHash("model-x"),
    batchIndex: 7,
    imageIndex: 3,
  });

  assert.equal(fileBaseName.includes("b7"), true);
  assert.equal(fileBaseName.includes("i3"), true);
  assert.equal(isSafeFileName(`${fileBaseName}.png`), true);
});
