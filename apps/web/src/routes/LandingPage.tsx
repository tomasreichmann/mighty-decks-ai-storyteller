import { useNavigate } from "react-router-dom";
import { CreateAdventureCTA } from "../components/CreateAdventureCTA";
import { LandingHero } from "../components/LandingHero";
import { OutcomeCardShowcase } from "../components/OutcomeCardShowcase";
import { createAdventureId } from "../lib/ids";

export const LandingPage = (): JSX.Element => {
  const navigate = useNavigate();

  const handleCreateAdventure = (): void => {
    const adventureId = createAdventureId();
    navigate(`/adventure/${adventureId}`);
  };

  return (
    <main className="app-shell stack py-10 gap-4">
      <LandingHero />
      <OutcomeCardShowcase />
      <CreateAdventureCTA onCreate={handleCreateAdventure} />
    </main>
  );
};
