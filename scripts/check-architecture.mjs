import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { resolve, dirname, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { gitSourcePaths } from "./check-file-lengths.mjs";

const rootDefault = resolve(fileURLToPath(new URL("..", import.meta.url)));
const requireServer = createRequire(resolve(rootDefault, "apps/server/package.json"));
const ts = requireServer("typescript");
const runtimeOwners = [
  "campaign/runtime/", "campaign/read/", "campaign/state/", "campaign/content/",
  "campaign/mechanics/", "campaign/history/", "campaign/tools/", "ai/useCases/",
  "ai/context/", "ai/prompts/", "ai/execution/", "ai/providers/",
  "observability/", "persistence/campaignState/",
];
const providerClients = new Set([
  "ai/OpenRouterClient.ts", "ai/GroqClient.ts", "ai/ClaudeCliClient.ts",
  "image/FalClient.ts", "image/LeonardoClient.ts",
]);
const legacyProviderOwners = new Set([
  "index.ts", "ai/ClaudeCliClient.ts", "ai/GroqClient.ts",
  "ai/storyteller/modelRunners.ts", "ai/storyteller/types.ts",
  "ai/workflow/openRouterWorkflowAdapters.ts", "ai/workflow/createWorkflowAdapters.ts",
  "image/CharacterPortraitService.ts", "image/ImageGenerationService.ts",
]);

function importSpecifiers(source, fileName) {
  const ast = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true);
  const imports = [];
  function visit(node) {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      imports.push(node.moduleSpecifier.text);
    }
    if (ts.isCallExpression(node) && node.arguments.length === 1 && ts.isStringLiteral(node.arguments[0])) {
      if (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
          (ts.isIdentifier(node.expression) && node.expression.text === "require")) imports.push(node.arguments[0].text);
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  return imports;
}

function resolveEdge(importer, specifier, root) {
  if (specifier.startsWith("node:")) return specifier;
  const base = resolve(root, importer);
  const result = ts.resolveModuleName(specifier, base, {
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    baseUrl: root,
  }, ts.sys).resolvedModule?.resolvedFileName;
  if (result) return relative(root, result).split(sep).join("/");
  if (specifier.startsWith(".")) return `${relative(root, resolve(dirname(base), specifier)).split(sep).join("/")}.ts`;
  return specifier;
}

export function inspectArchitecture(importer, source, root = rootDefault) {
  const prefix = "apps/server/src/";
  if (!importer.startsWith(prefix)) return [];
  const owner = importer.slice(prefix.length);
  const isRuntime = runtimeOwners.some((path) => owner.startsWith(path));
  const findings = [];
  for (const specifier of importSpecifiers(source, importer)) {
    const target = resolveEdge(importer, specifier, root);
    const serverTarget = target.startsWith(prefix) ? target.slice(prefix.length) : null;
    const forbiddenProvider = serverTarget && providerClients.has(serverTarget) &&
      !owner.startsWith("ai/providers/") && !legacyProviderOwners.has(owner);
    if (forbiddenProvider) findings.push(`${importer}: provider client ${specifier} belongs in ai/providers or composition`);
    if (!isRuntime) continue;
    if (["node:fs", "fs", "fs/promises"].includes(target) || target.startsWith("node:fs/")) {
      findings.push(`${importer}: runtime cannot import filesystem persistence`);
    } else if (target.startsWith("apps/web/")) {
      findings.push(`${importer}: runtime cannot import web code`);
    } else if (serverTarget && !runtimeOwners.some((path) => serverTarget.startsWith(path)) &&
      !(owner.startsWith("ai/providers/") && providerClients.has(serverTarget))) {
      findings.push(`${importer}: runtime cannot import legacy server module ${specifier}`);
    }
  }
  return findings;
}

export function run(root = rootDefault) {
  const paths = gitSourcePaths(root).filter((path) => path.startsWith("apps/server/src/") && path.endsWith(".ts"));
  const findings = paths.flatMap((path) => inspectArchitecture(path, readFileSync(resolve(root, path), "utf8"), root));
  for (const finding of findings) console.log(`error: ${finding}`);
  console.log(`Architecture: ${findings.length} forbidden import edges. Legacy provider owners: ${[...legacyProviderOwners].join(", ")}.`);
  return findings.length ? 1 : 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = run(process.argv[2] ? resolve(process.argv[2]) : rootDefault);
}
