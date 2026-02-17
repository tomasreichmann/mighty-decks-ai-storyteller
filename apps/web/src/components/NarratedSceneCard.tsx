import type { ScenePublic } from "@mighty-decks/spec/adventureState";
import { Section } from "./common/Section";
import { Text } from "./common/Text";
import { Panel } from "./common/Panel";
import { Message } from "./common/Message";
import { FramedGeneratedImage } from "./FramedGeneratedImage";

interface NarratedSceneCardProps {
  scene: ScenePublic;
  variant?: "intro" | "closing";
}

const STATIC_IMAGE_PATH_PREFIXES = ["/scenes/", "/profiles/"];

const resolveNarratedImageUrl = (imageUrl: string): string => {
  if (
    imageUrl.startsWith("http://") ||
    imageUrl.startsWith("https://") ||
    imageUrl.startsWith("data:")
  ) {
    return imageUrl;
  }

  if (
    typeof window !== "undefined" &&
    STATIC_IMAGE_PATH_PREFIXES.some((prefix) => imageUrl.startsWith(prefix))
  ) {
    return new URL(imageUrl, window.location.origin).toString();
  }

  return imageUrl;
};

export const NarratedSceneCard = ({
  scene,
  variant = "intro",
}: NarratedSceneCardProps): JSX.Element => {
  const isClosing = variant === "closing";
  const imageUrl = isClosing ? scene.closingImageUrl : scene.imageUrl;
  const imagePending = isClosing ? scene.closingImagePending : scene.imagePending;
  const imageError = isClosing ? scene.closingImageError : scene.imageError;
  const image = imageUrl
    ? {
        imageId: `${scene.sceneId}-${variant}-image`,
        imageUrl: resolveNarratedImageUrl(imageUrl),
        alt: isClosing ? "Scene closing visual" : "Scene visual",
      }
    : null;
  const prose = isClosing
    ? scene.closingProse ?? scene.introProse
    : scene.introProse;
  const turnOrderActive = Boolean(scene.activeActorPlayerId);

  return (
    <Section className="stack gap-2">
      <FramedGeneratedImage
        image={image}
        pending={imagePending}
        failed={Boolean(imageError && imageError.trim().length > 0)}
        pendingLabel={
          isClosing
            ? "Generating closing scene image..."
            : "Generating scene image..."
        }
        failedLabel={
          imageError && imageError.trim().length > 0
            ? imageError
            : isClosing
              ? "Closing scene image failed to generate."
              : "Scene image failed to generate."
        }
        emptyLabel={isClosing ? "No closing image yet." : "No image yet."}
      />
      <Panel className="-mt-4">
        <Text variant="quote" color="iron" className="text-base">
          {prose}
        </Text>
      </Panel>
      {isClosing ? null : (
        <>
          {scene.mode === "high_tension" && turnOrderActive ? (
            <Message label="Turn Order" color="curse">
              <Text variant="body" color="iron-light" className="text-sm">
                High tension.{" "}
                {scene.activeActorName
                  ? `${scene.activeActorName} acts next.`
                  : "Next actor is being determined."}
              </Text>
            </Message>
          ) : scene.mode === "high_tension" ? (
            <Message label="Scene Pace" color="curse">
              <Text variant="body" color="iron-light" className="text-sm">
                High tension. Pressure is elevated, but players may act freely
                until someone is under direct scrutiny.
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
