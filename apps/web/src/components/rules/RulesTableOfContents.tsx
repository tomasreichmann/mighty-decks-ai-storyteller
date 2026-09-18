import { Label } from "../common/Label";
import {
  rulebookNavigationGroups,
  rulebookSectionDefinitions,
  type RulebookDocument,
  type RulebookNavGroupId,
} from "../../lib/rulebookDocument";

const sectionsForGroup = (groupId: RulebookNavGroupId) =>
  rulebookSectionDefinitions.filter(
    (section) => section.navGroup === groupId && section.includeInNavigation,
  );

const compositionSubsectionIds = new Set([
  "building-an-asset-card",
  "reading-a-combined-asset-card",
  "building-an-actor-card",
  "reading-actor-attacks-and-specials",
]);

const SubsectionLinks = ({ document, parentId }: { document: RulebookDocument; parentId: string }): JSX.Element | null => {
  const subsections = document.subsections.filter(
    (subsection) => subsection.parentId === parentId && compositionSubsectionIds.has(subsection.id),
  );
  if (subsections.length === 0) {
    return null;
  }
  return (
    <ol className="mt-1 stack gap-1 pl-4 font-ui text-xs leading-snug text-kac-iron-light">
      {subsections.map((subsection) => (
        <li key={subsection.id}>
          <a href={`#${subsection.id}`} className="underline decoration-kac-cloth/70 underline-offset-2 transition hover:text-kac-blood-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kac-gold-dark/60">
            {subsection.title}
          </a>
        </li>
      ))}
    </ol>
  );
};

const RulebookLinks = ({ document }: { document: RulebookDocument }): JSX.Element => (
  <ol className="mt-3 stack gap-1 pl-4 font-ui text-sm leading-snug text-kac-iron-light marker:font-heading marker:font-bold marker:text-kac-gold-dark">
    {rulebookNavigationGroups.flatMap((group) =>
      sectionsForGroup(group.id).map((section) => (
        <li key={section.id}>
          <a
            href={`#${section.id}`}
            className="underline decoration-kac-cloth/70 underline-offset-2 transition hover:text-kac-blood-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kac-gold-dark/60"
          >
            {section.sourceHeading.replace(/^#+\s+\d+\.\s+/, "").replace(/^#+\s+/, "")}
          </a>
          <SubsectionLinks document={document} parentId={section.id} />
        </li>
      )),
    )}
  </ol>
);

const RulebookGroupLinks = ({ document }: { document: RulebookDocument }): JSX.Element => (
  <div className="stack gap-4">
    {rulebookNavigationGroups.map((group) => (
      <section key={group.id}>
        <Label color="cloth" size="sm" rotate={false}>
          {group.label}
        </Label>
        <ol className="mt-2 stack gap-1 pl-4 font-ui text-sm leading-snug text-kac-iron-light marker:font-heading marker:font-bold marker:text-kac-gold-dark">
          {sectionsForGroup(group.id).map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className="underline decoration-kac-cloth/70 underline-offset-2 transition hover:text-kac-blood-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kac-gold-dark/60"
              >
                {section.sourceHeading.replace(/^#+\s+\d+\.\s+/, "").replace(/^#+\s+/, "")}
              </a>
              <SubsectionLinks document={document} parentId={section.id} />
            </li>
          ))}
        </ol>
      </section>
    ))}
  </div>
);

export const RulesTableOfContents = ({ document }: { document: RulebookDocument }): JSX.Element => {
  return (
    <aside className="print:hidden lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)]">
      <details className="lg:hidden">
        <summary className="cursor-pointer font-heading text-lg font-bold text-kac-iron marker:text-kac-gold-dark">
          Jump to a rule
        </summary>
        <div className="mt-3 border-l-2 border-kac-cloth-light pl-3">
          <RulebookLinks document={document} />
        </div>
      </details>

      <nav
        aria-label="Rulebook sections"
        className="hidden lg:block lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto lg:pr-3"
      >
        <Label color="gold" rotate={false}>
          Rulebook contents
        </Label>
        <div className="mt-4">
          <RulebookGroupLinks document={document} />
        </div>
      </nav>
    </aside>
  );
};
