import type { ScenePublic } from "@mighty-decks/spec/adventureState";
import { Section } from "./common/Section";
import { Text } from "./common/Text";
import { Panel } from "./common/Panel";
import { Message } from "./common/Message";

interface NarratedSceneCardProps {
  scene: ScenePublic;
}

export const NarratedSceneCard = ({
  scene,
}: NarratedSceneCardProps): JSX.Element => {
  return (
    <Section className="stack gap-2">
      <div className="relative aspect-video ">
        <div className="absolute inset-0 overflow-hidden -m-1 bg-kac-iron-dark skew-clip-mask">
          <div
            className="absolute inset-0 -m-3 bg-ink skew-clip-mask skew-clip-border"
            style={{ "--skew-offset": "4%" } as React.CSSProperties}
          ></div>
          <div
            className="absolute inset-0 m-3 bg-kac-bone skew-clip-mask"
            style={{ "--skew-offset": "4%" } as React.CSSProperties}
          ></div>
          <div
            className="absolute inset-[2px] overflow-hidden m-3 bg-kac-iron-dark skew-clip-mask"
            style={{ "--skew-offset": "4%" } as React.CSSProperties}
          >
            <div className="halftone-vignette-wrapper !z-50 !mix-blend-multiply">
              <div className="halftone-vignette"></div>
            </div>
            {scene.imageUrl ? (
              <img
                src={scene.imageUrl}
                alt="Scene visual"
                className="absolute h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Text
                  variant="emphasised"
                  color="steel-light"
                  className="text-sm"
                >
                  {scene.imagePending
                    ? "Generating scene image..."
                    : "No image yet"}
                </Text>
              </div>
            )}
          </div>
        </div>
      </div>
      <Panel className="-mt-4">
        <Text variant="quote" color="iron" className="text-base">
          {scene.introProse}
        </Text>
      </Panel>
      {scene.mode === "high_tension" ? (
        <Message label="Turn Order" color="curse">
          <Text variant="body" color="iron-light" className="text-sm">
            High tension.{" "}
            {scene.activeActorName
              ? `${scene.activeActorName} acts next.`
              : "Next actor is being determined."}
          </Text>
        </Message>
      ) : (
        <Message label="Scene Pace" color="cloth">
          <Text variant="body" color="iron-light" className="text-sm">
            Low tension. Players may act freely while the queue is clear.
          </Text>
        </Message>
      )}
      {scene.summary ? (
        <Message label="Scene Summary" color="monster">
          <Text variant="body" color="iron-light" className="text-sm">
            {scene.summary}
          </Text>
        </Message>
      ) : null}
    </Section>
  );
};
