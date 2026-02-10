import { Button } from "./common/Button";
import { Section } from "./common/Section";

interface RoleSelectCardProps {
  onSelectRole: (role: "player" | "screen") => void;
}

export const RoleSelectCard = ({ onSelectRole }: RoleSelectCardProps): JSX.Element => {
  return (
    <Section className="stack">
      <h2 className="text-2xl font-bold text-ink">Choose your role</h2>
      <p className="text-slate-700">Use Player on phones and Screen on the shared display.</p>
      <div className="flex gap-3">
        <Button onClick={() => onSelectRole("player")}>Player</Button>
        <Button variant="secondary" onClick={() => onSelectRole("screen")}>Screen</Button>
      </div>
    </Section>
  );
};

