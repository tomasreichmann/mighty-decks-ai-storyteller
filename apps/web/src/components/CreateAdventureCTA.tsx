import { CTAButton } from "./common/CTAButton";

interface CreateAdventureCTAProps {
  className?: string;
  onCreate: () => void;
}

export const CreateAdventureCTA = ({
  className,
  onCreate,
}: CreateAdventureCTAProps): JSX.Element => {
  return (
    <CTAButton size="lg" onClick={onCreate} containerClassName={className}>
      Start an Adventure
    </CTAButton>
  );
};
