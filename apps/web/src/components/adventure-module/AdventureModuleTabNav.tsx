import { Tabs, type TabItem } from "../common/Tabs";

export interface AdventureModuleTabItem {
  id: string;
  label: string;
}

interface AdventureModuleTabNavProps {
  moduleSlug: string;
  tabs: AdventureModuleTabItem[];
  buildTabPath?: (moduleSlug: string, tabId: string) => string;
}

export const AdventureModuleTabNav = ({
  moduleSlug,
  tabs,
  buildTabPath,
}: AdventureModuleTabNavProps): JSX.Element => {
  const encodedModuleSlug = encodeURIComponent(moduleSlug);

  const items: TabItem[] = tabs.map((tab) => ({
    id: tab.id,
    label: tab.label,
    to: buildTabPath
      ? buildTabPath(moduleSlug, tab.id)
      : `/adventure-module/${encodedModuleSlug}/${tab.id}`,
  }));

  return <Tabs items={items} ariaLabel="Adventure module sections" />;
};
