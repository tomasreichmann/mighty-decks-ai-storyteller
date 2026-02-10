import { Button } from "./common/Button";

interface CreateAdventureCTAProps {
  onCreate: () => void;
}

export const CreateAdventureCTA = ({ onCreate }: CreateAdventureCTAProps): JSX.Element => {
  return (
    <div className="flex flex-wrap gap-3">
      <Button size="lg" onClick={onCreate}>
        Create Adventure
      </Button>
    </div>
  );
};
