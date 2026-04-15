import { runAuthorCampaignCli } from "../src/campaign/cli/runAuthorCampaignCli";
import { createAuthoringCliRuntime } from "./createAuthoringCliRuntime";

const runtime = await createAuthoringCliRuntime();

process.exitCode = await runAuthorCampaignCli(process.argv.slice(2), {
  ...runtime,
});
