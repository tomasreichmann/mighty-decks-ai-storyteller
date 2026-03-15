import { Panel } from "../components/common/Panel";
import { Text } from "../components/common/Text";

export const RulesIndexPage = (): JSX.Element => {
  return (
    <Panel className="stack gap-2" contentClassName="stack gap-2">
      <Text variant="emphasised" color="iron">
        Rules navigation stub
      </Text>
      <Text variant="body" color="iron-light" className="text-sm">
        Choose Outcomes, Effects, Stunts, or Assets. Full rulebook content will be added in a later milestone.
      </Text>
    </Panel>
  );
};
