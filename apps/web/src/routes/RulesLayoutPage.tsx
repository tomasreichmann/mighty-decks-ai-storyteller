import { Outlet } from "react-router-dom";
import { Tabs, type TabItem } from "../components/common/Tabs";
import { Text } from "../components/common/Text";

const rulesTabs: TabItem[] = [
  { to: "/rules/outcomes", label: "Outcomes" },
  { to: "/rules/effects", label: "Effects" },
  { to: "/rules/stunts", label: "Stunts" },
  { to: "/rules/assets", label: "Assets" },
];

export const RulesLayoutPage = (): JSX.Element => {
  return (
    <div className="app-shell stack py-8 gap-4">
      <div className="stack gap-1">
        <Text variant="h2" color="iron">
          Rules
        </Text>
        <Text variant="body" color="iron-light" className="text-sm">
          Mighty Decks rule components reference for markdown authoring.
        </Text>
      </div>

      <Tabs items={rulesTabs} ariaLabel="Rules sections" />

      <Outlet />
    </div>
  );
};
