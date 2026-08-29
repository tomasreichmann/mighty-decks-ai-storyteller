import { useNavigate } from "react-router-dom";
import { CreateAdventureCTA } from "../components/CreateAdventureCTA";
import { LandingHero } from "../components/LandingHero";
import { SampleSession } from "../components/SampleSession";
/* import { OutcomeCardShowcase } from "../components/OutcomeCardShowcase"; */
import { createAdventureId } from "../lib/ids";
import { Heading } from "../components/common/Heading";
import { useBackendReadinessContext } from "../components/BackendReadinessProvider";
import { Button } from "../components/common/Button";
import { Message } from "../components/common/Message";
import { Text } from "../components/common/Text";
import { getBackendWakeCopy } from "../lib/backendReadiness";

export const LandingPage = (): JSX.Element => {
  const navigate = useNavigate();
  const { status, elapsedMs, retry } = useBackendReadinessContext();
  const storytellerReady = status === "ready";
  const wakeCopy = getBackendWakeCopy(status, elapsedMs);

  const handleCreateAdventure = (): void => {
    const adventureId = createAdventureId();
    navigate(`/adventure/${adventureId}`);
  };

  return (
    <div className="app-shell stack py-10 gap-4">
      <LandingHero />

      <div className="flex flex-row justify-center">
        <CreateAdventureCTA onCreate={handleCreateAdventure} disabled={!storytellerReady} />
      </div>

      {!storytellerReady ? (
        <Message
          color={wakeCopy.canRetry ? "fire" : "cloth"}
          className="mx-auto mt-2 max-w-xl"
          label="Storyteller status"
          rotateLabel={false}
          preserveWhitespace={false}
        >
          <Text as="span" variant="emphasised" color="inherit">
            {wakeCopy.title} 
          </Text>
          {wakeCopy.detail}
          {wakeCopy.canRetry ? (
            <Button
              type="button"
              size="sm"
              color="fire"
              className="ml-3 align-middle"
              onClick={retry}
            >
              Try again
            </Button>
          ) : null}
        </Message>
      ) : null}

      <div className="flex flex-col min-w-0 gap-4 mt-4 max-w-3xl mx-auto">
        <Heading
          level="h2"
          color="iron-light"
          className="text-center font-md-title tracking-normal rotate-[-2deg] skew-x-[-10deg] mb-2"
          highlightProps={{ color: "monster-light" }}
        >
          Sample adventure
        </Heading>

        <SampleSession />

        <div className="flex flex-row justify-center">
          <CreateAdventureCTA onCreate={handleCreateAdventure} disabled={!storytellerReady} />
        </div>
      </div>
    </div>
  );
};
