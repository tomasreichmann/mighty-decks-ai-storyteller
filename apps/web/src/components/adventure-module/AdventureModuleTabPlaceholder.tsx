import { Panel } from "../common/Panel";
import { Text } from "../common/Text";

interface AdventureModuleTabPlaceholderProps {
  description: string;
}

export const AdventureModuleTabPlaceholder = ({
  description,
}: AdventureModuleTabPlaceholderProps): JSX.Element => {
  return (
    <Panel className="stack gap-3">
      <Text variant="body" color="iron-light" className="text-sm">
        {description}
      </Text>
    </Panel>
  );
};
