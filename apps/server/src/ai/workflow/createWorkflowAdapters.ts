import type { OpenRouterClient } from "../OpenRouterClient";
import type { WorkflowExternalAdapters } from "../../workflow/types";
import { FalQueueClient } from "./FalQueueClient";
import {
  runFalImageStep,
  runFalSttStep,
  runFalTtsStep,
} from "./falWorkflowAdapters";
import {
  createOpenRouterWorkflowImageAdapter,
  createOpenRouterWorkflowTextAdapter,
} from "./openRouterWorkflowAdapters";

interface CreateWorkflowAdaptersOptions {
  openRouterClient: OpenRouterClient;
  falQueueClient: FalQueueClient;
}

const isFalModel = (modelId: string): boolean =>
  modelId.trim().toLowerCase().startsWith("fal-ai/");

export const createWorkflowAdapters = (
  options: CreateWorkflowAdaptersOptions,
): WorkflowExternalAdapters => {
  const openRouterText = createOpenRouterWorkflowTextAdapter(options.openRouterClient);
  const openRouterImage = createOpenRouterWorkflowImageAdapter(options.openRouterClient);

  return {
    text: openRouterText,
    image: async (request) =>
      isFalModel(request.modelId)
        ? runFalImageStep(options.falQueueClient, request)
        : openRouterImage(request),
    tts: async (request) => runFalTtsStep(options.falQueueClient, request),
    stt: async (request) => runFalSttStep(options.falQueueClient, request),
  };
};

