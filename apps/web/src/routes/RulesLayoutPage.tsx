import { Outlet, useLocation } from "react-router-dom";
import { Heading } from "../components/common/Heading";
import { Tabs, type TabItem } from "../components/common/Tabs";
import { Text } from "../components/common/Text";
import { SectionBoundary } from "../components/common/SectionBoundary";

const rulesTabs: TabItem[] = [
  { to: "/rules/outcomes", label: "Outcomes" },
  { to: "/rules/effects", label: "Effects" },
  { to: "/rules/stunts", label: "Stunts" },
  { to: "/rules/assets", label: "Assets" },
];

export const RulesLayoutPage = (): JSX.Element => {
  const location = useLocation();

  return (
    <div className="app-shell stack py-8 gap-4">
      <div>
        <Heading
          level="h1"
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

      <Tabs items={rulesTabs} ariaLabel="Rules sections" color="cloth" />

      <SectionBoundary
        resetKey={location.pathname}
        title="Rules content failed to render"
        message="This rules section crashed while rendering. Choose another tab or return home."
      >
        <Outlet />
      </SectionBoundary>
    </div>
  );
};
