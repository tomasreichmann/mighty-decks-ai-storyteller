import { z } from "zod";
import {
  adventureStateSchema,
  RuntimeConfig,
  runtimeConfigSchema,
} from "@mighty-decks/spec/adventureState";

const persistedSelectedPitchSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
});

export const persistedAdventureRuntimeSchema = z.object({
  sceneCounter: z.number().int().nonnegative(),
  sceneTurnCounter: z.number().int().nonnegative(),
  sceneDirectActionCounter: z.number().int().nonnegative(),
  autoIllustrationsUsedInScene: z.number().int().nonnegative(),
  autoIllustrationSubjectsInScene: z.array(z.string()).default([]),
  selectedPitch: persistedSelectedPitchSchema.nullable(),
  rollingSummary: z.string(),
  metagameDirectives: z.array(
    z.object({
      directiveId: z.string().min(1),
      createdAtIso: z.string().datetime(),
      actorName: z.string().min(1),
      text: z.string().min(1),
    }),
  ),
  votesByPlayerId: z.record(z.string().min(1)),
  runtimeConfig: runtimeConfigSchema.optional(),
});

export type PersistedAdventureRuntimeV1 = z.infer<
  typeof persistedAdventureRuntimeSchema
>;

export const persistedAdventureSnapshotSchema = z.object({
  version: z.literal(1),
  savedAtIso: z.string().datetime(),
  adventureId: z.string().min(1),
  sceneLabel: z.string().min(1),
  adventure: adventureStateSchema,
  runtime: persistedAdventureRuntimeSchema,
});

export type PersistedAdventureSnapshotV1 = z.infer<
  typeof persistedAdventureSnapshotSchema
>;

export const buildRuntimeConfigSnapshot = (
  runtimeConfig: RuntimeConfig,
): RuntimeConfig => runtimeConfigSchema.parse(runtimeConfig);
