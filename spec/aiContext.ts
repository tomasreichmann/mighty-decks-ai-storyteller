import { z } from "zod";
import { actorRuntimeIdSchema, campaignRuntimeIdSchema, canonicalPositionSchema } from "./aiRuntimeIds";

export const contextKindSchema = z.enum([
  "encounter", "actor", "npc", "mechanics", "table", "outcome",
  "history_summary", "history_facts", "recent_messages", "rules",
  "campaign_content", "preferences",
]);
export type ContextKind = z.infer<typeof contextKindSchema>;

export const contextSectionSchema = z.object({
  id: z.string().min(1),
  kind: contextKindSchema,
  source: z.object({
    service: z.string().min(1),
    kind: z.string().min(1),
    campaignId: campaignRuntimeIdSchema.optional(),
    entityIds: z.array(z.string().min(1)),
    revision: z.string().min(1),
  }).strict(),
  visibility: z.enum(["player", "storyteller", "npc_specific"]),
  audienceActorId: actorRuntimeIdSchema.optional(),
  content: z.string(),
  estimatedTokens: z.number().int().nonnegative(),
  estimatorVersion: z.string().min(1),
  priority: z.enum(["required", "preferred", "optional"]),
  order: z.number().int().nonnegative(),
}).strict().superRefine((section, ctx) => {
  if ((section.visibility === "npc_specific") !== Boolean(section.audienceActorId)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "NPC-specific sections require an audience actor" });
  }
});
export type ContextSection = z.infer<typeof contextSectionSchema>;

export const contextManifestSchema = z.object({
  at: canonicalPositionSchema,
  gameRevision: z.number().int().nonnegative(),
  sections: z.array(contextSectionSchema),
  omissions: z.array(z.object({ sectionId: z.string().min(1), reason: z.string().min(1) }).strict()),
}).strict().superRefine((manifest, ctx) => {
  const ids = manifest.sections.map((section) => section.id);
  if (new Set(ids).size !== ids.length) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Context section IDs must be unique" });
});
export type ContextManifest = z.infer<typeof contextManifestSchema>;

export const promptPartSchema = z.object({
  id: z.string().min(1),
  text: z.string(),
  source: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("template"), id: z.string().min(1), version: z.string().min(1) }).strict(),
    z.object({ kind: z.literal("player_input"), messageId: z.string().min(1) }).strict(),
    z.object({ kind: z.literal("context"), sectionId: z.string().min(1) }).strict(),
  ]),
}).strict();
export type PromptPart = z.infer<typeof promptPartSchema>;

export const promptDocumentSchema = z.object({
  builder: z.object({ id: z.string().min(1), version: z.string().min(1) }).strict(),
  messages: z.array(z.object({
    role: z.enum(["system", "user", "assistant", "tool"]),
    parts: z.array(promptPartSchema).min(1),
  }).strict()).min(1),
  context: contextManifestSchema,
}).strict().superRefine((document, ctx) => {
  const partIds = document.messages.flatMap((message) => message.parts.map((part) => part.id));
  if (new Set(partIds).size !== partIds.length) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Prompt part IDs must be unique" });
  const sectionIds = new Set(document.context.sections.map((section) => section.id));
  for (const message of document.messages) for (const part of message.parts) {
    if (part.source.kind === "context" && !sectionIds.has(part.source.sectionId)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Unknown context section ${part.source.sectionId}` });
    }
  }
});
export type PromptDocument = z.infer<typeof promptDocumentSchema>;
