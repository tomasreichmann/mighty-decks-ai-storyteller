export type RulebookNavGroupId =
  | "start-here"
  | "outcomes-effect"
  | "characters-components"
  | "scenes-turns"
  | "conflict-recovery"
  | "counters-storytelling"
  | "optional-storyteller"
  | "quick-reference";

export interface RulebookNavGroup {
  id: RulebookNavGroupId;
  label: string;
}

export interface RulebookSectionDefinition {
  sourceHeading: string;
  id: string;
  navGroup: RulebookNavGroupId;
  includeInNavigation: boolean;
}

export interface RulebookSection extends RulebookSectionDefinition {
  headingLevel: "h1" | "h2";
  title: string;
  body: string;
  subsections: readonly RulebookSubsection[];
}

export interface RulebookSubsection {
  id: string;
  title: string;
  parentId: string;
}

export interface RulebookDocument {
  sections: RulebookSection[];
  subsections: RulebookSubsection[];
}

export const rulebookNavigationGroups: readonly RulebookNavGroup[] = [
  { id: "start-here", label: "Start Here" },
  { id: "outcomes-effect", label: "Outcomes & Effect" },
  { id: "characters-components", label: "Characters & Components" },
  { id: "scenes-turns", label: "Scenes & Turns" },
  { id: "conflict-recovery", label: "Conflict & Recovery" },
  { id: "counters-storytelling", label: "Counters & Storytelling" },
  { id: "optional-storyteller", label: "Optional Rules & Storyteller" },
  { id: "quick-reference", label: "Quick Reference" },
] as const;

export const rulebookSectionDefinitions: readonly RulebookSectionDefinition[] = [
  { sourceHeading: "## 1. What Is Mighty Decks?", id: "what-is-mighty-decks", navGroup: "start-here", includeInNavigation: true },
  { sourceHeading: "## 2. What You Need to Play", id: "what-you-need-to-play", navGroup: "start-here", includeInNavigation: true },
  { sourceHeading: "## 3. The Outcome Deck", id: "outcome-deck", navGroup: "start-here", includeInNavigation: true },
  { sourceHeading: "## 4. The Core Action Loop", id: "core-action-loop", navGroup: "start-here", includeInNavigation: true },
  { sourceHeading: "## 5. Outcome Cards", id: "outcome-cards", navGroup: "outcomes-effect", includeInNavigation: true },
  { sourceHeading: "## 6. Effect: How Much Changes", id: "effect", navGroup: "outcomes-effect", includeInNavigation: true },
  { sourceHeading: "## 7. Effects", id: "effects", navGroup: "outcomes-effect", includeInNavigation: true },
  { sourceHeading: "## 8. Catastrophe", id: "catastrophe", navGroup: "outcomes-effect", includeInNavigation: true },
  { sourceHeading: "## 9. Characters, Expertise, Stunts, and Assets", id: "characters-expertise-stunts-assets", navGroup: "characters-components", includeInNavigation: true },
  { sourceHeading: "## 10. Actors and Toughness", id: "actors", navGroup: "characters-components", includeInNavigation: true },
  { sourceHeading: "## 11. Hidden Actors and Information", id: "hidden-actors", navGroup: "characters-components", includeInNavigation: true },
  { sourceHeading: "## 12. Scenes and Tension", id: "scenes-and-tension", navGroup: "scenes-turns", includeInNavigation: true },
  { sourceHeading: "## 13. Turn-Based Play", id: "turn-based-play", navGroup: "scenes-turns", includeInNavigation: true },
  { sourceHeading: "## 14. Locations, Zones, Movement, and Range", id: "locations-zones-movement-range", navGroup: "scenes-turns", includeInNavigation: true },
  { sourceHeading: "## 15. Attacks", id: "attacks", navGroup: "conflict-recovery", includeInNavigation: true },
  { sourceHeading: "## 16. Defense", id: "defense", navGroup: "conflict-recovery", includeInNavigation: true },
  { sourceHeading: "## 17. Splash and Area Effects", id: "splash-and-area-effects", navGroup: "conflict-recovery", includeInNavigation: true },
  { sourceHeading: "## 18. Recovery", id: "recovery", navGroup: "conflict-recovery", includeInNavigation: true },
  { sourceHeading: "## 19. Taken Out", id: "taken-out", navGroup: "conflict-recovery", includeInNavigation: true },
  { sourceHeading: "## 20. Counters", id: "counters", navGroup: "counters-storytelling", includeInNavigation: true },
  { sourceHeading: "## 21. Combining Different Kinds of Effect", id: "combining-effect", navGroup: "counters-storytelling", includeInNavigation: true },
  { sourceHeading: "## 22. Narrating Outcomes", id: "narrating-outcomes", navGroup: "counters-storytelling", includeInNavigation: true },
  { sourceHeading: "## 23. Ending a Scene", id: "ending-a-scene", navGroup: "counters-storytelling", includeInNavigation: true },
  { sourceHeading: "## 24. Ending a Session", id: "ending-a-session", navGroup: "counters-storytelling", includeInNavigation: true },
  { sourceHeading: "## 25. Finishing an Adventure", id: "finishing-an-adventure", navGroup: "counters-storytelling", includeInNavigation: true },
  { sourceHeading: "## 26. Optional Lethal Rules", id: "optional-lethal-rules", navGroup: "optional-storyteller", includeInNavigation: true },
  { sourceHeading: "## 27. Storyteller Principles", id: "storyteller-principles", navGroup: "optional-storyteller", includeInNavigation: true },
  { sourceHeading: "## 29. Quick Reference", id: "quick-reference", navGroup: "quick-reference", includeInNavigation: true },
  { sourceHeading: "# Design Philosophy", id: "design-philosophy", navGroup: "quick-reference", includeInNavigation: true },
] as const;

const headingPattern = /^(#{1,2})\s+(.+)$/gm;
const subsectionPattern = /^###\s+(.+)$/gm;

const titleFromHeading = (sourceHeading: string): string =>
  sourceHeading.replace(/^#+\s+/, "");

export const toRulebookFragmentId = (value: string): string =>
  value
    .toLocaleLowerCase()
    .replace(/[—–]/g, "-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const normalizeBody = (body: string): string =>
  body
    .split("\n")
    .filter((line) => !/^>\s+\*\*Illustration/i.test(line))
    .join("\n")
    .trim();

export const parseRulebookDocument = (markdown: string): RulebookDocument => {
  const headingMatches = Array.from(markdown.matchAll(headingPattern));
  const availableHeadings = new Set(
    headingMatches.map((match) => `${match[1]} ${match[2]}`),
  );

  for (const definition of rulebookSectionDefinitions) {
    if (!availableHeadings.has(definition.sourceHeading)) {
      throw new Error(
        `Missing required rulebook heading: "${definition.sourceHeading}". Update the rulebook inventory before publishing.`,
      );
    }
  }

  const definitionByHeading = new Map(
    rulebookSectionDefinitions.map((definition) => [definition.sourceHeading, definition]),
  );
  const sections: RulebookSection[] = [];
  const subsections: RulebookSubsection[] = [];
  const subsectionIds = new Set(
    rulebookSectionDefinitions.map((definition) => definition.id),
  );

  for (let index = 0; index < headingMatches.length; index += 1) {
    const match = headingMatches[index];
    const sourceHeading = `${match[1]} ${match[2]}`;
    const definition = definitionByHeading.get(sourceHeading);
    if (!definition) {
      continue;
    }

    const bodyStart = (match.index ?? 0) + match[0].length;
    const bodyEnd = index + 1 < headingMatches.length
      ? headingMatches[index + 1].index ?? markdown.length
      : markdown.length;
    const body = normalizeBody(markdown.slice(bodyStart, bodyEnd));
    const sectionSubsections: RulebookSubsection[] = [];
    const section: RulebookSection = {
      ...definition,
      headingLevel: match[1] === "#" ? "h1" : "h2",
      title: titleFromHeading(sourceHeading),
      body,
      subsections: sectionSubsections,
    };
    sections.push(section);

    for (const subsectionMatch of body.matchAll(subsectionPattern)) {
      const title = subsectionMatch[1].trim();
      const baseId = toRulebookFragmentId(title);
      let id = baseId;
      let duplicate = 2;
      while (subsectionIds.has(id)) {
        id = `${baseId}-${duplicate}`;
        duplicate += 1;
      }
      subsectionIds.add(id);
      const subsection = { id, title, parentId: definition.id };
      sectionSubsections.push(subsection);
      subsections.push(subsection);
    }
  }

  if (sections.length !== rulebookSectionDefinitions.length) {
    throw new Error("Rulebook section inventory did not produce every public section.");
  }

  return { sections, subsections };
};
