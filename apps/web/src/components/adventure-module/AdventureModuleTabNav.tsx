import React, { type ReactNode, useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "../../utils/cn";
import { Dropdown } from "../common/Dropdown";
import { Tabs, type TabItem } from "../common/Tabs";
import type { ToggleButtonColor } from "../common/ToggleButton";

void React;

export interface AdventureModuleTabItem {
  id: string;
  label: string;
}

interface AdventureModuleTabNavProps {
  moduleSlug: string;
  tabs: AdventureModuleTabItem[];
  buildTabPath?: (moduleSlug: string, tabId: string) => string;
  color?: ToggleButtonColor;
  leadingContent?: ReactNode;
  trailingContent?: ReactNode;
  showMobileMenu?: boolean;
}

interface AdventureModuleSectionMenuProps {
  moduleSlug: string;
  tabs: AdventureModuleTabItem[];
  buildTabPath?: (moduleSlug: string, tabId: string) => string;
  className?: string;
}

const buildTabItems = ({
  moduleSlug,
  tabs,
  buildTabPath,
}: Pick<
  AdventureModuleSectionMenuProps,
  "moduleSlug" | "tabs" | "buildTabPath"
>): TabItem[] => {
  const encodedModuleSlug = encodeURIComponent(moduleSlug);

  return tabs.map((tab) => ({
    id: tab.id,
    label: tab.label,
    to: buildTabPath
      ? buildTabPath(moduleSlug, tab.id)
      : `/adventure-module/${encodedModuleSlug}/${tab.id}`,
  }));
};

const resolveActiveTabItem = (
  items: TabItem[],
  pathname: string,
): TabItem | null => {
  return (
    items.find((item) => {
      if (item.end) {
        return pathname === item.to;
      }

      return pathname === item.to || pathname.startsWith(`${item.to}/`);
    }) ?? items[0] ?? null
  );
};

export const AdventureModuleSectionMenu = ({
  moduleSlug,
  tabs,
  buildTabPath,
  className = "",
}: AdventureModuleSectionMenuProps): JSX.Element => {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const items = buildTabItems({
    moduleSlug,
    tabs,
    buildTabPath,
  });
  const activeItem = resolveActiveTabItem(items, location.pathname);
  const activeLabel = activeItem?.label ?? "Sections";

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <Dropdown
      direction="bottom"
      align="end"
      open={menuOpen}
      onOpenChange={setMenuOpen}
      className={cn("shrink-0", className)}
      menuClassName="z-50 w-fit min-w-[12rem] max-w-[calc(100vw-1rem)] rounded-sm border-2 border-kac-iron bg-[linear-gradient(180deg,#f8efd8_0%,#e5d4b9_100%)] p-1.5 shadow-[3px_3px_0_0_#121b23]"
      renderTrigger={({ onClick, ...triggerProps }) => (
        <button
          type="button"
          {...triggerProps}
          className={cn(
            "inline-flex h-11 min-w-0 max-w-full items-center gap-2 rounded-sm border-2 border-kac-iron bg-gradient-to-b from-[#f8efd8] to-[#d6c1a1] px-3 text-left text-kac-iron shadow-[3px_3px_0_0_#121b23] transition duration-100 hover:brightness-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kac-gold-dark/50",
            menuOpen &&
              "translate-y-[1px] border-kac-iron-dark bg-gradient-to-b from-[#efe1c0] to-[#c9ac84] shadow-[1px_1px_0_0_#121b23]",
          )}
          aria-label={`${
            menuOpen ? "Close" : "Open"
          } adventure module sections menu: ${activeLabel}`}
          onClick={onClick}
        >
          <span className="min-w-0 flex-1 truncate font-ui text-[0.78rem] font-bold uppercase tracking-[0.08em] leading-none sm:text-sm">
            {activeLabel}
          </span>
          <span
            aria-hidden="true"
            className={cn(
              "flex h-6 w-6 shrink-0 items-center justify-center text-[1.8rem] leading-none transition-transform duration-150 ease-out",
              menuOpen && "rotate-90",
            )}
          >
            {"\u25b8"}
          </span>
        </button>
      )}
    >
      <div role="menu" className="stack w-fit gap-1.5">
        {items.map((tab) => (
          <NavLink
            key={tab.id ?? tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              cn(
                "inline-flex w-full min-h-11 items-center rounded-sm border-2 px-3 py-2 font-ui text-sm font-bold uppercase tracking-[0.08em] no-underline transition duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kac-gold-dark/50",
                isActive
                  ? "border-kac-iron bg-gradient-to-b from-[#ff9f33] to-[#c75009] text-kac-bone-light shadow-[2px_2px_0_0_#121b23]"
                  : "border-kac-iron/60 bg-transparent text-kac-iron shadow-none hover:bg-kac-bone-light/40",
              )
            }
            onClick={() => setMenuOpen(false)}
          >
            <span className="min-w-0 flex-1 truncate text-left">{tab.label}</span>
          </NavLink>
        ))}
      </div>
    </Dropdown>
  );
};

export const AdventureModuleTabNav = ({
  moduleSlug,
  tabs,
  buildTabPath,
  color = "gold",
  leadingContent,
  trailingContent,
  showMobileMenu = true,
}: AdventureModuleTabNavProps): JSX.Element => {
  const items: TabItem[] = buildTabItems({
    moduleSlug,
    tabs,
    buildTabPath,
  });

  return (
    <div className="stack gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {leadingContent ? (
          <div className="order-1 shrink-0">{leadingContent}</div>
        ) : null}
        {showMobileMenu ? (
          <AdventureModuleSectionMenu
            moduleSlug={moduleSlug}
            tabs={tabs}
            buildTabPath={buildTabPath}
            className="order-2 lg:order-4 lg:hidden"
          />
        ) : null}
        <div className="order-4 hidden min-w-0 flex-1 lg:order-2 lg:flex">
          <Tabs
            items={items}
            ariaLabel="Adventure module sections"
            color={color}
            className="w-full"
          />
        </div>
        {trailingContent ? (
          <div className="order-3 shrink-0 ml-auto lg:ml-0 lg:order-3">
            {trailingContent}
          </div>
        ) : null}
      </div>
    </div>
  );
};
