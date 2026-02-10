import { useNavigate, useParams } from "react-router-dom";
import { AdventureHeader } from "../components/AdventureHeader";
import { RoleSelectCard } from "../components/RoleSelectCard";

export const RoleSelectPage = (): JSX.Element => {
  const navigate = useNavigate();
  const { adventureId } = useParams<{ adventureId: string }>();

  if (!adventureId) {
    return (
      <main className="app-shell py-10">
        <p className="text-red-700">Missing adventureId.</p>
      </main>
    );
  }

  const handleSelectRole = (role: "player" | "screen"): void => {
    navigate(`/adventure/${adventureId}/${role}`);
  };

  return (
    <main className="app-shell stack py-10">
      <AdventureHeader adventureId={adventureId} />
      <RoleSelectCard onSelectRole={handleSelectRole} />
    </main>
  );
};
