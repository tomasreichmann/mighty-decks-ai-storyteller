import { cn } from "../utils/cn";
import { Button } from "./common/Button";
import { Highlight } from "./common/Highlight";

interface CreateAdventureCTAProps {
  className?: string;
  onCreate: () => void;
}

export const CreateAdventureCTA = ({
  className,
  onCreate,
}: CreateAdventureCTAProps): JSX.Element => {
  return (
    <div className="relative group">
      <div className={cn("flex flex-wrap gap-3 relative z-10", className)}>
        <Button size="lg" onClick={onCreate}>
          Start an Adventure
        </Button>
      </div>
      <Highlight
        color="gold"
        animate="infinite"
        lineCount={4}
        canvasWidth={600}
        brushHeight={20}
        className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-[150%] h-[150%] hidden group-hover:block opacity-0 group-hover:opacity-50"
      />
    </div>
  );
};
