import type { ScenePublic } from "@mighty-decks/spec/adventureState";
import { Section } from "./common/Section";

interface NarratedSceneCardProps {
  scene: ScenePublic;
}

export const NarratedSceneCard = ({
  scene,
}: NarratedSceneCardProps): JSX.Element => {
  return (
    <Section className="stack">
      <div className="relative aspect-video overflow-hidden rounded-md border border-kac-steel-dark/40 bg-kac-steel">
        {scene.imageUrl ? (
          <img
            src={scene.imageUrl}
            alt="Scene visual"
            className="absolute h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-kac-steel-dark">
            {scene.imagePending ? "Generating scene image..." : "No image yet"}
          </div>
        )}
      </div>
      <p className="text-base italic leading-relaxed text-kac-iron">
        {scene.introProse}
      </p>
      {scene.summary ? (
        <div className="rounded-md bg-kac-steel-light p-3 text-sm text-kac-iron-light">
          <strong>Scene Summary:</strong> {scene.summary}
        </div>
      ) : null}
    </Section>
  );
};
