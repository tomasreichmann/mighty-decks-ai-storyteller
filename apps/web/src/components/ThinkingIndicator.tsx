import { Section } from "./common/Section";

interface ThinkingIndicatorProps {
  label?: string;
}

export const ThinkingIndicator = ({ label = "Storyteller is thinking..." }: ThinkingIndicatorProps): JSX.Element => {
  return (
    <Section className="flex items-center gap-3 border border-dashed border-slate-400 bg-slate-100">
      <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
      <p className="text-sm text-slate-700">{label}</p>
    </Section>
  );
};

