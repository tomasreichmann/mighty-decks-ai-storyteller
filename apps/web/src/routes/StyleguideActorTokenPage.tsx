import { Heading } from "../components/common/Heading";
import { Panel } from "../components/common/Panel";
import { Text } from "../components/common/Text";
import { ActorToken } from "../components/spaceship/ActorToken";
import { StyleguideBackLink } from "../components/styleguide/GameCard";
import { StyleguideSectionNav } from "../components/styleguide/StyleguideSectionNav";

export const StyleguideActorTokenPage = (): JSX.Element => {
  return (
    <div className="styleguide-actor-token-page app-shell stack gap-6 py-8">
      <StyleguideBackLink />
      <StyleguideSectionNav />

      <div className="stack gap-2">
        <Heading
          level="h1"
          color="iron"
          className="text-[2.2rem] sm:text-[3.2rem]"
          highlightProps={{ color: "monster-light" }}
        >
          Actor Token
        </Heading>
        <Text variant="body" color="iron-light" className="max-w-3xl text-sm">
          Circular tactical portrait token for ship-board positioning. It keeps
          the comic border language while leaving enough room for a label and
          short room-status caption below the portrait.
        </Text>
      </div>

      <Panel as="section" tone="bone" contentClassName="stack gap-4">
        <Text variant="h3" color="iron" className="text-[1.7rem]">
          Token states
        </Text>
        <div className="grid gap-6 md:grid-cols-3">
          <ActorToken
            label="Void-seer"
            imageUrl="/actors/base/manipulator.png"
            title="Sensor Array"
            subtitle="Surveying"
            tone="cloth"
          />
          <ActorToken
            label="Medic"
            imageUrl="/actors/base/healer.png"
            title="Life Support"
            subtitle="Repressurizing"
            tone="monster"
          />
          <ActorToken
            label="Raider"
            imageUrl="/actors/base/animal-red.png"
            title="Weapons"
            subtitle="Target lock"
            tone="blood"
          />
        </div>
      </Panel>
    </div>
  );
};
