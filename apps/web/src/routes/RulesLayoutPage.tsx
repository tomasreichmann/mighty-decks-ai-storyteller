import { Outlet } from "react-router-dom";
import { Heading } from "../components/common/Heading";
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
      <div>
        <Heading
          variant="h1"
          color="iron"
          className="relative z-0 text-[2.4rem] leading-none sm:text-[3.4rem] sm:leading-none"
          highlightProps={{
            color: "gold",
            lineHeight: 8,
            brushHeight: 6,
            lineOffsets: [0, 8, 14, 20],
            className:
              "left-1/2 bottom-[0.08em] h-[0.5em] w-[calc(100%+0.22em)] -translate-x-1/2",
          }}
        >
          Rules
        </Heading>
        <Text
          variant="body"
          color="iron-light"
          className="relative z-10 mt-3 text-sm"
        >
          Mighty Decks rule components reference for markdown authoring.
        </Text>
      </div>

      <Tabs items={rulesTabs} ariaLabel="Rules sections" />

      <Outlet />
    </div>
  );
};
