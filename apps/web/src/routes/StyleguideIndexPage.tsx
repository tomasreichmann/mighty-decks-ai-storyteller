import { Link } from "react-router-dom";
import { Heading } from "../components/common/Heading";
import { Label } from "../components/common/Label";
import { Text } from "../components/common/Text";
import {
  styleguideCatalog,
  styleguideCatalogChildren,
  styleguideCategories,
  isStyleguideCatalogEntryAvailable,
} from "../components/styleguide/styleguideCatalog";
import { StyleguideSectionNav } from "../components/styleguide/StyleguideSectionNav";

const principles = [
  "Paper and ink first; use color as a semantic accent.",
  "Choose an existing primitive before inventing a new pattern.",
  "Reserve framed surfaces for meaningful groups of content.",
  "Let narrative content lead; keep controls and chrome subordinate.",
] as const;

const categoryHeadingId = (category: string): string =>
  `styleguide-${category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;

const CatalogEntry = ({ path }: { path: string }): JSX.Element | null => {
  const entry = styleguideCatalog.find((candidate) => candidate.path === path);

  if (!entry) {
    return null;
  }

  const children = styleguideCatalogChildren(entry.path);

  return (
    <li className="stack gap-1">
      <Link
        to={entry.path}
        className="w-fit font-ui text-base font-bold uppercase tracking-[0.06em] text-kac-iron underline decoration-kac-gold decoration-4 underline-offset-4 transition-colors hover:text-kac-iron-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kac-iron"
      >
        {entry.title}
      </Link>
      <Text variant="note" color="iron-light" className="max-w-3xl text-sm">
        <span className="font-bold text-kac-iron">Use when: </span>
        {entry.useWhen}
      </Text>
      {entry.componentNames && entry.componentNames.length > 0 ? (
        <Text variant="note" color="iron-light" className="text-xs">
          <span className="font-bold text-kac-iron">Primitives: </span>
          {entry.componentNames.join(" · ")}
        </Text>
      ) : null}
      {children.length > 0 ? (
        <ul className="ml-3 mt-2 stack gap-3 border-l-2 border-kac-bone-dark/45 pl-4">
          {children.map((child) => (
            <CatalogEntry key={child.path} path={child.path} />
          ))}
        </ul>
      ) : null}
    </li>
  );
};

export const StyleguideIndexPage = (): JSX.Element => {
  return (
    <div className="styleguide-index-page app-shell stack gap-8 py-8">
      <StyleguideSectionNav />

      <header className="stack gap-3">
        <Heading
          level="h1"
          color="iron"
          className="relative z-0 text-[2.4rem] leading-none sm:text-[3.4rem] sm:leading-none"
          highlightProps={{ color: "gold" }}
        >
          Component directory
        </Heading>
        <Text variant="body" color="iron-light" className="max-w-3xl">
          Before adding a new UI pattern, check this index for an existing
          primitive. Each page explains the intended use and available exports.
        </Text>
      </header>

      <section aria-labelledby="styleguide-principles" className="stack gap-3">
        <Label color="cloth" rotate={false} className="self-start">
          <span id="styleguide-principles">Working principles</span>
        </Label>
        <ul className="grid gap-2 sm:grid-cols-2">
          {principles.map((principle) => (
            <li key={principle} className="border-l-2 border-kac-gold pl-3 font-body text-sm text-kac-iron-light">
              {principle}
            </li>
          ))}
        </ul>
      </section>

      <div className="stack gap-8">
        {styleguideCategories.map((category) => {
          const headingId = categoryHeadingId(category);
          const entries = styleguideCatalog.filter(
            (entry) =>
              entry.category === category &&
              entry.parent === undefined &&
              isStyleguideCatalogEntryAvailable(entry),
          );

          return (
            <section key={category} aria-labelledby={headingId} className="stack gap-4">
              <Heading level="h2" color="iron" className="text-[1.8rem] leading-none">
                <span id={headingId}>{category}</span>
              </Heading>
              <ul className="grid gap-5 lg:grid-cols-2">
                {entries.map((entry) => (
                  <CatalogEntry key={entry.path} path={entry.path} />
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
};
