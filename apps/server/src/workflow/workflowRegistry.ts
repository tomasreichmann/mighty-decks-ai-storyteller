import type { WorkflowLabWorkflowManifest } from "@mighty-decks/spec/workflowLab";
import type { WorkflowDef } from "./types";
import type { WorkflowDefinitionRegistration } from "../ai/workflow/sampleWorkflows";

export interface RegisteredWorkflowDefinition {
  manifest: WorkflowLabWorkflowManifest;
  createDefinition: () => WorkflowDef;
}

const createManifestFromDefinition = (
  definition: WorkflowDef,
  registration: WorkflowDefinitionRegistration,
): WorkflowLabWorkflowManifest => ({
  workflowId: definition.workflowId,
  name: definition.name,
  version: definition.version ?? "1",
  description: definition.description,
  inputSchema: registration.inputSchemaJson,
  defaultInputExample: registration.defaultInputExample,
  defaultRunTimeoutMs: definition.defaultRunOptions?.timeoutMs,
  defaultModelOverrides: registration.defaultModelOverrides,
  steps: definition.steps.map((step) => ({
    id: step.id,
    name: step.name,
    description: step.description,
    kind: step.kind,
    tags: step.tags ?? [],
  })),
  edges: definition.edges.map((edge) => ({
    fromStepId: edge.fromStepId,
    toStepId: edge.toStepId,
    conditionLabel: edge.conditionLabel,
  })),
});

export class WorkflowRegistry {
  private readonly byId = new Map<string, RegisteredWorkflowDefinition>();

  public register(registration: WorkflowDefinitionRegistration): void {
    const definition = registration.createDefinition();
    const manifest = createManifestFromDefinition(definition, registration);
    this.byId.set(registration.workflowId, {
      manifest,
      createDefinition: registration.createDefinition,
    });
  }

  public listManifests(): WorkflowLabWorkflowManifest[] {
    return [...this.byId.values()]
      .map((entry) => entry.manifest)
      .sort((left, right) => left.name.localeCompare(right.name));
  }

  public getById(workflowId: string): RegisteredWorkflowDefinition | null {
    return this.byId.get(workflowId) ?? null;
  }
}

