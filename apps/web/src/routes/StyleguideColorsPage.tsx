import { Link } from "react-router-dom";
import { Heading } from "../components/common/Heading";
import { Text } from "../components/common/Text";
import { StyleguideSectionNav } from "../components/styleguide/StyleguideSectionNav";
import { styleguidePaletteFamilies } from "../components/styleguide/styleguideCatalog";

export const StyleguideColorsPage = (): JSX.Element => {
  return (
    <div className="styleguide-colors-page app-shell stack gap-6 py-8">
      <StyleguideSectionNav />

      <header className="stack gap-2">
        <Heading level="h1" color="iron" highlightProps={{ color: "gold" }}>
          Colors
        </Heading>
        <Text variant="body" color="iron-light" className="max-w-3xl text-sm">
          Semantic palette reference. Tailwind remains the implementation source
          of truth; use these names to choose the right family before styling.
        </Text>
      </header>

      <div className="grid gap-3 xl:grid-cols-2">
        {styleguidePaletteFamilies.map((family) => (
          <section
            key={family.tone}
            aria-labelledby={`palette-${family.tone}`}
            className="grid gap-3 rounded-sm border border-kac-iron/35 bg-kac-bone-light/25 p-3 sm:grid-cols-[minmax(8rem,0.7fr)_1fr]"
          >
            <div className="stack gap-1">
              <Text variant="h3" color="iron" className="text-[1.35rem] leading-none">
                <span id={`palette-${family.tone}`}>{family.name}</span>
              </Text>
              <Text variant="note" color="iron-light" className="text-xs font-bold uppercase tracking-[0.08em]">
                {family.meaning}
              </Text>
              <Text variant="note" color="iron-light" className="text-xs">
                {family.description}
              </Text>
            </div>
            <ul className="flex flex-wrap content-start gap-2" aria-label={`${family.name} variants`}>
              {family.variants.map((variant, index) => (
                <li key={variant.token} className="flex min-w-[5.4rem] items-center gap-1.5">
                  <span
                    aria-hidden="true"
                    className={index === 0 ? "h-8 w-8 shrink-0 rounded-sm border border-kac-iron" : "h-5 w-5 shrink-0 rounded-sm border border-kac-iron/55"}
                    style={{ backgroundColor: variant.hex }}
                  />
                  <span className="font-ui text-2xs font-bold uppercase leading-tight text-kac-iron">
                    {variant.token}
                    <span className="block font-body font-normal normal-case text-kac-iron-light">{variant.hex}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <Link
        to="/styleguide"
        className="w-fit font-ui text-sm font-bold uppercase tracking-[0.08em] text-kac-iron underline decoration-kac-gold decoration-4 underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kac-iron"
      >
        Back to overview
      </Link>
    </div>
  );
};
