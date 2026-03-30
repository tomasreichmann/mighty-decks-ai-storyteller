import { Tabs, type TabItem } from "../common/Tabs";
import type { ToggleButtonColor } from "../common/ToggleButton";

export interface AdventureModuleTabItem {
  id: string;
  label: string;
}

interface AdventureModuleTabNavProps {
  moduleSlug: string;
  tabs: AdventureModuleTabItem[];
  buildTabPath?: (moduleSlug: string, tabId: string) => string;
  color?: ToggleButtonColor;
}

export const AdventureModuleTabNav = ({
  moduleSlug,
  tabs,
  buildTabPath,
  color = "gold",
}: AdventureModuleTabNavProps): JSX.Element => {
  const encodedModuleSlug = encodeURIComponent(moduleSlug);

  const items: TabItem[] = tabs.map((tab) => ({
    id: tab.id,
    label: tab.label,
    to: buildTabPath
      ? buildTabPath(moduleSlug, tab.id)
      : `/adventure-module/${encodedModuleSlug}/${tab.id}`,
  }));

  return <Tabs items={items} ariaLabel="Adventure module sections" color={color} />;
};
