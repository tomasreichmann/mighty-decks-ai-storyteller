import { env } from "../src/config/env";
import { runImportAdventureModuleCli } from "../src/adventureModule/cli/runImportAdventureModuleCli";
import { AdventureArtifactStore } from "../src/persistence/AdventureArtifactStore";
import { AdventureModuleStore } from "../src/persistence/AdventureModuleStore";

const artifactStore = new AdventureArtifactStore({
  rootDir: env.adventureArtifacts.outputDir,
  fileRouteBasePath: "/api/adventure-artifacts",
});
await artifactStore.initialize();

const moduleStore = new AdventureModuleStore({
  rootDir: env.adventureModules.outputDir,
});
await moduleStore.initialize();

process.exitCode = await runImportAdventureModuleCli(process.argv.slice(2), {
  moduleStore,
  artifactStore,
  moduleRootDir: env.adventureModules.outputDir,
});
