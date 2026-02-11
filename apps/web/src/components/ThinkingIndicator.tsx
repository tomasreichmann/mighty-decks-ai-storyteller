import { Section } from "./common/Section";
import { Text } from "./common/Text";

interface ThinkingIndicatorProps {
  label?: string;
}

export const ThinkingIndicator = ({ label = "Storyteller is thinking..." }: ThinkingIndicatorProps): JSX.Element => {
  return (
    <Section className="flex items-center gap-3 border border-dashed border-kac-steel-dark/60 bg-kac-steel-light">
      <span className="h-2 w-2 animate-pulse rounded-full bg-kac-gold-dark" />
      <Text variant="body" color="iron-light" className="text-sm">
        {label}
      </Text>
    </Section>
  );
};

