import type { ScenePublic } from "@mighty-decks/spec/adventureState";
import { Section } from "./common/Section";
import { Text } from "./common/Text";
import { Panel } from "./common/Panel";

interface NarratedSceneCardProps {
  scene: ScenePublic;
}

export const NarratedSceneCard = ({
  scene,
}: NarratedSceneCardProps): JSX.Element => {
  return (
    <Section className="stack gap-2">
      <div className="relative aspect-video overflow-hidden -m-1 border border-kac-steel-dark/40 bg-kac-steel skew-clip-mask">
        {scene.imageUrl ? (
          <img
            src={scene.imageUrl}
            alt="Scene visual"
            className="absolute h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Text variant="body" color="steel-dark" className="text-sm">
              {scene.imagePending
                ? "Generating scene image..."
                : "No image yet"}
            </Text>
          </div>
        )}
      </div>
      <Panel>
        <Text variant="quote" color="iron" className="text-base">
          {scene.introProse}
        </Text>
      </Panel>
      {scene.summary ? (
        <div className="rounded-md bg-kac-steel-light p-3">
          <Text variant="body" color="iron-light" className="text-sm">
            <strong>Scene Summary:</strong> {scene.summary}
          </Text>
        </div>
      ) : null}
    </Section>
  );
};
