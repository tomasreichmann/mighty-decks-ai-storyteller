import type { ScenePublic } from "@mighty-decks/spec/adventureState";
import { Section } from "./common/Section";
import { Text } from "./common/Text";
import { Panel } from "./common/Panel";
import { Message } from "./common/Message";

interface NarratedSceneCardProps {
  scene: ScenePublic;
  variant?: "intro" | "closing";
}

export const NarratedSceneCard = ({
  scene,
  variant = "intro",
}: NarratedSceneCardProps): JSX.Element => {
  const isClosing = variant === "closing";
  const imageUrl = isClosing ? scene.closingImageUrl : scene.imageUrl;
  const imagePending = isClosing ? scene.closingImagePending : scene.imagePending;
  const prose = isClosing
    ? scene.closingProse ?? scene.summary ?? scene.introProse
    : scene.introProse;

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
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={isClosing ? "Scene closing visual" : "Scene visual"}
                className="absolute h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Text
                  variant="emphasised"
                  color="steel-light"
                  className="text-sm"
                >
                  {imagePending
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
          {prose}
        </Text>
      </Panel>
      {isClosing ? (
        <Message label="Scene Closed" color="monster">
          <Text variant="body" color="iron-light" className="text-sm">
            {scene.summary ??
              "The immediate scene objective is resolved. Vote to continue or end the session."}
          </Text>
        </Message>
      ) : (
        <>
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
        </>
      )}
    </Section>
  );
};
