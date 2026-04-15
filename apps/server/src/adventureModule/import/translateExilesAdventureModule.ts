import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  adventureModuleDetailSchema,
  type AdventureModuleDetail,
} from "@mighty-decks/spec/adventureModuleAuthoring";
import {
  adventureModuleIndexSchema,
  type AdventureModuleFragmentAudience,
  type AdventureModuleFragmentKind,
  type AdventureModuleFragmentRef,
} from "@mighty-decks/spec/adventureModule";
import type { AdventureArtifactStore } from "../../persistence/AdventureArtifactStore";

interface TranslateExilesAdventureModuleOptions {
  sourceDir: string;
  publicDir: string;
  artifactStore: AdventureArtifactStore;
  nowIso?: string;
}

interface LegacyFrontmatter {
  title: string;
  campaign?: string;
  chapter?: number;
  hook?: string;
  prompt?: string;
}

interface LegacyPage {
  fileName: string;
  slug: string;
  frontmatter: LegacyFrontmatter;
  body: string;
}

interface NormalizedMarkdownResult {
  content: string;
  firstImageUrl?: string;
}

interface EncounterRecord {
  fragment: AdventureModuleFragmentRef;
  detail: {
    fragmentId: string;
    prerequisites: string;
    titleImageUrl?: string;
  };
  resolved: {
    fragmentId: string;
    encounterSlug: string;
    title: string;
    summary?: string;
    prerequisites: string;
    titleImageUrl?: string;
    content: string;
  };
  content: string;
  chapter: number;
}

interface QuestRecord {
  fragment: AdventureModuleFragmentRef;
  detail: {
    fragmentId: string;
    questId: string;
    titleImageUrl?: string;
  };
  resolved: {
    fragmentId: string;
    questId: string;
    questSlug: string;
    title: string;
    summary?: string;
    titleImageUrl?: string;
    content: string;
  };
  content: string;
  questId: string;
  chapter: number;
  entryNodeId: string;
}

const CAMPAIGN_TITLE = "Exiles of the Hungry Void";
const SOURCE_MODULE_ID = "source-exiles-of-the-hungry-void";

const truncate = (value: string, maxLength: number): string =>
  value.length <= maxLength ? value : `${value.slice(0, maxLength - 3).trimEnd()}...`;

const toSlug = (value: string): string => {
  const normalized = value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\x00-\x7F]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized.length > 0 ? normalized.slice(0, 120) : "untitled";
};

const titleCase = (value: string): string =>
  value
    .split(/[_-]+/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const makeFragmentId = (kind: string, slug: string): string =>
  truncate(`frag-${kind}-${slug}`, 120);

const makeQuestId = (slug: string): string => truncate(`quest-${slug}`, 120);

const makeNodeId = (slug: string): string => truncate(`node-${slug}`, 120);

const normalizeFrontmatterValue = (value: string): string => {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith("\"") && trimmed.endsWith("\"")) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
};

const parseFrontmatter = (raw: string): { frontmatter: LegacyFrontmatter; body: string } => {
  if (!raw.startsWith("---")) {
    throw new Error("Legacy Exiles page is missing frontmatter.");
  }

  const endIndex = raw.indexOf("\n---", 3);
  if (endIndex < 0) {
    throw new Error("Legacy Exiles page frontmatter is not terminated.");
  }

  const frontmatterRaw = raw.slice(3, endIndex).trim();
  const body = raw.slice(endIndex + 4).trimStart();
  const values: Record<string, string> = {};
  for (const line of frontmatterRaw.split(/\r?\n/g)) {
    const separatorIndex = line.indexOf(":");
    if (separatorIndex < 0) {
      continue;
    }
    const key = line.slice(0, separatorIndex).trim();
    const value = normalizeFrontmatterValue(line.slice(separatorIndex + 1));
    values[key] = value;
  }

  return {
    frontmatter: {
      title: values.title ?? "Untitled",
      campaign: values.campaign,
      chapter:
        typeof values.chapter === "string" && values.chapter.length > 0
          ? Number.parseInt(values.chapter, 10)
          : undefined,
      hook: values.hook,
      prompt: values.prompt,
    },
    body,
  };
};

const replaceAsync = async (
  input: string,
  pattern: RegExp,
  replacer: (...args: string[]) => Promise<string>,
): Promise<string> => {
  const matches = [...input.matchAll(pattern)];
  if (matches.length === 0) {
    return input;
  }

  const replacements = await Promise.all(
    matches.map((match) => replacer(...(match as unknown as string[]))),
  );
  let output = input;
  for (let index = matches.length - 1; index >= 0; index -= 1) {
    const match = matches[index];
    const replacement = replacements[index];
    if (!match || replacement === undefined || match.index === undefined) {
      continue;
    }
    output =
      output.slice(0, match.index) +
      replacement +
      output.slice(match.index + match[0].length);
  }
  return output;
};

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const extractLegacyMapSlug = (tag: string, mapName: string): string | undefined => {
  const pattern = new RegExp(
    `${escapeRegExp(mapName)}(?:\\.([A-Za-z0-9_]+)|\\[(?:"([^"]+)"|'([^']+)')\\])`,
  );
  const match = tag.match(pattern);
  return match?.[1] ?? match?.[2] ?? match?.[3];
};

const extractQuotedProp = (tag: string, propName: string): string | undefined => {
  const pattern = new RegExp(`${escapeRegExp(propName)}="([^"]*)"`);
  const match = tag.match(pattern);
  return match?.[1];
};

const extractNumericProp = (tag: string, propName: string): string | undefined => {
  const pattern = new RegExp(`${escapeRegExp(propName)}=\\{([^}]+)\\}`);
  const match = tag.match(pattern);
  return match?.[1]?.trim();
};

const resolveLegacyPublicPath = async (
  publicDir: string,
  artifactStore: AdventureArtifactStore,
  sourcePath: string,
): Promise<string> => {
  const normalizedSourcePath = sourcePath.trim();
  if (
    normalizedSourcePath.length === 0 ||
    /^https?:\/\//i.test(normalizedSourcePath)
  ) {
    return normalizedSourcePath;
  }

  const relativePath = normalizedSourcePath.replace(/^\/+/, "");
  const absolutePath = join(publicDir, relativePath);
  try {
    const persisted = await artifactStore.persistLocalFile(absolutePath, {
      hint: toSlug(relativePath.split("/").pop() ?? "exiles-image"),
    });
    return persisted.fileUrl;
  } catch {
    return normalizedSourcePath;
  }
};

const normalizeLegacyMarkdown = async (options: {
  body: string;
  frontmatter: LegacyFrontmatter;
  publicDir: string;
  artifactStore: AdventureArtifactStore;
  prependGmIntent?: boolean;
}): Promise<NormalizedMarkdownResult> => {
  let content = options.body.replace(/\r\n/g, "\n");
  content = content.replace(/^\s*import\s.+$/gm, "");
  content = content.replace(/\{title\}/g, options.frontmatter.title);
  content = content.replace(/\{prompt\}/g, options.frontmatter.prompt ?? "");

  content = content.replace(
    /<Paper\b[^>]*backgroundImage:\s*'url\(([^)]+)\)'[^>]*\/>/g,
    (_match, sourcePath: string) => `![](${sourcePath.trim()})`,
  );
  content = content.replace(
    /<AreaStage\b[^>]*\/>/g,
    "## Stage\n\nLegacy area-stage diagram omitted during normalized import.",
  );
  content = content.replace(/<Columns>/g, "\n");
  content = content.replace(/<\/Columns>/g, "\n");
  content = content.replace(/<List>/g, "\n");
  content = content.replace(/<\/List>/g, "\n");
  content = content.replace(/<LinkList\b[^>]*\/>/g, "");

  content = content.replace(/<StuntCard\b([^>]*)\/>/g, (_match, attrs: string) => {
    const stuntSlug =
      extractLegacyMapSlug(attrs, "exilesStuntMap") ??
      extractLegacyMapSlug(attrs, "stuntMap") ??
      "unknown_stunt";
    return `- Stunt: ${titleCase(stuntSlug)}`;
  });
  content = content.replace(
    /<LayeredActorCard\b([^>]*)\/>/g,
    (_match, attrs: string) => {
      const actorSlug = extractLegacyMapSlug(attrs, "actorMap") ?? "unknown_actor";
      const roleSlug = extractLegacyMapSlug(attrs, "actorRoleMap");
      const modifierSlug = extractLegacyMapSlug(attrs, "actorModifierMap");
      const parts = [titleCase(actorSlug)];
      if (roleSlug) {
        parts.push(titleCase(roleSlug));
      }
      if (modifierSlug) {
        parts.push(titleCase(modifierSlug));
      }
      return `- Actor reference: ${parts.join(" / ")}`;
    },
  );
  content = content.replace(/<CounterCard\b([^>]*)\/>/g, (_match, attrs: string) => {
    const title = extractQuotedProp(attrs, "title") ?? "Counter";
    const current = extractNumericProp(attrs, "current");
    const total = extractNumericProp(attrs, "total");
    const reward = extractQuotedProp(attrs, "reward");
    const threat = extractQuotedProp(attrs, "threat");
    const lines = [
      `> Counter: ${title}${current && total ? ` (${current} / ${total})` : ""}`,
    ];
    if (reward) {
      lines.push(`> Reward: ${reward}`);
    }
    if (threat) {
      lines.push(`> Threat: ${threat}`);
    }
    return lines.join("\n");
  });

  content = await replaceAsync(
    content,
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    async (_match, altText: string, sourcePath: string) => {
      const resolved = await resolveLegacyPublicPath(
        options.publicDir,
        options.artifactStore,
        sourcePath,
      );
      return `![${altText}](${resolved})`;
    },
  );

  content = content
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line, index, allLines) => {
      if (line.trim().length > 0) {
        return true;
      }
      return allLines[index - 1]?.trim().length > 0;
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (options.prependGmIntent && options.frontmatter.prompt) {
    content = `## GM Intent\n\n${options.frontmatter.prompt}\n\n${content}`.trim();
  }

  const firstImageMatch = content.match(/!\[[^\]]*\]\(([^)]+)\)/);
  return {
    content,
    firstImageUrl: firstImageMatch?.[1],
  };
};

const toFragment = (options: {
  fragmentId: string;
  kind: AdventureModuleFragmentKind;
  title: string;
  path: string;
  summary?: string;
  tags?: string[];
  containsSpoilers?: boolean;
  intendedAudience?: AdventureModuleFragmentAudience;
}): AdventureModuleFragmentRef => ({
  fragmentId: options.fragmentId,
  kind: options.kind,
  title: truncate(options.title, 120),
  path: options.path,
  summary: options.summary ? truncate(options.summary, 320) : undefined,
  tags: options.tags ?? [],
  containsSpoilers: options.containsSpoilers ?? false,
  intendedAudience: options.intendedAudience ?? "shared",
});

const loadLegacyPages = async (sourceDir: string): Promise<LegacyPage[]> => {
  const fileNames = (await readdir(sourceDir))
    .filter((fileName) => fileName.endsWith(".mdx"))
    .sort((left, right) => left.localeCompare(right));

  const pages = await Promise.all(
    fileNames.map(async (fileName) => {
      const absolutePath = join(sourceDir, fileName);
      const raw = await readFile(absolutePath, "utf8");
      const { frontmatter, body } = parseFrontmatter(raw);
      return {
        fileName,
        slug: toSlug(frontmatter.title),
        frontmatter,
        body,
      };
    }),
  );

  return pages;
};

const buildQuestContent = (chapter: number, encounterTitles: string[]): string =>
  [
    `# Chapter ${chapter}`,
    "",
    "Imported quest spine for the normalized Exiles chapter.",
    "",
    "## Encounters",
    ...encounterTitles.map((title) => `- ${title}`),
  ].join("\n");

const buildPlayerSummary = (hook: string, coverImageUrl?: string): string =>
  [
    "# Player Summary",
    "",
    coverImageUrl ? `![](${coverImageUrl})` : "",
    hook,
    "",
    "You are exiles flying a broken corvette at the edge of the Hungry Void. Survive long enough to repair your ship, pick your battles, and decide what kind of crew you will become.",
  ]
    .filter(Boolean)
    .join("\n");

const buildStorytellerSummary = (
  hook: string,
  prompt: string,
  encounterTitles: string[],
): string =>
  [
    "# Storyteller Summary",
    "",
    `## Premise\n\n${hook}`,
    "",
    `## Campaign Intent\n\n${prompt}`,
    "",
    "## Imported Encounter Spine",
    ...encounterTitles.map((title) => `- ${title}`),
  ].join("\n");

export const translateExilesAdventureModule = async (
  options: TranslateExilesAdventureModuleOptions,
): Promise<AdventureModuleDetail> => {
  const nowIso = options.nowIso ?? new Date().toISOString();
  const pages = await loadLegacyPages(options.sourceDir);
  const introPage = pages.find((page) => page.fileName === "c0-intro.mdx");
  const shipPage = pages.find((page) => page.fileName === "c0-ship.mdx");
  if (!introPage || !shipPage) {
    throw new Error("Exiles import requires both c0-intro.mdx and c0-ship.mdx.");
  }

  const encounterPages = pages.filter(
    (page) => page.fileName !== "c0-intro.mdx" && page.fileName !== "c0-ship.mdx",
  );
  if (encounterPages.length === 0) {
    throw new Error("Exiles import requires at least one encounter page.");
  }

  const normalizedIntro = await normalizeLegacyMarkdown({
    body: introPage.body,
    frontmatter: introPage.frontmatter,
    publicDir: options.publicDir,
    artifactStore: options.artifactStore,
  });
  const normalizedShip = await normalizeLegacyMarkdown({
    body: shipPage.body,
    frontmatter: shipPage.frontmatter,
    publicDir: options.publicDir,
    artifactStore: options.artifactStore,
    prependGmIntent: true,
  });

  const coverImageUrl = normalizedIntro.firstImageUrl;
  const playerSummaryMarkdown = buildPlayerSummary(
    introPage.frontmatter.hook ?? "The Empire has exiled you to the edge of the Hungry Void.",
    coverImageUrl,
  );

  const encounterRecords: EncounterRecord[] = [];
  for (const page of encounterPages) {
    const normalized = await normalizeLegacyMarkdown({
      body: page.body,
      frontmatter: page.frontmatter,
      publicDir: options.publicDir,
      artifactStore: options.artifactStore,
      prependGmIntent: true,
    });
    const encounterSlug = page.slug;
    const chapter = page.frontmatter.chapter ?? 0;
    const fragmentId = makeFragmentId("encounter", encounterSlug);
    const fragment = toFragment({
      fragmentId,
      kind: "encounter",
      title: page.frontmatter.title,
      path: `encounters/${encounterSlug}.mdx`,
      summary: page.frontmatter.hook,
      tags: ["exiles", "imported", `chapter-${chapter}`],
      containsSpoilers: true,
      intendedAudience: "storyteller",
    });
    encounterRecords.push({
      fragment,
      detail: {
        fragmentId,
        prerequisites: "",
        titleImageUrl: normalized.firstImageUrl,
      },
      resolved: {
        fragmentId,
        encounterSlug,
        title: page.frontmatter.title,
        summary: page.frontmatter.hook
          ? truncate(page.frontmatter.hook, 320)
          : undefined,
        prerequisites: "",
        titleImageUrl: normalized.firstImageUrl,
        content: normalized.content,
      },
      content: normalized.content,
      chapter,
    });
  }

  const chapters = [...new Set(encounterRecords.map((record) => record.chapter))].sort(
    (left, right) => left - right,
  );
  const allEncounterTitles = encounterRecords.map((record) => record.fragment.title);
  const storytellerSummaryMarkdown = buildStorytellerSummary(
    introPage.frontmatter.hook ?? "The Empire has exiled you to the edge of the Hungry Void.",
    introPage.frontmatter.prompt ?? "Guide the exiles through a desperate shipbound mini-campaign.",
    allEncounterTitles,
  );

  const questRecords: QuestRecord[] = chapters.map((chapter) => {
    const chapterEncounters = encounterRecords.filter((record) => record.chapter === chapter);
    const chapterTitle =
      chapter === 0
        ? introPage.frontmatter.title
        : chapterEncounters[0]?.fragment.title ?? `Chapter ${chapter}`;
    const questSlug = toSlug(`chapter-${chapter}-${chapterTitle}`);
    const fragmentId = makeFragmentId("quest", questSlug);
    const questId = makeQuestId(questSlug);
    const fragment = toFragment({
      fragmentId,
      kind: "quest",
      title: `Chapter ${chapter} - ${chapterTitle}`,
      path: `quests/${questSlug}.mdx`,
      summary:
        chapterEncounters[0]?.resolved.summary ??
        `Imported Exiles chapter ${chapter} quest spine.`,
      tags: ["exiles", "imported", `chapter-${chapter}`],
      containsSpoilers: true,
      intendedAudience: "storyteller",
    });
    const content = buildQuestContent(
      chapter,
      chapterEncounters.map((record) => record.fragment.title),
    );
    return {
      fragment,
      detail: {
        fragmentId,
        questId,
      },
      resolved: {
        fragmentId,
        questId,
        questSlug,
        title: fragment.title,
        summary: fragment.summary,
        content,
      },
      content,
      questId,
      chapter,
      entryNodeId: makeNodeId(`${questSlug}-entry`),
    };
  });

  const locationSlug = toSlug(shipPage.frontmatter.title);
  const locationFragmentId = makeFragmentId("location", locationSlug);
  const locationFragment = toFragment({
    fragmentId: locationFragmentId,
    kind: "location",
    title: shipPage.frontmatter.title,
    path: `locations/${locationSlug}.mdx`,
    summary: shipPage.frontmatter.prompt ?? "Imported ship reference.",
    tags: ["exiles", "imported", "chapter-0", "ship"],
    containsSpoilers: false,
    intendedAudience: "shared",
  });

  const playerSummaryFragmentId = "frag-player-summary";
  const storytellerSummaryFragmentId = "frag-storyteller-summary";
  const paletteFragmentId = "frag-palette";
  const settingFragmentId = "frag-setting";
  const componentMapFragmentId = "frag-component-map";

  const commonFragments: AdventureModuleFragmentRef[] = [
    toFragment({
      fragmentId: "frag-index",
      kind: "index",
      title: "Index",
      path: "index.mdx",
      summary: "Imported module index.",
      tags: ["index", "imported"],
      containsSpoilers: false,
      intendedAudience: "shared",
    }),
    toFragment({
      fragmentId: storytellerSummaryFragmentId,
      kind: "storyteller_summary",
      title: "Storyteller Summary",
      path: "storyteller-summary.mdx",
      summary: "Imported storyteller overview.",
      tags: ["summary", "spoilers", "imported"],
      containsSpoilers: true,
      intendedAudience: "storyteller",
    }),
    toFragment({
      fragmentId: playerSummaryFragmentId,
      kind: "player_summary",
      title: "Player Summary",
      path: "player-summary.mdx",
      summary: "Spoiler-safe player invitation.",
      tags: ["summary", "players", "imported"],
      containsSpoilers: false,
      intendedAudience: "players",
    }),
    toFragment({
      fragmentId: paletteFragmentId,
      kind: "palette",
      title: "Palette",
      path: "palette.mdx",
      summary: "Imported tone and table-use guidance.",
      tags: ["palette", "imported"],
      containsSpoilers: false,
      intendedAudience: "shared",
    }),
    toFragment({
      fragmentId: settingFragmentId,
      kind: "setting",
      title: "Setting",
      path: "setting.mdx",
      summary: "Imported Exiles setting and character overview.",
      tags: ["setting", "imported"],
      containsSpoilers: false,
      intendedAudience: "shared",
    }),
    locationFragment,
    ...encounterRecords.map((record) => record.fragment),
    ...questRecords.map((record) => record.fragment),
    toFragment({
      fragmentId: componentMapFragmentId,
      kind: "component_map",
      title: "Component Map",
      path: "components/component-map.mdx",
      summary: "Imported component guidance and pressure cues.",
      tags: ["components", "imported"],
      containsSpoilers: true,
      intendedAudience: "storyteller",
    }),
  ];

  const fragments = [
    {
      fragment: commonFragments[0]!,
      content:
        "# Module Index\n\nImported from legacy Exiles of the Hungry Void MDX content.",
    },
    {
      fragment: commonFragments[1]!,
      content: storytellerSummaryMarkdown,
    },
    {
      fragment: commonFragments[2]!,
      content: playerSummaryMarkdown,
    },
    {
      fragment: commonFragments[3]!,
      content: [
        "# Palette",
        "",
        "## Dos",
        "- Lean into shipbound survival, scavenging, and uneasy alliances.",
        "- Keep pressure visible with clocks, damage, and pursuit.",
        "",
        "## Donts",
        "- Do not pause momentum with lore dumps longer than a scene beat.",
        "- Do not hide the ship's vulnerability or the Void's threat.",
      ].join("\n"),
    },
    {
      fragment: commonFragments[4]!,
      content: normalizedIntro.content,
    },
    {
      fragment: locationFragment,
      content: [
        `# ${shipPage.frontmatter.title}`,
        "",
        "## Introduction",
        "",
        shipPage.frontmatter.prompt ?? "Imported ship reference.",
        "",
        "## Description",
        "",
        normalizedShip.content,
      ].join("\n"),
    },
    ...encounterRecords.map((record) => ({
      fragment: record.fragment,
      content: record.content,
    })),
    ...questRecords.map((record) => ({
      fragment: record.fragment,
      content: record.content,
    })),
    {
      fragment: commonFragments[commonFragments.length - 1]!,
      content: [
        "# Component Opportunity Map",
        "",
        "- Imported Exiles encounter counters were normalized into markdown callouts.",
        "- Re-promote recurring ship pressure to typed counters later if table play needs it.",
      ].join("\n"),
    },
  ];

  const firstQuest = questRecords[0]!;
  const firstEncounter = encounterRecords[0]!;
  const questGraphs = questRecords.map((record) => {
    const chapterEncounters = encounterRecords.filter(
      (encounter) => encounter.chapter === record.chapter,
    );
    const nodes = chapterEncounters.map((encounter, index) => ({
      nodeId: makeNodeId(encounter.resolved.encounterSlug),
      nodeType:
        index === chapterEncounters.length - 1 ? "conclusion" : "scene",
      title: encounter.fragment.title,
      summary:
        encounter.fragment.summary ??
        `Imported Exiles encounter ${encounter.fragment.title}.`,
      locationFragmentId,
      encounterFragmentIds: [encounter.fragment.fragmentId],
      actorFragmentIds: [],
      assetFragmentIds: [],
      itemFragmentIds: [],
      pressureCounterHint:
        "Use visible ship pressure, danger, or progress counters when a beat escalates.",
      exitNotes:
        index === chapterEncounters.length - 1
          ? ["Carry chapter fallout forward to the next jump."]
          : [`Advance to ${chapterEncounters[index + 1]?.fragment.title ?? "the next beat"}.`],
    }));
    const edges = nodes.slice(0, -1).map((node, index) => ({
      edgeId: truncate(`edge-${node.nodeId}-to-${nodes[index + 1]?.nodeId ?? "next"}`, 120),
      fromNodeId: node.nodeId,
      toNodeId: nodes[index + 1]!.nodeId,
      label: "Advance",
      clueHint: "Escalation or fallout points toward the next beat.",
    }));
    return {
      questId: record.questId,
      title: record.fragment.title,
      summary: record.fragment.summary,
      hooks: [
        {
          hookId: truncate(`hook-${record.questId}`, 120),
          title: `Start Chapter ${record.chapter}`,
          prompt:
            chapterEncounters[0]?.resolved.summary ??
            `Begin chapter ${record.chapter} of Exiles of the Hungry Void.`,
          entryNodeIds: [nodes[0]!.nodeId],
          clueExamples: [
            "A distressed transmission or immediate survival need",
            "Ship systems and crew pressure push the next choice",
          ],
        },
      ],
      nodes,
      edges,
      entryNodeIds: [nodes[0]!.nodeId],
      conclusionNodeIds: [nodes[nodes.length - 1]!.nodeId],
      conclusions: [
        {
          conclusionId: truncate(`conclusion-${record.questId}`, 120),
          title: `Complete Chapter ${record.chapter}`,
          summary: `The crew survives chapter ${record.chapter} and carries new pressure into the next leg.`,
          sampleOutcomes: [
            "The ship escapes with new damage, debts, or enemies.",
          ],
          forwardHooks: [
            "The next jump or distress signal opens the following chapter.",
          ],
        },
      ],
    };
  });

  const index = adventureModuleIndexSchema.parse({
    moduleId: SOURCE_MODULE_ID,
    slug: "exiles-of-the-hungry-void",
    title: CAMPAIGN_TITLE,
    summary: truncate(
      introPage.frontmatter.hook ??
        "A desperate crew of exiles scavenges a broken corvette at the edge of the Hungry Void.",
      500,
    ),
    premise: truncate(
      introPage.frontmatter.hook ??
        "A desperate crew of exiles scavenges a broken corvette at the edge of the Hungry Void.",
      500,
    ),
    intent: truncate(
      introPage.frontmatter.prompt ??
        "Import Exiles as a normalized mini-campaign module focused on shipbound survival and escalating pressure.",
      500,
    ),
    status: "draft",
    version: 1,
    sessionScope: "mini_campaign",
    launchProfile: "dual",
    authoringControlDefault: "curate_select",
    dos: [
      "Keep the ship's fragility and momentum visible.",
      "Make every jump feel like a tradeoff between survival and ambition.",
    ],
    donts: [
      "Do not over-preserve legacy widgets at the expense of authorable markdown.",
      "Do not bury scene pressure inside hidden GM notes only.",
    ],
    tags: ["exiles", "imported", "sci-fi", "mini_campaign"],
    storytellerSummaryFragmentId,
    storytellerSummaryMarkdown,
    playerSummaryFragmentId,
    playerSummaryMarkdown,
    paletteFragmentId,
    settingFragmentId,
    componentMapFragmentId,
    locationFragmentIds: [locationFragmentId],
    locationDetails: [
      {
        fragmentId: locationFragmentId,
        introductionMarkdown:
          shipPage.frontmatter.prompt ?? "Imported ship reference from the legacy Exiles module.",
        descriptionMarkdown: normalizedShip.content,
        mapPins: [],
      },
    ],
    actorFragmentIds: [],
    actorCards: [],
    counters: [],
    assetFragmentIds: [],
    assetCards: [],
    itemFragmentIds: [],
    encounterFragmentIds: encounterRecords.map((record) => record.fragment.fragmentId),
    encounterDetails: encounterRecords.map((record) => record.detail),
    questFragmentIds: questRecords.map((record) => record.fragment.fragmentId),
    questDetails: questRecords.map((record) => record.detail),
    imagePromptFragmentIds: [],
    fragments: commonFragments,
    questGraphs,
    componentOpportunities: [
      {
        opportunityId: "opp-exiles-import-pressure",
        componentType: "counter",
        strength: "recommended",
        timing: "during_action",
        fragmentId: firstEncounter.fragment.fragmentId,
        fragmentKind: "encounter",
        questId: firstQuest.questId,
        nodeId: firstQuest.entryNodeId,
        placementLabel: "Imported Scene Pressure",
        trigger: "When the ship, crew, or immediate threat starts escalating.",
        rationale:
          "Exiles repeatedly frames survival through visible pressure and damage clocks.",
      },
    ],
    artifacts: commonFragments.map((fragment) => ({
      artifactId: truncate(`artifact-${fragment.fragmentId}`, 120),
      kind: "mdx",
      path: fragment.path,
      title: fragment.title,
      sourceFragmentId: fragment.fragmentId,
      contentType: "text/markdown",
      generatedBy: "pipeline",
      createdAtIso: nowIso,
    })),
    notes:
      "Imported from legacy Exiles of the Hungry Void MDX. Legacy UI widgets were normalized to markdown.",
    updatedAtIso: nowIso,
    postMvpExtension: true,
  });

  return adventureModuleDetailSchema.parse({
    index,
    fragments,
    locations: [
      {
        fragmentId: locationFragmentId,
        locationSlug,
        title: shipPage.frontmatter.title,
        summary: locationFragment.summary,
        introductionMarkdown:
          shipPage.frontmatter.prompt ?? "Imported ship reference from the legacy Exiles module.",
        descriptionMarkdown: normalizedShip.content,
        mapPins: [],
      },
    ],
    encounters: encounterRecords.map((record) => record.resolved),
    quests: questRecords.map((record) => record.resolved),
    actors: [],
    counters: [],
    assets: [],
    coverImageUrl,
    ownedByRequester: false,
  });
};
