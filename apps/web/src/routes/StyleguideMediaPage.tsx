import { Link } from "react-router-dom";
import { Button } from "../components/common/Button";
import { Heading } from "../components/common/Heading";
import { ImageCard } from "../components/common/ImageCard";
import { Label } from "../components/common/Label";
import { StoryTileCard } from "../components/common/StoryTileCard";
import { Tag } from "../components/common/Tag";
import { Text } from "../components/common/Text";
import { StyleguideSectionNav } from "../components/styleguide/StyleguideSectionNav";

const sampleImage = "/sample-scene-image.png";

export const StyleguideMediaPage = (): JSX.Element => {
  return (
    <div className="app-shell stack gap-7 py-8">
      <StyleguideSectionNav />

      <header className="stack gap-2">
        <Heading level="h1" color="iron" highlightProps={{ color: "gold" }}>
          Media
        </Heading>
        <Text variant="body" color="iron-light" className="max-w-3xl text-sm">
          Use media cards when art supports a scene, module, or campaign. Keep the
          artwork clean; the reading happens in the warm paper caption below it.
        </Text>
      </header>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="stack gap-3">
          <Label color="gold" rotate={false}>Compact image card</Label>
          <ImageCard imageUrl={sampleImage} imageAlt="A sample fantasy scene" label="Scene" />
          <Text variant="note" color="iron-light" className="text-xs">
            Responsive art frame with a small label touching the lower-left edge.
          </Text>
        </div>

        <div className="stack gap-3">
          <Label color="cloth" rotate={false}>Image + caption</Label>
          <StoryTileCard
            title="The Hidden Valley"
            imageUrl={sampleImage}
            imageAlt="A sample fantasy scene"
            summary="A quiet route through the cliffs leads toward a valley full of old promises."
          />
        </div>

        <div className="stack gap-3 lg:col-span-2">
          <Label color="monster" rotate={false}>Narrative story card</Label>
          <StoryTileCard
            title="The Brass Orchard"
            imageUrl={sampleImage}
            imageAlt="A sample fantasy scene"
            topMeta={<Tag tone="cloth" size="sm">3 scenes</Tag>}
            kindBadge={<Tag tone="bone" size="sm">Campaign</Tag>}
            summary="An impossible orchard begins bearing metal fruit just as the river town prepares for its festival."
            supportingContent={<Text variant="note" color="steel-dark" className="text-xs">Updated today · By the table</Text>}
          />
        </div>

        <div className="stack gap-3 lg:col-span-2">
          <Label color="fire" rotate={false}>Metadata + actions</Label>
          <StoryTileCard
            title="Signal from the Watchtower"
            imageUrl={sampleImage}
            imageAlt="A sample fantasy scene"
            topMeta={<><Tag tone="monster" size="sm">Live</Tag><Tag tone="steel" size="sm">2 players</Tag></>}
            kindBadge={<Tag tone="bone" size="sm">Module</Tag>}
            summary="A clear starting point with status, a readable summary, and secondary actions held beneath the story."
            actions={<><Button variant="ghost" color="cloth" size="sm">Preview</Button><Button color="gold" size="sm">Open</Button></>}
          />
        </div>
      </section>

      <Link to="/styleguide" className="w-fit font-ui text-sm font-bold uppercase tracking-[0.08em] text-kac-iron underline decoration-kac-gold decoration-4 underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kac-iron">
        Back to overview
      </Link>
    </div>
  );
};
