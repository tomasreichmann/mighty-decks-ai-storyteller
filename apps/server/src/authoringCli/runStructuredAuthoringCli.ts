import { readFile } from "node:fs/promises";
import { z, type ZodTypeAny } from "zod";
import {
  adventureModuleCloneRequestSchema,
  adventureModuleCreateActorRequestSchema,
  adventureModuleCreateAssetRequestSchema,
  adventureModuleCreateCounterRequestSchema,
  adventureModuleCreateEncounterRequestSchema,
  adventureModuleCreateLocationRequestSchema,
  adventureModuleCreateQuestRequestSchema,
  adventureModuleCreateRequestSchema,
  adventureModuleDeleteResponseSchema,
  adventureModuleDetailSchema,
  adventureModuleGetResponseSchema,
  adventureModuleListResponseSchema,
  adventureModulePreviewResponseSchema,
  adventureModuleResolvedActorSchema,
  adventureModuleResolvedAssetSchema,
  adventureModuleResolvedCounterSchema,
  adventureModuleResolvedEncounterSchema,
  adventureModuleResolvedLocationSchema,
  adventureModuleResolvedQuestSchema,
  adventureModuleUpdateActorRequestSchema,
  adventureModuleUpdateAssetRequestSchema,
  adventureModuleUpdateCoverImageRequestSchema,
  adventureModuleUpdateCounterRequestSchema,
  adventureModuleUpdateEncounterRequestSchema,
  adventureModuleUpdateFragmentRequestSchema,
  adventureModuleUpdateIndexRequestSchema,
  adventureModuleUpdateLocationRequestSchema,
  adventureModuleUpdateQuestRequestSchema,
  type AdventureModuleDetail,
} from "@mighty-decks/spec/adventureModuleAuthoring";
import {
  campaignCreateRequestSchema,
  campaignDeleteResponseSchema,
  campaignDetailSchema,
  campaignGetResponseSchema,
  campaignListResponseSchema,
  type CampaignDetail,
} from "@mighty-decks/spec/campaign";
import { addActorFromPrompt } from "../adventureModule/authoring/addActorFromPrompt";
import {
  AdventureModuleForbiddenError,
  AdventureModuleNotFoundError,
  AdventureModuleStore,
  AdventureModuleValidationError,
} from "../persistence/AdventureModuleStore";
import {
  CampaignNotFoundError,
  CampaignStore,
  CampaignValidationError,
} from "../persistence/CampaignStore";
import type { WorkflowFactory } from "../workflow/executor";
import type { WorkflowRegistry } from "../workflow/workflowRegistry";
import { createAuthoringCatalogPayload } from "./authoringCatalogs";
import { serializeZodSchema } from "./zodSchemaSerializer";

export interface WritableLike {
  write(chunk: string): unknown;
}

export interface StructuredAuthoringCliDependencies {
  moduleStore: AdventureModuleStore;
  campaignStore: CampaignStore;
  workflowRegistry?: WorkflowRegistry;
  workflowFactory?: WorkflowFactory;
  stdout?: WritableLike;
  stderr?: WritableLike;
  stdinText?: string | null;
}

type AuthoringScope = "module" | "campaign";
type NestedResource = "actor" | "counter" | "asset" | "location" | "encounter" | "quest";
type TopLevelAction =
  | "capabilities"
  | "schema"
  | "catalog"
  | "list"
  | "get"
  | "create"
  | "clone"
  | "delete"
  | "update-index"
  | "update-fragment"
  | "update-cover-image"
  | "preview";
type NestedAction = "list" | "get" | "create" | "update" | "delete";
type CommandAction = TopLevelAction | NestedAction | "add-actor";

type AuthoringDetail = AdventureModuleDetail | CampaignDetail;
type AuthoringResourceItem =
  | AdventureModuleDetail["actors"][number]
  | AdventureModuleDetail["counters"][number]
  | AdventureModuleDetail["assets"][number]
  | AdventureModuleDetail["locations"][number]
  | AdventureModuleDetail["encounters"][number]
  | AdventureModuleDetail["quests"][number];

interface ParsedCliArgs {
  positionals: string[];
  flags: Map<string, string | boolean>;
}

interface CommandDescriptor {
  scope: AuthoringScope;
  resource: "module" | "campaign" | NestedResource;
  action: CommandAction;
  selectorFlags: string[];
  inputSchema?: ZodTypeAny;
  outputSchema?: ZodTypeAny;
  aliases?: string[];
}

class CliUsageError extends Error {}
class CliNotFoundError extends Error {}

const nestedResourceNames = [
  "actor",
  "counter",
  "asset",
  "location",
  "encounter",
  "quest",
] as const satisfies readonly NestedResource[];

const nestedActionNames = ["list", "get", "create", "update", "delete"] as const;
const moduleTopLevelActions = [
  "capabilities",
  "schema",
  "catalog",
  "list",
  "get",
  "create",
  "clone",
  "delete",
  "update-index",
  "update-fragment",
  "update-cover-image",
  "preview",
] as const satisfies readonly TopLevelAction[];
const campaignTopLevelActions = [
  "capabilities",
  "schema",
  "catalog",
  "list",
  "get",
  "create",
  "delete",
  "update-index",
  "update-fragment",
  "update-cover-image",
] as const satisfies readonly TopLevelAction[];

const resourceSelectorFlags: Record<NestedResource, string[]> = {
  actor: ["--actor", "--slug", "--fragment-id"],
  counter: ["--counter", "--slug"],
  asset: ["--asset", "--slug", "--fragment-id"],
  location: ["--location", "--slug", "--fragment-id"],
  encounter: ["--encounter", "--slug", "--fragment-id"],
  quest: ["--quest", "--slug", "--fragment-id"],
};

const resourceSlugField: Record<NestedResource, string> = {
  actor: "actorSlug",
  counter: "slug",
  asset: "assetSlug",
  location: "locationSlug",
  encounter: "encounterSlug",
  quest: "questSlug",
};

const resourceItemSchema: Record<NestedResource, ZodTypeAny> = {
  actor: adventureModuleResolvedActorSchema,
  counter: adventureModuleResolvedCounterSchema,
  asset: adventureModuleResolvedAssetSchema,
  location: adventureModuleResolvedLocationSchema,
  encounter: adventureModuleResolvedEncounterSchema,
  quest: adventureModuleResolvedQuestSchema,
};

const resourceCreateSchema: Record<NestedResource, ZodTypeAny> = {
  actor: adventureModuleCreateActorRequestSchema,
  counter: adventureModuleCreateCounterRequestSchema,
  asset: adventureModuleCreateAssetRequestSchema,
  location: adventureModuleCreateLocationRequestSchema,
  encounter: adventureModuleCreateEncounterRequestSchema,
  quest: adventureModuleCreateQuestRequestSchema,
};

const resourceUpdateSchema: Record<NestedResource, ZodTypeAny> = {
  actor: adventureModuleUpdateActorRequestSchema,
  counter: adventureModuleUpdateCounterRequestSchema,
  asset: adventureModuleUpdateAssetRequestSchema,
  location: adventureModuleUpdateLocationRequestSchema,
  encounter: adventureModuleUpdateEncounterRequestSchema,
  quest: adventureModuleUpdateQuestRequestSchema,
};

const resourcePluralKey: Record<NestedResource, keyof AuthoringDetail> = {
  actor: "actors",
  counter: "counters",
  asset: "assets",
  location: "locations",
  encounter: "encounters",
  quest: "quests",
};

const campaignCliCreateRequestSchema = z.object({
  sourceModuleId: campaignCreateRequestSchema.shape.sourceModuleId.optional(),
  sourceModuleSlug: z.string().min(1).max(120).optional(),
  title: campaignCreateRequestSchema.shape.title,
  slug: campaignCreateRequestSchema.shape.slug,
});

const parseCliArgs = (args: string[]): ParsedCliArgs => {
  const positionals: string[] = [];
  const flags = new Map<string, string | boolean>();

  for (let index = 0; index < args.length; index += 1) {
    const current = args[index];
    if (!current.startsWith("--")) {
      positionals.push(current);
      continue;
    }
    const key = current.slice(2);
    const next = args[index + 1];
    if (!next || next.startsWith("--")) {
      flags.set(key, true);
      continue;
    }
    flags.set(key, next);
    index += 1;
  }

  return { positionals, flags };
};

const getFlagString = (
  flags: Map<string, string | boolean>,
  ...keys: string[]
): string | undefined => {
  for (const key of keys) {
    const value = flags.get(key);
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return undefined;
};

const getFlagBoolean = (
  flags: Map<string, string | boolean>,
  key: string,
): boolean | undefined => {
  const value = flags.get(key);
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value !== "string") {
    return undefined;
  }
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "no"].includes(normalized)) {
    return false;
  }
  return undefined;
};

const buildJsonEnvelope = (
  scope: AuthoringScope,
  command: { resource: string; action: CommandAction; alias?: string },
  result: unknown,
) =>
  JSON.stringify(
    {
      ok: true,
      scope,
      command,
      result,
    },
    null,
    2,
  );

const buildJsonError = (
  scope: AuthoringScope,
  command: { resource: string; action: CommandAction; alias?: string },
  type: "usage" | "validation" | "not_found" | "forbidden" | "internal",
  message: string,
  details?: unknown,
) =>
  JSON.stringify(
    {
      ok: false,
      scope,
      command,
      error: {
        type,
        message,
        ...(details === undefined ? {} : { details }),
      },
    },
    null,
    2,
  );

const readInputPayload = async (
  parsed: ParsedCliArgs,
  dependencies: StructuredAuthoringCliDependencies,
): Promise<unknown> => {
  const inline = getFlagString(parsed.flags, "input-json");
  if (inline) {
    try {
      return JSON.parse(inline);
    } catch (error) {
      throw new CliUsageError(
        `Invalid JSON supplied via --input-json: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  const inputFile = getFlagString(parsed.flags, "input-file");
  if (inputFile) {
    try {
      return JSON.parse(await readFile(inputFile, "utf8"));
    } catch (error) {
      throw new CliUsageError(
        `Invalid JSON supplied via --input-file: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  if (dependencies.stdinText && dependencies.stdinText.trim().length > 0) {
    try {
      return JSON.parse(dependencies.stdinText);
    } catch (error) {
      throw new CliUsageError(
        `Invalid JSON supplied via stdin: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  return undefined;
};

const getResourceItems = (
  detail: AuthoringDetail,
  resource: NestedResource,
): readonly AuthoringResourceItem[] => detail[resourcePluralKey[resource]] as readonly AuthoringResourceItem[];

const getResourceSlug = (
  resource: NestedResource,
  item: AuthoringResourceItem | null | undefined,
): string | null => {
  if (!item) {
    return null;
  }
  const value = (item as Record<string, unknown>)[resourceSlugField[resource]];
  return typeof value === "string" && value.length > 0 ? value : null;
};

const findResourceItem = (
  detail: AuthoringDetail,
  resource: NestedResource,
  parsed: ParsedCliArgs,
): AuthoringResourceItem | null => {
  const slug = getFlagString(parsed.flags, resource, "slug");
  const fragmentId = getFlagString(parsed.flags, "fragment-id");
  const items = getResourceItems(detail, resource);
  if (slug) {
    return (
      items.find((item) => {
        const value = (item as Record<string, unknown>)[resourceSlugField[resource]];
        return typeof value === "string" && value === slug;
      }) ?? null
    );
  }
  if (fragmentId) {
    return (
      items.find((item) => {
        const value = (item as Record<string, unknown>).fragmentId;
        return typeof value === "string" && value === fragmentId;
      }) ?? null
    );
  }
  throw new CliUsageError(
    `Missing resource selector. Expected one of ${resourceSelectorFlags[resource].join(", ")}.`,
  );
};

const createResourceListSchema = (resource: NestedResource) =>
  z.object({
    items: z.array(resourceItemSchema[resource]),
    count: z.number().int().nonnegative(),
  });

const createResourceGetSchema = (resource: NestedResource) =>
  z.object({
    item: resourceItemSchema[resource],
  });

const createResourceMutationSchema = (
  resource: NestedResource,
  detailSchema: ZodTypeAny,
) =>
  z.object({
    detail: detailSchema,
    item: resourceItemSchema[resource].nullable(),
  });

const buildCommandDescriptors = (scope: AuthoringScope): CommandDescriptor[] => {
  const descriptors: CommandDescriptor[] = [];
  const topLevelActions = scope === "module" ? moduleTopLevelActions : campaignTopLevelActions;
  const detailSchema = scope === "module" ? adventureModuleDetailSchema : campaignDetailSchema;
  const listSchema = scope === "module" ? adventureModuleListResponseSchema : campaignListResponseSchema;
  const getSchema = scope === "module" ? adventureModuleGetResponseSchema : campaignGetResponseSchema;
  const deleteSchema = scope === "module" ? adventureModuleDeleteResponseSchema : campaignDeleteResponseSchema;

  for (const action of topLevelActions) {
    if (action === "capabilities" || action === "schema" || action === "catalog") {
      continue;
    }
    if (action === "clone" && scope === "module") {
      descriptors.push({
        scope,
        resource: "module",
        action,
        selectorFlags: ["--slug", "--id"],
        inputSchema: adventureModuleCloneRequestSchema,
        outputSchema: adventureModuleDetailSchema,
      });
      continue;
    }
    if (action === "preview" && scope === "module") {
      descriptors.push({
        scope,
        resource: "module",
        action,
        selectorFlags: ["--slug", "--id", "--show-spoilers", "--creator-token"],
        outputSchema: adventureModulePreviewResponseSchema,
      });
      continue;
    }
    if (action === "list") {
      descriptors.push({
        scope,
        resource: scope,
        action,
        selectorFlags: scope === "module" ? ["--creator-token"] : [],
        outputSchema: listSchema,
      });
      continue;
    }
    if (action === "get") {
      descriptors.push({
        scope,
        resource: scope,
        action,
        selectorFlags: ["--slug", "--id"],
        outputSchema: getSchema,
      });
      continue;
    }
    if (action === "create") {
      descriptors.push({
        scope,
        resource: scope,
        action,
        selectorFlags:
          scope === "campaign"
            ? ["--source-module", "--source-module-id", "--input-json", "--input-file"]
            : ["--input-json", "--input-file"],
        inputSchema:
          scope === "module" ? adventureModuleCreateRequestSchema : campaignCliCreateRequestSchema,
        outputSchema: detailSchema,
      });
      continue;
    }
    if (action === "delete") {
      descriptors.push({
        scope,
        resource: scope,
        action,
        selectorFlags: ["--slug", "--id"],
        outputSchema: deleteSchema,
      });
      continue;
    }
    if (action === "update-index") {
      descriptors.push({
        scope,
        resource: scope,
        action,
        selectorFlags: ["--slug", "--id", "--input-json", "--input-file"],
        inputSchema: adventureModuleUpdateIndexRequestSchema,
        outputSchema: detailSchema,
      });
      continue;
    }
    if (action === "update-fragment") {
      descriptors.push({
        scope,
        resource: scope,
        action,
        selectorFlags: ["--slug", "--id", "--fragment-id", "--input-json", "--input-file"],
        inputSchema: adventureModuleUpdateFragmentRequestSchema,
        outputSchema: detailSchema,
      });
      continue;
    }
    if (action === "update-cover-image") {
      descriptors.push({
        scope,
        resource: scope,
        action,
        selectorFlags: ["--slug", "--id", "--input-json", "--input-file"],
        inputSchema: adventureModuleUpdateCoverImageRequestSchema,
        outputSchema: detailSchema,
      });
    }
  }

  for (const resource of nestedResourceNames) {
    for (const action of nestedActionNames) {
      descriptors.push({
        scope,
        resource,
        action,
        selectorFlags: [
          scope === "module" ? "--module" : "--campaign",
          scope === "module" ? "--module-id" : "--campaign-id",
          ...(action === "list" || action === "create" ? [] : resourceSelectorFlags[resource]),
          ...(action === "create" || action === "update" ? ["--input-json", "--input-file"] : []),
        ],
        inputSchema:
          action === "create"
            ? resourceCreateSchema[resource]
            : action === "update"
              ? resourceUpdateSchema[resource]
              : undefined,
        outputSchema:
          action === "list"
            ? createResourceListSchema(resource)
            : action === "get"
              ? createResourceGetSchema(resource)
              : createResourceMutationSchema(resource, detailSchema),
      });
    }
  }

  if (scope === "module") {
    descriptors.push({
      scope,
      resource: "actor",
      action: "add-actor",
      selectorFlags: ["--module", "--prompt", "--creator-token"],
      aliases: ["add-actor"],
    });
  }

  return descriptors;
};

const resolveTopLevelCommand = (
  scope: AuthoringScope,
  parsed: ParsedCliArgs,
): { resource: "module" | "campaign" | NestedResource; action: CommandAction; alias?: string } => {
  const [first, second] = parsed.positionals;
  if (scope === "module" && first === "add-actor") {
    return { resource: "actor", action: "add-actor", alias: "add-actor" };
  }
  const topLevelActions = scope === "module" ? moduleTopLevelActions : campaignTopLevelActions;
  if (typeof first === "string" && (topLevelActions as readonly string[]).includes(first)) {
    return { resource: scope, action: first as CommandAction };
  }
  if (
    typeof first === "string" &&
    (nestedResourceNames as readonly string[]).includes(first) &&
    typeof second === "string" &&
    (nestedActionNames as readonly string[]).includes(second)
  ) {
    return { resource: first as NestedResource, action: second as CommandAction };
  }
  throw new CliUsageError(
    scope === "module"
      ? "Unknown command. Use a module top-level command or `<resource> <action>`."
      : "Unknown command. Use a campaign top-level command or `<resource> <action>`.",
  );
};

const resolveModuleDetail = async (
  parsed: ParsedCliArgs,
  dependencies: StructuredAuthoringCliDependencies,
  selector: "top-level" | "nested",
): Promise<{ detail: AdventureModuleDetail; creatorToken?: string }> => {
  const creatorToken = getFlagString(parsed.flags, "creator-token");
  const moduleId = getFlagString(parsed.flags, selector === "nested" ? "module-id" : "id");
  const moduleSlug = getFlagString(parsed.flags, selector === "nested" ? "module" : "slug");
  const detail = moduleId
    ? await dependencies.moduleStore.getModule(moduleId, creatorToken)
    : moduleSlug
      ? await dependencies.moduleStore.getModuleBySlug(moduleSlug, creatorToken)
      : null;
  if (!detail) {
    throw new CliNotFoundError("Adventure Module not found.");
  }
  return { detail, creatorToken };
};

const resolveCampaignDetail = async (
  parsed: ParsedCliArgs,
  dependencies: StructuredAuthoringCliDependencies,
  selector: "top-level" | "nested",
): Promise<CampaignDetail> => {
  const campaignId = getFlagString(parsed.flags, selector === "nested" ? "campaign-id" : "id");
  const campaignSlug = getFlagString(parsed.flags, selector === "nested" ? "campaign" : "slug");
  const detail = campaignId
    ? await dependencies.campaignStore.getCampaign(campaignId)
    : campaignSlug
      ? await dependencies.campaignStore.getCampaignBySlug(campaignSlug)
      : null;
  if (!detail) {
    throw new CliNotFoundError("Campaign not found.");
  }
  return detail;
};

const resolveSourceModuleId = async (
  payload: unknown,
  parsed: ParsedCliArgs,
  dependencies: StructuredAuthoringCliDependencies,
): Promise<string> => {
  const parsedPayload = campaignCliCreateRequestSchema.parse({
    ...(typeof payload === "object" && payload !== null ? payload : {}),
    sourceModuleSlug:
      getFlagString(parsed.flags, "source-module") ??
      (typeof payload === "object" && payload !== null && "sourceModuleSlug" in payload
        ? String((payload as Record<string, unknown>).sourceModuleSlug ?? "")
        : undefined),
    sourceModuleId:
      getFlagString(parsed.flags, "source-module-id") ??
      (typeof payload === "object" && payload !== null && "sourceModuleId" in payload
        ? String((payload as Record<string, unknown>).sourceModuleId ?? "")
        : undefined),
  });

  if (parsedPayload.sourceModuleId) {
    return parsedPayload.sourceModuleId;
  }

  if (!parsedPayload.sourceModuleSlug) {
    throw new CliUsageError(
      "Campaign create requires `sourceModuleId`, `sourceModuleSlug`, `--source-module`, or `--source-module-id`.",
    );
  }
  const sourceModule = await dependencies.moduleStore.getModuleBySlug(parsedPayload.sourceModuleSlug);
  if (!sourceModule) {
    throw new CliNotFoundError(
      `Source module '${parsedPayload.sourceModuleSlug}' was not found.`,
    );
  }
  return sourceModule.index.moduleId;
};

const executeModuleTopLevel = async (
  action: CommandAction,
  parsed: ParsedCliArgs,
  dependencies: StructuredAuthoringCliDependencies,
): Promise<unknown> => {
  if (action === "capabilities") {
    return {
      scope: "module",
      discoveryCommands: ["capabilities", "schema", "catalog"],
      topLevel: moduleTopLevelActions,
      nestedResources: Object.fromEntries(
        nestedResourceNames.map((resource) => [resource, [...nestedActionNames]]),
      ),
      selectorFlags: {
        module: ["--slug", "--id"],
        nestedParent: ["--module", "--module-id"],
        creatorToken: ["--creator-token"],
      },
      inputModes: ["--input-json", "--input-file", "stdin"],
      compatibilityAliases: ["add-actor"],
    };
  }

  if (action === "schema") {
    const resourceFilter = getFlagString(parsed.flags, "resource");
    const actionFilter = getFlagString(parsed.flags, "action");
    return {
      operations: buildCommandDescriptors("module")
        .filter((descriptor) =>
          resourceFilter ? descriptor.resource === resourceFilter : true,
        )
        .filter((descriptor) => (actionFilter ? descriptor.action === actionFilter : true))
        .map((descriptor) => ({
          scope: descriptor.scope,
          resource: descriptor.resource,
          action: descriptor.action,
          aliases: descriptor.aliases ?? [],
          selectorFlags: descriptor.selectorFlags,
          inputSchema: descriptor.inputSchema
            ? serializeZodSchema(descriptor.inputSchema)
            : null,
          outputSchema: descriptor.outputSchema
            ? serializeZodSchema(descriptor.outputSchema)
            : null,
        })),
    };
  }

  if (action === "catalog") {
    return createAuthoringCatalogPayload();
  }

  if (action === "list") {
    const creatorToken = getFlagString(parsed.flags, "creator-token");
    return { modules: await dependencies.moduleStore.listModules(creatorToken) };
  }

  if (action === "create") {
    const payload = adventureModuleCreateRequestSchema.parse((await readInputPayload(parsed, dependencies)) ?? {});
    return dependencies.moduleStore.createModule({
      creatorToken: getFlagString(parsed.flags, "creator-token"),
      title: payload.title,
      slug: payload.slug,
      seedPrompt: payload.seedPrompt,
      sessionScope: payload.sessionScope,
      launchProfile: payload.launchProfile,
    });
  }

  if (action === "clone") {
    const payload = adventureModuleCloneRequestSchema.parse((await readInputPayload(parsed, dependencies)) ?? {});
    const { detail, creatorToken } = await resolveModuleDetail(parsed, dependencies, "top-level");
    return dependencies.moduleStore.cloneModule({
      sourceModuleId: detail.index.moduleId,
      creatorToken,
      title: payload.title,
      slug: payload.slug,
    });
  }

  const { detail, creatorToken } = await resolveModuleDetail(parsed, dependencies, "top-level");

  if (action === "get") {
    return detail;
  }
  if (action === "delete") {
    await dependencies.moduleStore.deleteModule({
      moduleId: detail.index.moduleId,
      creatorToken,
    });
    return { deleted: true };
  }
  if (action === "update-index") {
    const payload = adventureModuleUpdateIndexRequestSchema.parse(await readInputPayload(parsed, dependencies));
    return dependencies.moduleStore.updateIndex({
      moduleId: detail.index.moduleId,
      index: payload.index,
      creatorToken,
    });
  }
  if (action === "update-fragment") {
    const payload = adventureModuleUpdateFragmentRequestSchema.parse(await readInputPayload(parsed, dependencies));
    const fragmentId = getFlagString(parsed.flags, "fragment-id");
    if (!fragmentId) {
      throw new CliUsageError("Missing required --fragment-id.");
    }
    return dependencies.moduleStore.updateFragment({
      moduleId: detail.index.moduleId,
      fragmentId,
      content: payload.content,
      creatorToken,
    });
  }
  if (action === "update-cover-image") {
    const payload = adventureModuleUpdateCoverImageRequestSchema.parse(await readInputPayload(parsed, dependencies));
    return dependencies.moduleStore.updateCoverImage({
      moduleId: detail.index.moduleId,
      creatorToken,
      coverImageUrl: payload.coverImageUrl ?? undefined,
    });
  }
  if (action === "preview") {
    return dependencies.moduleStore.buildPreview({
      moduleId: detail.index.moduleId,
      creatorToken,
      showSpoilers: getFlagBoolean(parsed.flags, "show-spoilers"),
    });
  }
  throw new CliUsageError(`Unsupported module action '${action}'.`);
};

const executeCampaignTopLevel = async (
  action: CommandAction,
  parsed: ParsedCliArgs,
  dependencies: StructuredAuthoringCliDependencies,
): Promise<unknown> => {
  if (action === "capabilities") {
    return {
      scope: "campaign",
      discoveryCommands: ["capabilities", "schema", "catalog"],
      topLevel: campaignTopLevelActions,
      nestedResources: Object.fromEntries(
        nestedResourceNames.map((resource) => [resource, [...nestedActionNames]]),
      ),
      selectorFlags: {
        campaign: ["--slug", "--id"],
        nestedParent: ["--campaign", "--campaign-id"],
        sourceModule: ["--source-module", "--source-module-id"],
      },
      inputModes: ["--input-json", "--input-file", "stdin"],
    };
  }

  if (action === "schema") {
    const resourceFilter = getFlagString(parsed.flags, "resource");
    const actionFilter = getFlagString(parsed.flags, "action");
    return {
      operations: buildCommandDescriptors("campaign")
        .filter((descriptor) =>
          resourceFilter ? descriptor.resource === resourceFilter : true,
        )
        .filter((descriptor) => (actionFilter ? descriptor.action === actionFilter : true))
        .map((descriptor) => ({
          scope: descriptor.scope,
          resource: descriptor.resource,
          action: descriptor.action,
          aliases: descriptor.aliases ?? [],
          selectorFlags: descriptor.selectorFlags,
          inputSchema: descriptor.inputSchema
            ? serializeZodSchema(descriptor.inputSchema)
            : null,
          outputSchema: descriptor.outputSchema
            ? serializeZodSchema(descriptor.outputSchema)
            : null,
        })),
    };
  }

  if (action === "catalog") {
    return createAuthoringCatalogPayload();
  }

  if (action === "list") {
    return { campaigns: await dependencies.campaignStore.listCampaigns() };
  }

  if (action === "create") {
    const payload = (await readInputPayload(parsed, dependencies)) ?? {};
    const sourceModuleId = await resolveSourceModuleId(payload, parsed, dependencies);
    const parsedPayload = campaignCliCreateRequestSchema.parse({
      ...(typeof payload === "object" && payload !== null ? payload : {}),
      sourceModuleId,
    });
    return dependencies.campaignStore.createCampaign({
      sourceModuleId,
      title: parsedPayload.title,
      slug: parsedPayload.slug,
    });
  }

  const detail = await resolveCampaignDetail(parsed, dependencies, "top-level");

  if (action === "get") {
    return detail;
  }
  if (action === "delete") {
    await dependencies.campaignStore.deleteCampaign({
      campaignId: detail.campaignId,
    });
    return { deleted: true };
  }
  if (action === "update-index") {
    const payload = adventureModuleUpdateIndexRequestSchema.parse(await readInputPayload(parsed, dependencies));
    return dependencies.campaignStore.updateIndex({
      campaignId: detail.campaignId,
      index: payload.index,
    });
  }
  if (action === "update-fragment") {
    const payload = adventureModuleUpdateFragmentRequestSchema.parse(await readInputPayload(parsed, dependencies));
    const fragmentId = getFlagString(parsed.flags, "fragment-id");
    if (!fragmentId) {
      throw new CliUsageError("Missing required --fragment-id.");
    }
    return dependencies.campaignStore.updateFragment({
      campaignId: detail.campaignId,
      fragmentId,
      content: payload.content,
    });
  }
  if (action === "update-cover-image") {
    const payload = adventureModuleUpdateCoverImageRequestSchema.parse(await readInputPayload(parsed, dependencies));
    return dependencies.campaignStore.updateCoverImage({
      campaignId: detail.campaignId,
      coverImageUrl: payload.coverImageUrl ?? undefined,
    });
  }
  throw new CliUsageError(`Unsupported campaign action '${action}'.`);
};

const executeNestedCommand = async (
  scope: AuthoringScope,
  resource: NestedResource,
  action: CommandAction,
  parsed: ParsedCliArgs,
  dependencies: StructuredAuthoringCliDependencies,
): Promise<unknown> => {
  const moduleSelection =
    scope === "module"
      ? await resolveModuleDetail(parsed, dependencies, "nested")
      : null;
  const campaignDetail =
    scope === "campaign"
      ? await resolveCampaignDetail(parsed, dependencies, "nested")
      : null;
  const detail = moduleSelection?.detail ?? campaignDetail;
  if (!detail) {
    throw new CliNotFoundError("Parent record not found.");
  }

  if (action === "list") {
    const items = getResourceItems(detail, resource);
    return { items, count: items.length };
  }
  if (action === "get") {
    const item = findResourceItem(detail, resource, parsed);
    if (!item) {
      throw new CliNotFoundError(`${resource} not found.`);
    }
    return { item };
  }

  const payload =
    action === "create"
        ? resourceCreateSchema[resource].parse((await readInputPayload(parsed, dependencies)) ?? {})
      : action === "update"
        ? resourceUpdateSchema[resource].parse(await readInputPayload(parsed, dependencies))
        : undefined;
  const existingItem = action === "create" ? null : findResourceItem(detail, resource, parsed);
  if (action !== "create" && !existingItem) {
    throw new CliNotFoundError(`${resource} not found.`);
  }
  const existingSlug = getResourceSlug(resource, existingItem);
  if (action !== "create" && !existingSlug) {
    throw new CliNotFoundError(`${resource} slug could not be resolved.`);
  }

  let nextDetail!: AuthoringDetail;
  if (scope === "module") {
    const parentId = moduleSelection?.detail.index.moduleId;
    if (!parentId) {
      throw new CliNotFoundError("Adventure Module not found.");
    }
    const creatorToken = moduleSelection?.creatorToken;
    switch (resource) {
      case "actor":
        nextDetail =
          action === "create"
            ? await dependencies.moduleStore.createActor({ moduleId: parentId, creatorToken, ...payload })
            : action === "update"
              ? await dependencies.moduleStore.updateActor({
                  moduleId: parentId,
                  creatorToken,
                  actorSlug: existingSlug ?? "",
                  ...(payload ?? {}),
                })
              : await dependencies.moduleStore.deleteActor({
                  moduleId: parentId,
                  creatorToken,
                  actorSlug: existingSlug ?? "",
                });
        break;
      case "counter":
        nextDetail =
          action === "create"
            ? await dependencies.moduleStore.createCounter({ moduleId: parentId, creatorToken, ...payload })
            : action === "update"
              ? await dependencies.moduleStore.updateCounter({
                  moduleId: parentId,
                  creatorToken,
                  counterSlug: existingSlug ?? "",
                  ...(payload ?? {}),
                })
              : await dependencies.moduleStore.deleteCounter({
                  moduleId: parentId,
                  creatorToken,
                  counterSlug: existingSlug ?? "",
                });
        break;
      case "asset":
        nextDetail =
          action === "create"
            ? await dependencies.moduleStore.createAsset({ moduleId: parentId, creatorToken, ...payload })
            : action === "update"
              ? await dependencies.moduleStore.updateAsset({
                  moduleId: parentId,
                  creatorToken,
                  assetSlug: existingSlug ?? "",
                  ...(payload ?? {}),
                })
              : await dependencies.moduleStore.deleteAsset({
                  moduleId: parentId,
                  creatorToken,
                  assetSlug: existingSlug ?? "",
                });
        break;
      case "location":
        nextDetail =
          action === "create"
            ? await dependencies.moduleStore.createLocation({ moduleId: parentId, creatorToken, ...payload })
            : action === "update"
              ? await dependencies.moduleStore.updateLocation({
                  moduleId: parentId,
                  creatorToken,
                  locationSlug: existingSlug ?? "",
                  ...(payload ?? {}),
                })
              : await dependencies.moduleStore.deleteLocation({
                  moduleId: parentId,
                  creatorToken,
                  locationSlug: existingSlug ?? "",
                });
        break;
      case "encounter":
        nextDetail =
          action === "create"
            ? await dependencies.moduleStore.createEncounter({ moduleId: parentId, creatorToken, ...payload })
            : action === "update"
              ? await dependencies.moduleStore.updateEncounter({
                  moduleId: parentId,
                  creatorToken,
                  encounterSlug: existingSlug ?? "",
                  ...(payload ?? {}),
                })
              : await dependencies.moduleStore.deleteEncounter({
                  moduleId: parentId,
                  creatorToken,
                  encounterSlug: existingSlug ?? "",
                });
        break;
      case "quest":
        nextDetail =
          action === "create"
            ? await dependencies.moduleStore.createQuest({ moduleId: parentId, creatorToken, ...payload })
            : action === "update"
              ? await dependencies.moduleStore.updateQuest({
                  moduleId: parentId,
                  creatorToken,
                  questSlug: existingSlug ?? "",
                  ...(payload ?? {}),
                })
              : await dependencies.moduleStore.deleteQuest({
                  moduleId: parentId,
                  creatorToken,
                  questSlug: existingSlug ?? "",
                });
        break;
    }
  } else {
    const parentId = campaignDetail?.campaignId;
    if (!parentId) {
      throw new CliNotFoundError("Campaign not found.");
    }
    switch (resource) {
      case "actor":
        nextDetail =
          action === "create"
            ? await dependencies.campaignStore.createActor({ campaignId: parentId, ...payload })
            : action === "update"
              ? await dependencies.campaignStore.updateActor({
                  campaignId: parentId,
                  actorSlug: existingSlug ?? "",
                  ...(payload ?? {}),
                })
              : await dependencies.campaignStore.deleteActor({
                  campaignId: parentId,
                  actorSlug: existingSlug ?? "",
                });
        break;
      case "counter":
        nextDetail =
          action === "create"
            ? await dependencies.campaignStore.createCounter({ campaignId: parentId, ...payload })
            : action === "update"
              ? await dependencies.campaignStore.updateCounter({
                  campaignId: parentId,
                  counterSlug: existingSlug ?? "",
                  ...(payload ?? {}),
                })
              : await dependencies.campaignStore.deleteCounter({
                  campaignId: parentId,
                  counterSlug: existingSlug ?? "",
                });
        break;
      case "asset":
        nextDetail =
          action === "create"
            ? await dependencies.campaignStore.createAsset({ campaignId: parentId, ...payload })
            : action === "update"
              ? await dependencies.campaignStore.updateAsset({
                  campaignId: parentId,
                  assetSlug: existingSlug ?? "",
                  ...(payload ?? {}),
                })
              : await dependencies.campaignStore.deleteAsset({
                  campaignId: parentId,
                  assetSlug: existingSlug ?? "",
                });
        break;
      case "location":
        nextDetail =
          action === "create"
            ? await dependencies.campaignStore.createLocation({ campaignId: parentId, ...payload })
            : action === "update"
              ? await dependencies.campaignStore.updateLocation({
                  campaignId: parentId,
                  locationSlug: existingSlug ?? "",
                  ...(payload ?? {}),
                })
              : await dependencies.campaignStore.deleteLocation({
                  campaignId: parentId,
                  locationSlug: existingSlug ?? "",
                });
        break;
      case "encounter":
        nextDetail =
          action === "create"
            ? await dependencies.campaignStore.createEncounter({ campaignId: parentId, ...payload })
            : action === "update"
              ? await dependencies.campaignStore.updateEncounter({
                  campaignId: parentId,
                  encounterSlug: existingSlug ?? "",
                  ...(payload ?? {}),
                })
              : await dependencies.campaignStore.deleteEncounter({
                  campaignId: parentId,
                  encounterSlug: existingSlug ?? "",
                });
        break;
      case "quest":
        nextDetail =
          action === "create"
            ? await dependencies.campaignStore.createQuest({ campaignId: parentId, ...payload })
            : action === "update"
              ? await dependencies.campaignStore.updateQuest({
                  campaignId: parentId,
                  questSlug: existingSlug ?? "",
                  ...(payload ?? {}),
                })
              : await dependencies.campaignStore.deleteQuest({
                  campaignId: parentId,
                  questSlug: existingSlug ?? "",
                });
        break;
    }
  }

  const createdSlug = getResourceSlug(resource, getResourceItems(nextDetail, resource).at(-1) ?? null);
  const selectedItem =
    action === "delete"
      ? null
      : findResourceItem(
          nextDetail,
          resource,
          action === "create" && createdSlug
            ? {
                ...parsed,
                flags: new Map([...parsed.flags.entries(), [resource, createdSlug]]),
              }
            : parsed,
        );

  return {
    detail: nextDetail,
    item: selectedItem,
  };
};

const executeCompatibilityAddActor = async (
  parsed: ParsedCliArgs,
  dependencies: StructuredAuthoringCliDependencies,
): Promise<unknown> => {
  const moduleSlug = getFlagString(parsed.flags, "module");
  const prompt = getFlagString(parsed.flags, "prompt");
  if (!moduleSlug || !prompt) {
    throw new CliUsageError(
      "The add-actor alias requires --module <module-slug> and --prompt <text>.",
    );
  }
  if (!dependencies.workflowRegistry || !dependencies.workflowFactory) {
    throw new CliUsageError("Workflow dependencies are not configured for add-actor.");
  }
  const result = await addActorFromPrompt({
    moduleSlug,
    prompt,
    creatorToken: getFlagString(parsed.flags, "creator-token"),
    moduleStore: dependencies.moduleStore,
    workflowRegistry: dependencies.workflowRegistry,
    workflowFactory: dependencies.workflowFactory,
  });
  return {
    detail: result.module,
    item: result.actor,
    actorPath: result.actorPath,
    draft: result.draft,
  };
};

const mapCliError = (
  error: unknown,
): { type: "usage" | "validation" | "not_found" | "forbidden" | "internal"; message: string; details?: unknown } => {
  if (error instanceof CliUsageError) {
    return { type: "usage", message: error.message };
  }
  if (
    error instanceof z.ZodError ||
    error instanceof AdventureModuleValidationError ||
    error instanceof CampaignValidationError
  ) {
    return {
      type: "validation",
      message: error instanceof z.ZodError ? "Validation failed." : error.message,
      details: error instanceof z.ZodError ? error.issues : undefined,
    };
  }
  if (error instanceof AdventureModuleForbiddenError) {
    return { type: "forbidden", message: error.message };
  }
  if (
    error instanceof CliNotFoundError ||
    error instanceof AdventureModuleNotFoundError ||
    error instanceof CampaignNotFoundError
  ) {
    return { type: "not_found", message: error.message };
  }
  return {
    type: "internal",
    message: error instanceof Error ? error.message : String(error),
  };
};

export const runStructuredAuthoringCli = async (
  scope: AuthoringScope,
  args: string[],
  dependencies: StructuredAuthoringCliDependencies,
): Promise<number> => {
  const stdout = dependencies.stdout ?? process.stdout;
  const parsed = parseCliArgs(args);
  let command: { resource: string; action: CommandAction; alias?: string } = {
    resource: scope,
    action: "capabilities",
  };

  try {
    command = resolveTopLevelCommand(scope, parsed);
    const result =
      command.action === "add-actor"
        ? await executeCompatibilityAddActor(parsed, dependencies)
        : command.resource === "module" || command.resource === "campaign"
          ? scope === "module"
            ? await executeModuleTopLevel(command.action, parsed, dependencies)
            : await executeCampaignTopLevel(command.action, parsed, dependencies)
          : await executeNestedCommand(
              scope,
              command.resource as NestedResource,
              command.action,
              parsed,
              dependencies,
            );

    stdout.write(`${buildJsonEnvelope(scope, command, result)}\n`);
    return 0;
  } catch (error) {
    const mapped = mapCliError(error);
    stdout.write(
      `${buildJsonError(scope, command, mapped.type, mapped.message, mapped.details)}\n`,
    );
    return mapped.type === "internal" ? 2 : 1;
  }
};
