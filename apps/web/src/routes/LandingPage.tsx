import { useNavigate } from "react-router-dom";
import { CreateAdventureCTA } from "../components/CreateAdventureCTA";
import { LandingHero } from "../components/LandingHero";
import { SampleSession } from "../components/SampleSession";
/* import { OutcomeCardShowcase } from "../components/OutcomeCardShowcase"; */
import { createAdventureId } from "../lib/ids";
import { Text } from "../components/common/Text";
import { Heading } from "../components/common/Heading";

export const LandingPage = (): JSX.Element => {
  const navigate = useNavigate();

  const handleCreateAdventure = (): void => {
    const adventureId = createAdventureId();
    navigate(`/adventure/${adventureId}`);
  };

  return (
    <main className="app-shell stack py-10 gap-4">
      <LandingHero />

      <div className="flex flex-row justify-center">
        <CreateAdventureCTA onCreate={handleCreateAdventure} />
      </div>

      <div className="flex flex-col min-w-0 gap-4 mt-4 max-w-3xl mx-auto">
        <Heading
          variant="h2"
          color="iron-light"
          className="text-center font-md-title tracking-normal rotate-[-2deg] skew-x-[-10deg] mb-2"
          highlightProps={{ color: "monster-light" }}
        >
          Sample adventure
        </Heading>

        <SampleSession />

        <div className="flex flex-row justify-center">
          <CreateAdventureCTA onCreate={handleCreateAdventure} />
        </div>

        <Text
          variant="emphasised"
          color="steel-dark"
          className="text-center mt-4"
        >
          Made by{" "}
          <a
            href="mailto:tomasreichmann@gmail.com"
            target="_blank"
            className="text-kac-gold-darker hover:underline"
          >
            Tomas Reichmann
          </a>
          &nbsp;2026
        </Text>
      </div>
    </main>
  );
};
