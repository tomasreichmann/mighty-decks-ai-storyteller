import { useNavigate, useParams } from "react-router-dom";
import { AdventureHeader } from "../components/AdventureHeader";
import { RoleSelectCard } from "../components/RoleSelectCard";
import { Message } from "../components/common/Message";

export const RoleSelectPage = (): JSX.Element => {
  const navigate = useNavigate();
  const { adventureId } = useParams<{ adventureId: string }>();

  if (!adventureId) {
    return (
      <main className="app-shell py-10 gap-4">
        <Message label="Error" color="curse">
          Missing adventureId.
        </Message>
      </main>
    );
  }

  const handleSelectRole = (role: "player" | "screen"): void => {
    navigate(`/adventure/${adventureId}/${role}`);
  };

  return (
    <main className="app-shell stack py-10 gap-4">
      <AdventureHeader adventureId={adventureId} />
      <RoleSelectCard onSelectRole={handleSelectRole} />
    </main>
  );
};
