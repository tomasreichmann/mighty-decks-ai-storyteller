import assert from "node:assert/strict";
import { test } from "node:test";
import { contextManifestSchema, promptDocumentSchema } from "./aiContext";

const section = {
  id: "encounter:1", kind: "encounter", source: { service: "CampaignRead", kind: "encounter", campaignId: "c1", entityIds: ["e1"], revision: "2" },
  visibility: "player", content: "A locked door.", estimatedTokens: 5,
  estimatorVersion: "v1", priority: "required", order: 0,
};
const context = { at: { branchId: "main", commit: 2 }, gameRevision: 3, sections: [section], omissions: [] };

test("manifest enforces request-unique section IDs", () => {
  assert.equal(contextManifestSchema.safeParse(context).success, true);
  assert.equal(contextManifestSchema.safeParse({ ...context, sections: [section, section] }).success, false);
});

test("prompt keeps instruction, input and context provenance", () => {
  const document = {
    builder: { id: "storyteller", version: "1" }, context,
    messages: [
      { role: "system", parts: [{ id: "instruction", text: "Narrate.", source: { kind: "template", id: "system", version: "1" } }] },
      { role: "user", parts: [
        { id: "input", text: "Open it.", source: { kind: "player_input", messageId: "m1" } },
        { id: "context", text: section.content, source: { kind: "context", sectionId: section.id } },
      ] },
    ],
  };
  assert.equal(promptDocumentSchema.parse(document).messages[1].parts[1].source.kind, "context");
  const invalid = structuredClone(document);
  invalid.messages[1].parts[1].source.sectionId = "missing";
  assert.equal(promptDocumentSchema.safeParse(invalid).success, false);
});
