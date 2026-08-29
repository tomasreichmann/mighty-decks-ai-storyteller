import { CTAButton } from "./common/CTAButton";

interface CreateAdventureCTAProps {
  className?: string;
  onCreate: () => void;
  disabled?: boolean;
}

export const CreateAdventureCTA = ({
  className,
  onCreate,
  disabled = false,
}: CreateAdventureCTAProps): JSX.Element => {
  return (
    <CTAButton
      size="lg"
      onClick={onCreate}
      disabled={disabled}
      containerClassName={className}
      title={disabled ? "Storyteller tools will unlock when the server is ready." : undefined}
    >
      {disabled ? "Waking the Storyteller…" : "Start an Adventure"}
    </CTAButton>
  );
};
