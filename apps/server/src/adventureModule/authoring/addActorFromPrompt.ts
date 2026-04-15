import type { AdventureModuleDetail } from "@mighty-decks/spec/adventureModuleAuthoring";
import {
  adventureModuleActorFromPromptOutputSchema,
  ADVENTURE_MODULE_ACTOR_FROM_PROMPT_WORKFLOW_ID,
  type AdventureModuleActorFromPromptOutput,
} from "./actorFromPromptWorkflow";
import type { AdventureModuleStore } from "../../persistence/AdventureModuleStore";
import type { WorkflowFactory } from "../../workflow/executor";
import { runWorkflowToCompletion } from "../../workflow/runWorkflowToCompletion";
import type { WorkflowRegistry } from "../../workflow/workflowRegistry";
import type { WorkflowLabRunSnapshot } from "@mighty-decks/spec/workflowLab";

interface AddActorFromPromptOptions {
  moduleSlug: string;
  prompt: string;
  creatorToken?: string;
  moduleStore: AdventureModuleStore;
  workflowRegistry: WorkflowRegistry;
  workflowFactory: WorkflowFactory;
}

interface AddActorFromPromptResult {
  module: AdventureModuleDetail;
  actor: AdventureModuleDetail["actors"][number];
  actorPath: string;
  draft: AdventureModuleActorFromPromptOutput;
}

const parseDraftFromSnapshot = (
  snapshot: WorkflowLabRunSnapshot,
): AdventureModuleActorFromPromptOutput => {
  if (snapshot.status !== "completed") {
    throw new Error(
      `Actor workflow did not complete successfully (status: ${snapshot.status}).`,
    );
  }

  const actorOutput = snapshot.outputs.actor;
  if (!actorOutput) {
    throw new Error("Actor workflow completed without an actor output payload.");
  }
  return adventureModuleActorFromPromptOutputSchema.parse(actorOutput);
};

export const addActorFromPrompt = async (
  options: AddActorFromPromptOptions,
): Promise<AddActorFromPromptResult> => {
  const moduleDetail = await options.moduleStore.getModuleBySlug(
    options.moduleSlug,
    options.creatorToken,
  );
  if (!moduleDetail) {
    throw new Error(`Adventure Module '${options.moduleSlug}' was not found.`);
  }

  const registration = options.workflowRegistry.getById(
    ADVENTURE_MODULE_ACTOR_FROM_PROMPT_WORKFLOW_ID,
  );
  if (!registration) {
    throw new Error(
      `Workflow '${ADVENTURE_MODULE_ACTOR_FROM_PROMPT_WORKFLOW_ID}' is not registered.`,
    );
  }

  const run = options.workflowFactory.createRun(registration.createDefinition(), {
    input: {
      moduleTitle: moduleDetail.index.title,
      moduleSummary: moduleDetail.index.summary,
      existingActors: moduleDetail.actors.map((actor) => actor.title),
      prompt: options.prompt,
    },
  });
  run.start();
  const workflowSnapshot = await runWorkflowToCompletion(run, {
    timeoutMs: 60_000,
  });
  const draft = parseDraftFromSnapshot(workflowSnapshot);

  const created = await options.moduleStore.createActor({
    moduleId: moduleDetail.index.moduleId,
    creatorToken: options.creatorToken,
    title: draft.title,
    isPlayerCharacter: draft.isPlayerCharacter,
  });
  const createdActor = created.actors[created.actors.length - 1];
  if (!createdActor) {
    throw new Error("Actor creation completed without a new actor record.");
  }

  const updated = await options.moduleStore.updateActor({
    moduleId: moduleDetail.index.moduleId,
    actorSlug: createdActor.actorSlug,
    creatorToken: options.creatorToken,
    title: draft.title,
    summary: draft.summary,
    baseLayerSlug: draft.baseLayerSlug,
    tacticalRoleSlug: draft.tacticalRoleSlug,
    tacticalSpecialSlug: draft.tacticalSpecialSlug,
    isPlayerCharacter: draft.isPlayerCharacter,
    content: draft.content,
  });

  const actor =
    updated.actors.find((candidate) => candidate.title === draft.title) ??
    updated.actors.find(
      (candidate) => candidate.actorSlug === createdActor.actorSlug,
    );
  if (!actor) {
    throw new Error("Updated actor record could not be found after save.");
  }

  return {
    module: updated,
    actor,
    actorPath: `actors/${actor.actorSlug}.mdx`,
    draft,
  };
};
