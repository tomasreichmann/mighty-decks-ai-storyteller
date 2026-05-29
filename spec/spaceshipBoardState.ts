import { z } from "zod";

export const spaceshipBoardStateIdSchema = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "stateId must be lowercase kebab-case");

export const spaceshipBoardViewportSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
  zoom: z.number().finite().positive(),
});
export type SpaceshipBoardViewport = z.infer<typeof spaceshipBoardViewportSchema>;

const jsonObjectSchema = z.record(z.string(), z.unknown());

export const spaceshipBoardStateSummarySchema = z.object({
  stateId: spaceshipBoardStateIdSchema,
  name: z.string().min(1).max(160),
  updatedAtIso: z.string().datetime(),
});
export type SpaceshipBoardStateSummary = z.infer<
  typeof spaceshipBoardStateSummarySchema
>;

export const spaceshipBoardStateIndexSchema = z.object({
  version: z.literal(1),
  defaultStateId: spaceshipBoardStateIdSchema,
  states: z.array(spaceshipBoardStateSummarySchema),
});
export type SpaceshipBoardStateIndex = z.infer<
  typeof spaceshipBoardStateIndexSchema
>;

export const spaceshipBoardStateSchema = z.object({
  version: z.literal(1),
  stateId: spaceshipBoardStateIdSchema,
  name: z.string().min(1).max(160),
  updatedAtIso: z.string().datetime(),
  scene: jsonObjectSchema,
  dragState: jsonObjectSchema,
  viewport: spaceshipBoardViewportSchema,
});
export type SpaceshipBoardState = z.infer<typeof spaceshipBoardStateSchema>;

export const spaceshipBoardStateListResponseSchema = z.object({
  defaultStateId: spaceshipBoardStateIdSchema,
  states: z.array(spaceshipBoardStateSummarySchema),
});
export type SpaceshipBoardStateListResponse = z.infer<
  typeof spaceshipBoardStateListResponseSchema
>;

export const spaceshipBoardStateGetResponseSchema = spaceshipBoardStateSchema;
export type SpaceshipBoardStateGetResponse = z.infer<
  typeof spaceshipBoardStateGetResponseSchema
>;

export const spaceshipBoardStateSaveRequestSchema = z.object({
  name: z.string().min(1).max(160),
  scene: jsonObjectSchema,
  dragState: jsonObjectSchema,
  viewport: spaceshipBoardViewportSchema,
});
export type SpaceshipBoardStateSaveRequest = z.infer<
  typeof spaceshipBoardStateSaveRequestSchema
>;

export const spaceshipBoardStateSaveResponseSchema = spaceshipBoardStateSchema;
export type SpaceshipBoardStateSaveResponse = z.infer<
  typeof spaceshipBoardStateSaveResponseSchema
>;

export const spaceshipBoardStateSetDefaultRequestSchema = z.object({
  stateId: spaceshipBoardStateIdSchema,
});
export type SpaceshipBoardStateSetDefaultRequest = z.infer<
  typeof spaceshipBoardStateSetDefaultRequestSchema
>;

export const spaceshipBoardStateSetDefaultResponseSchema =
  spaceshipBoardStateListResponseSchema;
export type SpaceshipBoardStateSetDefaultResponse = z.infer<
  typeof spaceshipBoardStateSetDefaultResponseSchema
>;

export const spaceshipBoardStateErrorSchema = z.object({
  message: z.string(),
});
export type SpaceshipBoardStateError = z.infer<
  typeof spaceshipBoardStateErrorSchema
>;
