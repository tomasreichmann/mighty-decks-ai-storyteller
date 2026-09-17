import { Button } from "../components/common/Button";
import { Heading } from "../components/common/Heading";
import { Text } from "../components/common/Text";
import { StyleguideSectionNav } from "../components/styleguide/StyleguideSectionNav";
import { styleguidePaletteFamilies } from "../components/styleguide/styleguideCatalog";

const variantCount = styleguidePaletteFamilies.reduce(
  (count, family) => count + family.variants.length,
  0,
);

export const StyleguideColorsPage = (): JSX.Element => {
  return (
    <div className="styleguide-colors-page app-shell stack gap-10 py-8">
      <StyleguideSectionNav />

      <header className="stack gap-5">
        <Text variant="body" color="iron-light" className="text-xs font-bold uppercase tracking-widest">
          The Mighty Decks palette / {styleguidePaletteFamilies.length} families / {variantCount} colors
        </Text>
        <Heading level="h1" color="iron" highlightProps={{ color: "gold" }}>
          Colors with character
        </Heading>
        <Text variant="body" color="iron" className="max-w-2xl">
          Warm paper, bold accents, and a color for every cue. Start with a
          family's purpose, then choose the shade that fits.
        </Text>
        <ul className="grid grid-cols-5 gap-x-2 gap-y-5 sm:grid-cols-10" aria-label="Palette at a glance">
          {styleguidePaletteFamilies.map((family) => (
            <li key={family.tone} className="min-w-0">
              <div
                aria-hidden="true"
                className="mb-2 h-20 rounded-sm border-2 border-kac-iron shadow-[4px_4px_0_0_#121b23] sm:h-28"
                style={{ backgroundColor: family.variants[0].hex }}
              />
              <Text variant="body" color="iron" className="text-xs font-bold sm:text-sm">
                {family.name}
              </Text>
            </li>
          ))}
        </ul>
      </header>

      <div className="flex flex-col gap-3 border-y-2 border-kac-iron py-5 sm:flex-row sm:items-baseline sm:justify-between">
        <Heading level="h2" highlightProps={{ color: "bone" }} className="text-2xl sm:text-3xl">
          Explore the families
        </Heading>
        <Text variant="body" color="iron-light" className="max-w-md text-sm">
          Keep everyday surfaces neutral. Use color to guide attention,
          signal a state, or add emphasis.
        </Text>
      </div>

      <div className="stack gap-8">
        {styleguidePaletteFamilies.map((family, familyIndex) => (
          <section
            key={family.tone}
            aria-labelledby={`palette-${family.tone}`}
            className="grid gap-5 border-b-2 border-kac-iron pb-8 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-8"
          >
            <div className="stack gap-3">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-kac-iron-light" aria-hidden="true">
                  {String(familyIndex + 1).padStart(2, "0")}
                </span>
                <div id={`palette-${family.tone}`}>
                  <Heading level="h3" highlightProps={{ color: family.tone }}>
                    {family.name}
                  </Heading>
                </div>
              </div>
              <Text variant="body" color="iron" className="mt-1 text-xs font-bold uppercase tracking-widest">
                {family.meaning}
              </Text>
              <Text variant="body" color="iron-light" className="max-w-lg text-sm">
                {family.description}
              </Text>
            </div>

            <ul
              className="grid grid-cols-2 gap-3 sm:flex sm:gap-2"
              aria-label={`${family.name} variants`}
            >
              {family.variants.map((variant, index) => (
                <li key={variant.token} className="min-w-0 sm:flex-1">
                  <div
                    aria-hidden="true"
                    className="h-28 rounded-sm border-2 border-kac-iron shadow-[4px_4px_0_0_#121b23] sm:h-36"
                    style={{ backgroundColor: variant.hex }}
                  />
                  <div className="stack gap-1 pt-3">
                    <Text variant="body" color="iron" className="text-sm font-bold capitalize">
                      {index === 0 ? "Base" : variant.token.slice(family.tone.length + 1)}
                    </Text>
                    <code className="break-words font-mono text-xs leading-relaxed text-kac-iron-light">
                      kac-{variant.token}
                    </code>
                    <span className="font-mono text-sm text-kac-iron">
                      {variant.hex}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <footer className="flex flex-col items-start gap-4 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <Text variant="body" color="iron-light" className="max-w-xl text-sm">
          Token names and hex values are shown for every shade. Tailwind is the
          implementation source of truth.
        </Text>
        <Button href="/styleguide" variant="ghost" size="sm">
          Back to overview
        </Button>
      </footer>
    </div>
  );
};
