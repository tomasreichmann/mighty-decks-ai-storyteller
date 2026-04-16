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
import type {
  ActorBaseLayerSlug,
  ActorTacticalRoleSlug,
  ActorTacticalSpecialSlug,
} from "@mighty-decks/spec/actorCards";
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

const LEGACY_MODULE_PUBLIC_ROOT = "mighty-decks/encounters/exiles_of_the_hungry_void";
const LEGACY_IMAGE_FILE_PATTERN = /\.(png|jpe?g|webp|gif)$/i;

interface CuratedActorDefinition {
  title: string;
  slug: string;
  aliases: string[];
  baseLayerSlug: ActorBaseLayerSlug;
  tacticalRoleSlug: ActorTacticalRoleSlug;
  tacticalSpecialSlug?: ActorTacticalSpecialSlug;
  isPlayerCharacter: boolean;
  summary: string;
  noteLines: string[];
  portraitPaths?: string[];
}

interface CuratedAssetDefinition {
  title: string;
  slug: string;
  aliases: string[];
  modifier: string;
  noun: string;
  nounDescription: string;
  adjectiveDescription: string;
  iconPath: string;
  summary: string;
  noteLines: string[];
}

const createGameCardJsx = (
  type: "ActorCard" | "AssetCard",
  slug: string,
  options: {
    modifierSlug?: string;
  } = {},
): string => {
  const modifierSlug = options.modifierSlug?.trim() ?? "";
  return modifierSlug.length > 0
    ? `<GameCard type="${type}" slug="${slug}" modifierSlug="${modifierSlug}" />`
    : `<GameCard type="${type}" slug="${slug}" />`;
};

const normalizeLegacyImagePathKey = (sourcePath: string): string => {
  const trimmed = sourcePath.trim().replace(/^\/+/, "");
  return trimmed.startsWith("public/") ? trimmed.slice("public/".length) : trimmed;
};

const makeLegacyImageKey = (relativePath: string): string =>
  `${LEGACY_MODULE_PUBLIC_ROOT}/${relativePath.replace(/\\/g, "/").replace(/^\/+/, "")}`;

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const findLegacyArtifactUrl = (
  legacyArtifactUrlsByPath: ReadonlyMap<string, string> | undefined,
  ...candidatePaths: string[]
): string | undefined => {
  if (!legacyArtifactUrlsByPath) {
    return undefined;
  }

  const normalizedCandidates = candidatePaths
    .map((candidate) => candidate.replace(/\\/g, "/").replace(/^\/+/, ""))
    .filter((candidate) => candidate.length > 0);

  for (const candidate of normalizedCandidates) {
    const exactMatch = legacyArtifactUrlsByPath.get(candidate);
    if (exactMatch) {
      return exactMatch;
    }
  }

  for (const [legacyPath, fileUrl] of legacyArtifactUrlsByPath.entries()) {
    const normalizedLegacyPath = legacyPath.replace(/\\/g, "/");
    for (const candidate of normalizedCandidates) {
      if (
        normalizedLegacyPath === candidate ||
        normalizedLegacyPath.endsWith(candidate) ||
        normalizedLegacyPath.endsWith(`/${candidate}`)
      ) {
        return fileUrl;
      }
    }
  }

  return undefined;
};

const collectLegacyImageArtifacts = async (
  modulePublicDir: string,
  artifactStore: AdventureArtifactStore,
): Promise<Map<string, string>> => {
  const artifactUrlsByLegacyPath = new Map<string, string>();

  const walk = async (currentDir: string, legacyPathPrefix = ""): Promise<void> => {
    const entries = await readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (entry.name === "music") {
          continue;
        }
        const nextPrefix = legacyPathPrefix.length > 0 ? `${legacyPathPrefix}/${entry.name}` : entry.name;
        await walk(join(currentDir, entry.name), nextPrefix);
        continue;
      }

      if (!LEGACY_IMAGE_FILE_PATTERN.test(entry.name)) {
        continue;
      }

      const relativePath =
        legacyPathPrefix.length > 0 ? `${legacyPathPrefix}/${entry.name}` : entry.name;
      const absolutePath = join(currentDir, entry.name);
      const hint = toSlug(entry.name.replace(/\.[^.]+$/, ""));
      const persisted = await artifactStore.persistLocalFile(absolutePath, { hint });
      artifactUrlsByLegacyPath.set(makeLegacyImageKey(relativePath), persisted.fileUrl);
    }
  };

  await walk(modulePublicDir);
  return artifactUrlsByLegacyPath;
};

const resolveLegacyPublicPath = async (
  publicDir: string,
  artifactStore: AdventureArtifactStore,
  sourcePath: string,
  legacyArtifactUrlsByPath?: ReadonlyMap<string, string>,
): Promise<string> => {
  const normalizedSourcePath = sourcePath.trim();
  if (
    normalizedSourcePath.length === 0 ||
    /^https?:\/\//i.test(normalizedSourcePath)
  ) {
    return normalizedSourcePath;
  }

  const relativePathKey = normalizeLegacyImagePathKey(normalizedSourcePath);
  const cachedUrl = findLegacyArtifactUrl(legacyArtifactUrlsByPath, relativePathKey);
  if (cachedUrl) {
    return cachedUrl;
  }

  const absolutePath = join(publicDir, relativePathKey);
  try {
    const persisted = await artifactStore.persistLocalFile(absolutePath, {
      hint: toSlug(relativePathKey.split("/").pop() ?? "exiles-image"),
    });
    return persisted.fileUrl;
  } catch {
    return normalizedSourcePath;
  }
};

const buildCuratedEntityReplacementMap = (
  actorDefinitions: readonly CuratedActorDefinition[],
  assetDefinitions: readonly CuratedAssetDefinition[],
): Array<{ pattern: RegExp; replacement: string }> => {
  const entities = [
    ...actorDefinitions.flatMap((definition) =>
      definition.aliases.map((alias) => ({
        alias,
        replacement: createGameCardJsx("ActorCard", definition.slug),
      })),
    ),
    ...assetDefinitions.flatMap((definition) =>
      definition.aliases.map((alias) => ({
        alias,
        replacement: createGameCardJsx("AssetCard", definition.slug),
      })),
    ),
  ].sort((left, right) => right.alias.length - left.alias.length);

  return entities.map(({ alias, replacement }) => ({
    pattern: new RegExp(`(?<!\\w)${escapeRegExp(alias)}(?!\\w)`, "gi"),
    replacement,
  }));
};

const replaceCuratedEntityEmbeds = (
  content: string,
  replacements: readonly { pattern: RegExp; replacement: string }[],
): string =>
  content
    .split("\n")
    .map((line) => {
      if (/^\s*!\[[^\]]*\]\(/.test(line)) {
        return line;
      }
      const placeholderPrefix = "__EXILES_GAMECARD_PLACEHOLDER_";
      const tokenizedLine = replacements.reduce(
        (current, replacement, index) =>
          current.replace(replacement.pattern, `${placeholderPrefix}${index}__`),
        line,
      );
      return tokenizedLine.replace(
        new RegExp(`${escapeRegExp(placeholderPrefix)}(\\d+)__`, "g"),
        (_match, index: string) => {
          const replacement = replacements[Number.parseInt(index, 10)];
          return replacement?.replacement ?? "";
        },
      );
    })
    .join("\n");

const buildActorContent = (options: {
  title: string;
  summary: string;
  noteLines: string[];
  imageUrls: string[];
}): string =>
  [
    `# ${options.title}`,
    "",
    ...options.imageUrls.map((imageUrl) => `![](${imageUrl})`),
    "",
    options.summary,
    "",
    "## Notes",
    ...options.noteLines.map((line) => `- ${line}`),
  ]
    .filter((line, index, allLines) => {
      if (line.length > 0) {
        return true;
      }
      return allLines[index - 1]?.length > 0;
    })
    .join("\n");

const buildAssetContent = (options: {
  title: string;
  summary: string;
  noteLines: string[];
  iconUrl: string;
}): string =>
  [
    `# ${options.title}`,
    "",
    `![](${options.iconUrl})`,
    "",
    options.summary,
    "",
    "## Notes",
    ...options.noteLines.map((line) => `- ${line}`),
  ]
    .filter((line, index, allLines) => {
      if (line.length > 0) {
        return true;
      }
      return allLines[index - 1]?.length > 0;
    })
    .join("\n");

const curatedActorDefinitions: readonly CuratedActorDefinition[] = [
  {
    title: "Machinist-Priest Heretic",
    slug: "machinist-priest-heretic",
    aliases: ["Machinist-Priest Heretic", "Machinist-Priestess Heretic"],
    baseLayerSlug: "cog",
    tacticalRoleSlug: "champion",
    isPlayerCharacter: true,
    summary: "An exiled engineer-priest who treats forbidden machine communion as holy work.",
    noteLines: [
      "Machine Speaker",
      "Servo-Arms",
      "Specialized Augments",
    ],
    portraitPaths: ["characters/machinist_priest.png"],
  },
  {
    title: "Crimson Witch/Warlock",
    slug: "crimson-witch-warlock",
    aliases: ["Crimson Witch/Warlock", "Crimson Witch", "Crimson Warlock"],
    baseLayerSlug: "zealot",
    tacticalRoleSlug: "stalker",
    isPlayerCharacter: true,
    summary: "A hemomancer who fuels divination, alteration, and combat through blood magic.",
    noteLines: ["Blood Sense", "Hemomancy", "Ritualist"],
    portraitPaths: ["characters/crimson_witch.png"],
  },
  {
    title: "Augmented Veteran",
    slug: "augmented-veteran",
    aliases: ["Augmented Veteran"],
    baseLayerSlug: "bruiser_red",
    tacticalRoleSlug: "brute",
    isPlayerCharacter: true,
    summary: "A battle-scarred Legion deserter rebuilt for war and stubborn survival.",
    noteLines: ["Weapon Proficiency", "Augmented Body", "Pain Inhibitor"],
    portraitPaths: ["characters/augmented_veteran_male.png"],
  },
  {
    title: "Noble Empath",
    slug: "noble-empath",
    aliases: ["Noble Empath"],
    baseLayerSlug: "aristocrat",
    tacticalRoleSlug: "skirmisher",
    isPlayerCharacter: true,
    summary: "An impoverished noble whose status and empathic gifts still open doors.",
    noteLines: ["Surface Thoughts", "Empathic Touch", "Noble Lineage"],
    portraitPaths: ["characters/noble_empath_male.png"],
  },
  {
    title: "Void-seer",
    slug: "void-seer",
    aliases: ["Void-seer", "Void Seer"],
    baseLayerSlug: "manipulator",
    tacticalRoleSlug: "ranger",
    isPlayerCharacter: true,
    summary: "A navigator-mystic who reads the Void and bends space just enough to survive it.",
    noteLines: ["Certified Navigator", "Space Folding", "Gravity Manipulation"],
    portraitPaths: ["characters/void_seer_male.png"],
  },
  {
    title: "Synthetic Medic",
    slug: "synthetic-medic",
    aliases: ["Synthetic Medic"],
    baseLayerSlug: "healer",
    tacticalRoleSlug: "ranger",
    isPlayerCharacter: true,
    summary: "An illegal sentient intelligence piloting a medic shell and looking for purpose.",
    noteLines: ["Knowledge Base", "Expert Doctor", "Vacuum Tolerance"],
    portraitPaths: ["characters/robot_surgeon_male.png"],
  },
  {
    title: "Void Horror",
    slug: "void-horror",
    aliases: ["Void Horror", "Shadow Horror"],
    baseLayerSlug: "horror",
    tacticalRoleSlug: "tank",
    tacticalSpecialSlug: "corrupting",
    isPlayerCharacter: false,
    summary: "The hungry shadow that stalks the corvette whenever the spin drive wakes up.",
    noteLines: ["The ship's recurring apex threat"],
    portraitPaths: ["void_horror.png"],
  },
  {
    title: "Xithrax Raiders",
    slug: "xithrax-raiders",
    aliases: ["Xithrax Raiders", "Xithrax"],
    baseLayerSlug: "animal_red",
    tacticalRoleSlug: "minion",
    tacticalSpecialSlug: "fast",
    isPlayerCharacter: false,
    summary: "Bloodthirsty bug raiders who want loot fast and casualties faster.",
    noteLines: ["Pirate corvette crew", "Same count as players"],
    portraitPaths: ["characters/critter_raider.png", "characters/critter_raider_2.png"],
  },
  {
    title: "Tunnel Critter",
    slug: "tunnel-critter",
    aliases: ["Tunnel Critter", "Tunnel critter", "Tunnel Critters"],
    baseLayerSlug: "animal_green",
    tacticalRoleSlug: "pawn",
    tacticalSpecialSlug: "irritating",
    isPlayerCharacter: false,
    summary: "A skittering tunnel nuisance that fights from shadows and scrap piles.",
    noteLines: ["Twice as many as the players"],
    portraitPaths: ["characters/tunnel_critter.png"],
  },
  {
    title: "Tunnel Critter Brood Mother",
    slug: "tunnel-critter-brood-mother",
    aliases: ["Tunnel Critter Brood Mother", "Tunnel critter brood mother"],
    baseLayerSlug: "animal_green",
    tacticalRoleSlug: "tank",
    tacticalSpecialSlug: "alpha",
    isPlayerCharacter: false,
    summary: "The hulking brood mother that sends the tunnel critters scattering or back into the fight.",
    noteLines: ["Appears at the start of round three"],
    portraitPaths: ["characters/tunnel_critter_brood_mother.png"],
  },
  {
    title: "Machinist Church",
    slug: "machinist-church",
    aliases: ["Machinist Church", "Machinist church", "Machinists"],
    baseLayerSlug: "cog",
    tacticalRoleSlug: "champion",
    tacticalSpecialSlug: "armoured",
    isPlayerCharacter: false,
    summary: "Zealot engineers who treat every ship, relic, and bolt as sacred property.",
    noteLines: ["The priests laying siege to Rock Bottom"],
  },
  {
    title: "Smugglers",
    slug: "smugglers",
    aliases: ["Smugglers", "Smuggler"],
    baseLayerSlug: "merchant",
    tacticalRoleSlug: "skirmisher",
    tacticalSpecialSlug: "fast",
    isPlayerCharacter: false,
    summary: "Pragmatic opportunists who trade in favors, cargo, and plausible deniability.",
    noteLines: ["Allies of convenience"],
  },
  {
    title: "Void Seers",
    slug: "void-seers",
    aliases: ["Void Seers"],
    baseLayerSlug: "manipulator",
    tacticalRoleSlug: "stalker",
    tacticalSpecialSlug: "corrupting",
    isPlayerCharacter: false,
    summary: "A mystic navigational order that treats the Void as both threat and revelation.",
    noteLines: ["They vanish when the concert ends"],
  },
  {
    title: "Death Cultists",
    slug: "death-cultists",
    aliases: ["Death Cultists", "Death Cult"],
    baseLayerSlug: "zealot",
    tacticalRoleSlug: "assassin",
    tacticalSpecialSlug: "corrupting",
    isPlayerCharacter: false,
    summary: "Hadean corpse-venerators who bargain in funerary gifts and forbidden rituals.",
    noteLines: ["The ritual gift on the dead ship"],
  },
  {
    title: "Hadeans",
    slug: "hadeans",
    aliases: ["Hadeans", "Hadean"],
    baseLayerSlug: "horror",
    tacticalRoleSlug: "assassin",
    tacticalSpecialSlug: "corrupting",
    isPlayerCharacter: false,
    summary: "Death-obsessed cultists traveling a doomed vessel beneath a gas giant.",
    noteLines: ["The crew in Dead in space"],
  },
];

const curatedAssetDefinitions: readonly CuratedAssetDefinition[] = [
  {
    title: "Alien Container",
    slug: "alien-container",
    aliases: ["Alien Container"],
    modifier: "Dangerous",
    noun: "Alien Container",
    nounDescription: "A strange sealed container that nobody at the Bazaar wants to touch.",
    adjectiveDescription: "It is stuck to the ground and smells like bad luck.",
    iconPath: `${LEGACY_MODULE_PUBLIC_ROOT}/assets/alien_container.png`,
    summary: "A mysterious alien relic recovered from the Graveyard Bazaar.",
    noteLines: ["Stuck to the ground", "Nobody wants to open it"],
  },
  {
    title: "Biskma",
    slug: "biskma",
    aliases: ["Biskma"],
    modifier: "Ancient",
    noun: "Biskma",
    nounDescription: "An ancient data-reading device stolen during the siege of Rock Bottom.",
    adjectiveDescription: "Small, precious, and awkward to explain at customs.",
    iconPath: "/assets/base/document.png",
    summary: "A relic data reader that the smugglers and Machinists both want back.",
    noteLines: ["Recovered under fire", "A relic with political value"],
  },
  {
    title: "Ritual of raising dead",
    slug: "ritual-of-raising-dead",
    aliases: ["Ritual of raising dead"],
    modifier: "Forbidden",
    noun: "Ritual of raising dead",
    nounDescription: "A dark sorcery book that animates dead bodies at range.",
    adjectiveDescription: "Best kept away from open flames and curious cultists.",
    iconPath: "/assets/base/document.png",
    summary: "A forbidden tome salvaged from a doomed Hadean cult ship.",
    noteLines: ["Animate a dead humanoid", "Studied during downtime"],
  },
  {
    title: "Obsidian Idol",
    slug: "obsidian-idol",
    aliases: ["Obsidian Idol"],
    modifier: "Cursed",
    noun: "Obsidian Idol",
    nounDescription: "A pulsating idol in the shape of an unborn baby.",
    adjectiveDescription: "It is dangerous, valuable, and deeply unpleasant to carry.",
    iconPath: "/assets/base/valuables.png",
    summary: "A cursed valuable that can be sold or used in rituals if anyone is brave enough.",
    noteLines: ["Shaped like an unborn baby", "Worth a fortune to the right buyer"],
  },
  {
    title: "Disruptor Mk I",
    slug: "disruptor-mk-i",
    aliases: ["Disruptor Mk I"],
    modifier: "Salvaged",
    noun: "Disruptor Mk I",
    nounDescription: "A compact weapon that de-powers a system for a turn.",
    adjectiveDescription: "A salvaged ship weapon that likes to eat power.",
    iconPath: "/assets/base/artillery_weapon.png",
    summary: "A weapon salvage that can shut systems down during a shipboard fight.",
    noteLines: ["De-powers a system by 1PU for 1 turn"],
  },
];

const curatedEntityReplacements = buildCuratedEntityReplacementMap(
  curatedActorDefinitions,
  curatedAssetDefinitions,
);

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

const normalizeLegacyMarkdown = async (options: {
  body: string;
  frontmatter: LegacyFrontmatter;
  publicDir: string;
  artifactStore: AdventureArtifactStore;
  legacyArtifactUrlsByPath?: ReadonlyMap<string, string>;
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
        options.legacyArtifactUrlsByPath,
      );
      return `![${altText}](${resolved})`;
    },
  );

  content = replaceCuratedEntityEmbeds(content, curatedEntityReplacements);

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
    "",
    "## Playable Archetypes",
    ...curatedActorDefinitions
      .filter((definition) => definition.isPlayerCharacter)
      .map((definition) => `- ${createGameCardJsx("ActorCard", definition.slug)}`),
  ]
    .filter(Boolean)
    .join("\n");

const buildStorytellerSummary = (
  hook: string,
  prompt: string,
  encounterTitles: string[],
  inlineArtUrl?: string,
): string =>
  [
    "# Storyteller Summary",
    "",
    inlineArtUrl ? `![](${inlineArtUrl})` : "",
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
  const modulePublicDir = join(options.publicDir, LEGACY_MODULE_PUBLIC_ROOT);
  const legacyArtifactUrlsByPath = await collectLegacyImageArtifacts(
    modulePublicDir,
    options.artifactStore,
  );
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
    legacyArtifactUrlsByPath,
  });
  const normalizedShip = await normalizeLegacyMarkdown({
    body: shipPage.body,
    frontmatter: shipPage.frontmatter,
    publicDir: options.publicDir,
    artifactStore: options.artifactStore,
    legacyArtifactUrlsByPath,
    prependGmIntent: true,
  });

  const titleArtUrl =
    findLegacyArtifactUrl(
      legacyArtifactUrlsByPath,
      "mighty-decks/encounters/exiles_of_the_hungry_void/exiles-of-the-hungry-void-title.jpg",
      "exiles-of-the-hungry-void-title.jpg",
    ) ??
    normalizedIntro.firstImageUrl;
  const voidHorrorInlineUrl =
    findLegacyArtifactUrl(
      legacyArtifactUrlsByPath,
      "mighty-decks/encounters/exiles_of_the_hungry_void/void_horror.png",
      "void_horror.png",
      "characters/void_horror.png",
    ) ??
    normalizedIntro.firstImageUrl;
  const coverImageUrl = titleArtUrl ?? normalizedIntro.firstImageUrl;
  const introHookMarkdown = replaceCuratedEntityEmbeds(
    introPage.frontmatter.hook ?? "The Empire has exiled you to the edge of the Hungry Void.",
    curatedEntityReplacements,
  );
  const introPromptMarkdown = replaceCuratedEntityEmbeds(
    introPage.frontmatter.prompt ??
      "Guide the exiles through a desperate shipbound mini-campaign.",
    curatedEntityReplacements,
  );
  const playerSummaryMarkdown = buildPlayerSummary(
    introHookMarkdown,
    coverImageUrl,
  );

  const encounterRecords: EncounterRecord[] = [];
  for (const page of encounterPages) {
    const normalized = await normalizeLegacyMarkdown({
      body: page.body,
      frontmatter: page.frontmatter,
      publicDir: options.publicDir,
      artifactStore: options.artifactStore,
      legacyArtifactUrlsByPath,
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
    introHookMarkdown,
    introPromptMarkdown,
    allEncounterTitles,
    voidHorrorInlineUrl,
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

  const encounterFragmentIdBySlug = new Map(
    encounterRecords.map((record) => [record.resolved.encounterSlug, record.fragment.fragmentId] as const),
  );

  const resolveCuratedAssetIconUrl = (iconPath: string): string => {
    const trimmed = iconPath.trim();
    if (trimmed.startsWith("/assets/")) {
      return trimmed;
    }

    const normalizedPath = trimmed.replace(/^\/+/, "");
    const relativePath = normalizedPath.startsWith(`${LEGACY_MODULE_PUBLIC_ROOT}/`)
      ? normalizedPath.slice(LEGACY_MODULE_PUBLIC_ROOT.length + 1)
      : normalizedPath;
    return legacyArtifactUrlsByPath.get(makeLegacyImageKey(relativePath)) ?? trimmed;
  };

  const actorRecords = curatedActorDefinitions.map((definition) => {
    const fragmentId = makeFragmentId("actor", definition.slug);
    const imageUrls = (definition.portraitPaths ?? []).map(
      (portraitPath) =>
        legacyArtifactUrlsByPath.get(makeLegacyImageKey(portraitPath)) ?? portraitPath,
    );
    const fragment = toFragment({
      fragmentId,
      kind: "actor",
      title: definition.title,
      path: `actors/${definition.slug}.mdx`,
      summary: definition.summary,
      tags: [
        "exiles",
        "imported",
        "actor",
        definition.isPlayerCharacter ? "player-option" : "recurring-actor",
      ],
      containsSpoilers: !definition.isPlayerCharacter,
      intendedAudience: "shared",
    });

    return {
      definition,
      fragment,
      content: buildActorContent({
        title: definition.title,
        summary: definition.summary,
        noteLines: definition.noteLines,
        imageUrls,
      }),
    };
  });

  const actorFragmentIdBySlug = new Map(
    actorRecords.map((record) => [record.definition.slug, record.fragment.fragmentId] as const),
  );

  const assetRecords = curatedAssetDefinitions.map((definition) => {
    const fragmentId = makeFragmentId("asset", definition.slug);
    const iconUrl = resolveCuratedAssetIconUrl(definition.iconPath);
    const fragment = toFragment({
      fragmentId,
      kind: "asset",
      title: definition.title,
      path: `assets/${definition.slug}.mdx`,
      summary: definition.summary,
      tags: ["exiles", "imported", "asset"],
      containsSpoilers: true,
      intendedAudience: "shared",
    });

    return {
      definition,
      fragment,
      iconUrl,
      content: buildAssetContent({
        title: definition.title,
        summary: definition.summary,
        noteLines: definition.noteLines,
        iconUrl,
      }),
    };
  });

  const assetFragmentIdBySlug = new Map(
    assetRecords.map((record) => [record.definition.slug, record.fragment.fragmentId] as const),
  );
  const resolvedActors = actorRecords.map((record) => {
    const resolvedActor = {
      fragmentId: record.fragment.fragmentId,
      actorSlug: record.definition.slug,
      title: record.definition.title,
      summary: record.definition.summary,
      baseLayerSlug: record.definition.baseLayerSlug,
      tacticalRoleSlug: record.definition.tacticalRoleSlug,
      isPlayerCharacter: record.definition.isPlayerCharacter,
      content: record.content,
    };
    return record.definition.tacticalSpecialSlug
      ? {
          ...resolvedActor,
          tacticalSpecialSlug: record.definition.tacticalSpecialSlug,
        }
      : resolvedActor;
  });
  const resolvedAssets = assetRecords.map((record) => ({
    fragmentId: record.fragment.fragmentId,
    assetSlug: record.definition.slug,
    title: record.definition.title,
    summary: record.definition.summary,
    kind: "custom" as const,
    modifier: record.definition.modifier,
    noun: record.definition.noun,
    nounDescription: record.definition.nounDescription,
    adjectiveDescription: record.definition.adjectiveDescription,
    iconUrl: record.iconUrl,
    overlayUrl: "",
    content: record.content,
  }));

  const encounterRefsBySlug = new Map<
    string,
    {
      actorFragmentIds: string[];
      assetFragmentIds: string[];
    }
  >([
    [
      "dumped-in-the-void",
      {
        actorFragmentIds: [actorFragmentIdBySlug.get("void-horror")!],
        assetFragmentIds: [],
      },
    ],
    [
      "transport-in-distress",
      {
        actorFragmentIds: [actorFragmentIdBySlug.get("xithrax-raiders")!],
        assetFragmentIds: [assetFragmentIdBySlug.get("disruptor-mk-i")!],
      },
    ],
    [
      "abandoned-research-station",
      {
        actorFragmentIds: [],
        assetFragmentIds: [],
      },
    ],
    [
      "dead-in-space",
      {
        actorFragmentIds: [actorFragmentIdBySlug.get("hadeans")!],
        assetFragmentIds: [assetFragmentIdBySlug.get("ritual-of-raising-dead")!],
      },
    ],
    [
      "mining-colony-has-a-pest-problem",
      {
        actorFragmentIds: [
          actorFragmentIdBySlug.get("tunnel-critter")!,
          actorFragmentIdBySlug.get("tunnel-critter-brood-mother")!,
        ],
        assetFragmentIds: [],
      },
    ],
    [
      "graveyard-bazaar",
      {
        actorFragmentIds: [
          actorFragmentIdBySlug.get("smugglers")!,
          actorFragmentIdBySlug.get("void-seers")!,
          actorFragmentIdBySlug.get("death-cultists")!,
          actorFragmentIdBySlug.get("machinist-church")!,
        ],
        assetFragmentIds: [assetFragmentIdBySlug.get("alien-container")!],
      },
    ],
    [
      "trip-into-the-unknown",
      {
        actorFragmentIds: [actorFragmentIdBySlug.get("void-seers")!],
        assetFragmentIds: [],
      },
    ],
    [
      "siege-of-rock-bottom",
      {
        actorFragmentIds: [
          actorFragmentIdBySlug.get("machinist-church")!,
          actorFragmentIdBySlug.get("smugglers")!,
        ],
        assetFragmentIds: [assetFragmentIdBySlug.get("biskma")!],
      },
    ],
    [
      "cursed-prison-transport",
      {
        actorFragmentIds: [],
        assetFragmentIds: [
          assetFragmentIdBySlug.get("obsidian-idol")!,
          assetFragmentIdBySlug.get("ritual-of-raising-dead")!,
        ],
      },
    ],
    [
      "missile-stockpile-raid",
      {
        actorFragmentIds: [],
        assetFragmentIds: [],
      },
    ],
  ]);

  const primaryEncounter =
    encounterRecords.find((record) => record.resolved.encounterSlug === "dumped-in-the-void") ??
    encounterRecords[0]!;

  const playerActorRecords = actorRecords.filter((record) => record.definition.isPlayerCharacter);
  const recurringActorRecords = actorRecords.filter((record) => !record.definition.isPlayerCharacter);

  const componentMapContent = [
    "# Component Opportunity Map",
    "",
    "## Player Archetypes",
    ...playerActorRecords.map(
      (record) =>
        `- ${createGameCardJsx("ActorCard", record.definition.slug)}: ${record.definition.summary}`,
    ),
    "",
    "## Recurring Actors",
    ...recurringActorRecords.map(
      (record) =>
        `- ${createGameCardJsx("ActorCard", record.definition.slug)}: ${record.definition.summary}`,
    ),
    "",
    "## Assets",
    ...assetRecords.map(
      (record) =>
        `- ${createGameCardJsx("AssetCard", record.definition.slug)}: ${record.definition.summary}`,
    ),
    "",
    "## Guidance",
    "- Imported Exiles encounter counters were normalized into markdown callouts.",
    "- Re-promote recurring ship pressure to typed counters later if table play needs it.",
  ].join("\n");

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
    ...actorRecords.map((record) => record.fragment),
    ...assetRecords.map((record) => record.fragment),
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
    ...actorRecords.map((record) => ({
      fragment: record.fragment,
      content: record.content,
    })),
    ...assetRecords.map((record) => ({
      fragment: record.fragment,
      content: record.content,
    })),
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
      content: componentMapContent,
    },
  ];

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
      ...(encounterRefsBySlug.get(encounter.resolved.encounterSlug) ?? {
        actorFragmentIds: [],
        assetFragmentIds: [],
      }),
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

  const actorOpportunitySpecs = [
    {
      actorSlug: "machinist-priest-heretic",
      fragmentId: settingFragmentId,
      fragmentKind: "setting" as const,
      placementLabel: "Playable Archetype: Machinist-Priest Heretic",
      trigger: "When players choose their starting archetype.",
      rationale:
        "The intro page presents this as one of the campaign's primary player options.",
      timing: "setup" as const,
    },
    {
      actorSlug: "crimson-witch-warlock",
      fragmentId: settingFragmentId,
      fragmentKind: "setting" as const,
      placementLabel: "Playable Archetype: Crimson Witch/Warlock",
      trigger: "When players choose their starting archetype.",
      rationale:
        "The intro page presents this as one of the campaign's primary player options.",
      timing: "setup" as const,
    },
    {
      actorSlug: "augmented-veteran",
      fragmentId: settingFragmentId,
      fragmentKind: "setting" as const,
      placementLabel: "Playable Archetype: Augmented Veteran",
      trigger: "When players choose their starting archetype.",
      rationale:
        "The intro page presents this as one of the campaign's primary player options.",
      timing: "setup" as const,
    },
    {
      actorSlug: "noble-empath",
      fragmentId: settingFragmentId,
      fragmentKind: "setting" as const,
      placementLabel: "Playable Archetype: Noble Empath",
      trigger: "When players choose their starting archetype.",
      rationale:
        "The intro page presents this as one of the campaign's primary player options.",
      timing: "setup" as const,
    },
    {
      actorSlug: "void-seer",
      fragmentId: settingFragmentId,
      fragmentKind: "setting" as const,
      placementLabel: "Playable Archetype: Void-seer",
      trigger: "When players choose their starting archetype.",
      rationale:
        "The intro page presents this as one of the campaign's primary player options.",
      timing: "setup" as const,
    },
    {
      actorSlug: "synthetic-medic",
      fragmentId: settingFragmentId,
      fragmentKind: "setting" as const,
      placementLabel: "Playable Archetype: Synthetic Medic",
      trigger: "When players choose their starting archetype.",
      rationale:
        "The intro page presents this as one of the campaign's primary player options.",
      timing: "setup" as const,
    },
    {
      actorSlug: "void-horror",
      fragmentId: settingFragmentId,
      fragmentKind: "setting" as const,
      placementLabel: "Recurring Threat: Void Horror",
      trigger: "When the intro warns about the creature hunting the corvette.",
      rationale:
        "The opening chapter establishes the Void Horror as the campaign's recurring threat.",
      timing: "scene_start" as const,
    },
    {
      actorSlug: "xithrax-raiders",
      fragmentId:
        encounterFragmentIdBySlug.get("transport-in-distress") ?? settingFragmentId,
      fragmentKind: "encounter" as const,
      placementLabel: "Raiders: Xithrax Raiders",
      trigger: "When the pirate corvette is introduced in the transport ambush.",
      rationale:
        "The transport scene names the Xithrax as the immediate hostile crew.",
      timing: "scene_start" as const,
    },
    {
      actorSlug: "hadeans",
      fragmentId: encounterFragmentIdBySlug.get("dead-in-space") ?? settingFragmentId,
      fragmentKind: "encounter" as const,
      placementLabel: "Cult Ship Crew: Hadeans",
      trigger: "When the dead cult ship is first revealed.",
      rationale:
        "Dead in Space centers the Hadeans and their forbidden ritual gift.",
      timing: "scene_start" as const,
    },
    {
      actorSlug: "tunnel-critter",
      fragmentId:
        encounterFragmentIdBySlug.get("mining-colony-has-a-pest-problem") ??
        settingFragmentId,
      fragmentKind: "encounter" as const,
      placementLabel: "Infestation: Tunnel Critter",
      trigger: "When the mining colony's pest problem becomes a fight.",
      rationale:
        "The mining colony encounter frames the critters as the central infestation.",
      timing: "scene_start" as const,
    },
    {
      actorSlug: "tunnel-critter-brood-mother",
      fragmentId:
        encounterFragmentIdBySlug.get("mining-colony-has-a-pest-problem") ??
        settingFragmentId,
      fragmentKind: "encounter" as const,
      placementLabel: "Boss: Tunnel Critter Brood Mother",
      trigger: "When the brood mother enters on round three.",
      rationale:
        "The mining colony encounter introduces the brood mother as the escalation beat.",
      timing: "during_action" as const,
    },
    {
      actorSlug: "machinist-church",
      fragmentId: encounterFragmentIdBySlug.get("graveyard-bazaar") ?? settingFragmentId,
      fragmentKind: "encounter" as const,
      placementLabel: "Faction: Machinist Church",
      trigger: "When the bazaar turns into a faction negotiation or siege.",
      rationale:
        "The campaign uses the Machinist Church as a recurring pressure faction.",
      timing: "scene_start" as const,
    },
    {
      actorSlug: "smugglers",
      fragmentId: encounterFragmentIdBySlug.get("graveyard-bazaar") ?? settingFragmentId,
      fragmentKind: "encounter" as const,
      placementLabel: "Faction: Smugglers",
      trigger: "When the bazaar calls for allies, favors, or trade.",
      rationale:
        "The Smugglers are one of the recurring social factions in the campaign.",
      timing: "scene_start" as const,
    },
    {
      actorSlug: "void-seers",
      fragmentId: encounterFragmentIdBySlug.get("graveyard-bazaar") ?? settingFragmentId,
      fragmentKind: "encounter" as const,
      placementLabel: "Faction: Void Seers",
      trigger: "When the bazaar or nebula scenes mention their mystical order.",
      rationale:
        "The Void Seers thread through the bazaar and nebula chapters as a recurring order.",
      timing: "scene_start" as const,
    },
    {
      actorSlug: "death-cultists",
      fragmentId: encounterFragmentIdBySlug.get("graveyard-bazaar") ?? settingFragmentId,
      fragmentKind: "encounter" as const,
      placementLabel: "Faction: Death Cultists",
      trigger: "When the bazaar lists the factions watching the concert.",
      rationale:
        "The Death Cultists are part of the bazaar's dangerous social landscape.",
      timing: "scene_start" as const,
    },
  ] as const;

  const assetOpportunitySpecs = [
    {
      assetSlug: "disruptor-mk-i",
      fragmentId:
        encounterFragmentIdBySlug.get("transport-in-distress") ?? settingFragmentId,
      fragmentKind: "encounter" as const,
      placementLabel: "Weapon Salvage: Disruptor Mk I",
      trigger: "When the pirate ship's weapon loadout is identified.",
      rationale:
        "The transport encounter explicitly calls out the disruptor as loot and threat.",
      timing: "scene_start" as const,
    },
    {
      assetSlug: "ritual-of-raising-dead",
      fragmentId: encounterFragmentIdBySlug.get("dead-in-space") ?? settingFragmentId,
      fragmentKind: "encounter" as const,
      placementLabel: "Forbidden Tome: Ritual of Raising Dead",
      trigger: "When the cult ship's gift is revealed.",
      rationale:
        "Dead in Space centers the cursed ritual book as the encounter's key reveal.",
      timing: "scene_start" as const,
    },
    {
      assetSlug: "alien-container",
      fragmentId: encounterFragmentIdBySlug.get("graveyard-bazaar") ?? settingFragmentId,
      fragmentKind: "encounter" as const,
      placementLabel: "Mystery Relic: Alien Container",
      trigger: "When the bazaar's strange relic is discovered.",
      rationale:
        "The Graveyard Bazaar frames the alien container as a stuck, unsettling puzzle item.",
      timing: "scene_start" as const,
    },
    {
      assetSlug: "biskma",
      fragmentId: encounterFragmentIdBySlug.get("siege-of-rock-bottom") ?? settingFragmentId,
      fragmentKind: "encounter" as const,
      placementLabel: "Relic: Biskma",
      trigger: "When the siege reveals the stolen data-reading device.",
      rationale:
        "Siege of Rock Bottom turns Biskma into the coveted relic at the center of the conflict.",
      timing: "during_action" as const,
    },
    {
      assetSlug: "obsidian-idol",
      fragmentId:
        encounterFragmentIdBySlug.get("cursed-prison-transport") ?? settingFragmentId,
      fragmentKind: "encounter" as const,
      placementLabel: "Cursed Artifact: Obsidian Idol",
      trigger: "When the prison pod opens to reveal the idol.",
      rationale:
        "The cursed prison transport encounter names the idol as the dangerous pod reward.",
      timing: "scene_start" as const,
    },
  ] as const;

  const componentOpportunities = [
    ...actorOpportunitySpecs.map((spec) => ({
      opportunityId: truncate(`opp-${spec.fragmentKind}-${spec.actorSlug}`, 120),
      componentType: "layered_actor" as const,
      strength: "recommended" as const,
      timing: spec.timing,
      fragmentId: spec.fragmentId,
      fragmentKind: spec.fragmentKind,
      placementLabel: spec.placementLabel,
      trigger: spec.trigger,
      rationale: spec.rationale,
    })),
    ...assetOpportunitySpecs.map((spec) => ({
      opportunityId: truncate(`opp-${spec.fragmentKind}-${spec.assetSlug}`, 120),
      componentType: "layered_asset" as const,
      strength: "recommended" as const,
      timing: spec.timing,
      fragmentId: spec.fragmentId,
      fragmentKind: spec.fragmentKind,
      placementLabel: spec.placementLabel,
      trigger: spec.trigger,
      rationale: spec.rationale,
    })),
    {
      opportunityId: "opp-exiles-import-pressure",
      componentType: "counter" as const,
      strength: "recommended" as const,
      timing: "during_action" as const,
      fragmentId: primaryEncounter.fragment.fragmentId,
      fragmentKind: "encounter" as const,
      placementLabel: "Imported Scene Pressure",
      trigger: "When the ship, crew, or immediate threat starts escalating.",
      rationale:
        "Exiles repeatedly frames survival through visible pressure and damage clocks.",
    },
  ];

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
    actorFragmentIds: actorRecords.map((record) => record.fragment.fragmentId),
    actorCards: actorRecords.map((record) => ({
      fragmentId: record.fragment.fragmentId,
      baseLayerSlug: record.definition.baseLayerSlug,
      tacticalRoleSlug: record.definition.tacticalRoleSlug,
      ...(record.definition.tacticalSpecialSlug
        ? { tacticalSpecialSlug: record.definition.tacticalSpecialSlug }
        : {}),
      isPlayerCharacter: record.definition.isPlayerCharacter,
    })),
    counters: [],
    assetFragmentIds: assetRecords.map((record) => record.fragment.fragmentId),
    assetCards: assetRecords.map((record) => ({
      fragmentId: record.fragment.fragmentId,
      kind: "custom" as const,
      modifier: record.definition.modifier,
      noun: record.definition.noun,
      nounDescription: record.definition.nounDescription,
      adjectiveDescription: record.definition.adjectiveDescription,
      iconUrl: record.iconUrl,
      overlayUrl: "",
    })),
    itemFragmentIds: [],
    encounterFragmentIds: encounterRecords.map((record) => record.fragment.fragmentId),
    encounterDetails: encounterRecords.map((record) => record.detail),
    questFragmentIds: questRecords.map((record) => record.fragment.fragmentId),
    questDetails: questRecords.map((record) => record.detail),
    imagePromptFragmentIds: [], 
    fragments: commonFragments,
    questGraphs,
    componentOpportunities,
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
    actors: resolvedActors,
    counters: [],
    assets: resolvedAssets,
    coverImageUrl,
    ownedByRequester: false,
  });
};
