import { runAuthorModuleCli } from "../src/adventureModule/cli/runAuthorModuleCli";
import { createAuthoringCliRuntime } from "./createAuthoringCliRuntime";

const runtime = await createAuthoringCliRuntime();

process.exitCode = await runAuthorModuleCli(process.argv.slice(2), {
  ...runtime,
});
