import type { StructuredAuthoringCliDependencies } from "../../authoringCli/runStructuredAuthoringCli";
import { runStructuredAuthoringCli } from "../../authoringCli/runStructuredAuthoringCli";

export interface RunAuthorCampaignCliDependencies
  extends StructuredAuthoringCliDependencies {}

export const runAuthorCampaignCli = async (
  args: string[],
  dependencies: RunAuthorCampaignCliDependencies,
): Promise<number> => runStructuredAuthoringCli("campaign", args, dependencies);
