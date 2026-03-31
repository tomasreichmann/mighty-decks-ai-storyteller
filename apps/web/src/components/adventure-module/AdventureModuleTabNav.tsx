import { type ReactNode, useEffect, useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "../../utils/cn";
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
  leadingContent?: ReactNode;
  trailingContent?: ReactNode;
}

export const AdventureModuleTabNav = ({
  moduleSlug,
  tabs,
  buildTabPath,
  color = "gold",
  leadingContent,
  trailingContent,
}: AdventureModuleTabNavProps): JSX.Element => {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const encodedModuleSlug = encodeURIComponent(moduleSlug);
  const menuId = `adventure-module-sections-${encodedModuleSlug}`;

  const items: TabItem[] = tabs.map((tab) => ({
    id: tab.id,
    label: tab.label,
    to: buildTabPath
      ? buildTabPath(moduleSlug, tab.id)
      : `/adventure-module/${encodedModuleSlug}/${tab.id}`,
  }));

  const activeItem = useMemo(
    () =>
      items.find(
        (item) =>
          location.pathname === item.to ||
          location.pathname.startsWith(`${item.to}/`),
      ) ?? items[0],
    [items, location.pathname],
  );

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="stack gap-2">
      <div className="flex items-center gap-2">
        {leadingContent ? <div className="shrink-0">{leadingContent}</div> : null}
        <div className="hidden min-w-0 flex-1 xl:flex">
          <Tabs
            items={items}
            ariaLabel="Adventure module sections"
            color={color}
            className="w-full"
          />
        </div>
        <div className="min-w-0 flex-1 xl:hidden">
          <button
            type="button"
            className="flex min-h-11 w-full items-center justify-between rounded-sm border-2 border-kac-iron bg-kac-bone-light/90 px-3 py-2 font-ui text-sm font-bold uppercase tracking-[0.08em] text-kac-iron shadow-[3px_3px_0_0_#121b23] transition duration-100 hover:brightness-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kac-gold-dark/50"
            aria-expanded={menuOpen}
            aria-controls={menuId}
            aria-label={menuOpen ? "Close section menu" : "Open section menu"}
            onClick={() => setMenuOpen((current) => !current)}
          >
            <span className="truncate">{activeItem?.label ?? "Menu"}</span>
            <span
              aria-hidden="true"
              className="flex h-7 w-7 shrink-0 flex-col items-center justify-center gap-1"
            >
              <span className="block h-0.5 w-4 rounded-full bg-kac-iron" />
              <span className="block h-0.5 w-4 rounded-full bg-kac-iron" />
              <span className="block h-0.5 w-4 rounded-full bg-kac-iron" />
            </span>
          </button>
        </div>
        {trailingContent ? <div className="shrink-0">{trailingContent}</div> : null}
      </div>
      <nav
        id={menuId}
        aria-label="Adventure module sections"
        className={cn(
          "stack gap-2 xl:hidden",
          menuOpen ? "block" : "hidden",
        )}
      >
        {items.map((tab) => (
          <NavLink
            key={tab.id ?? tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              cn(
                "inline-flex min-h-11 items-center rounded-sm border-2 px-3 py-2 font-ui text-sm font-bold uppercase tracking-[0.08em] no-underline transition duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kac-gold-dark/50",
                isActive
                  ? "border-kac-iron bg-kac-gold text-kac-iron shadow-[2px_2px_0_0_#121b23]"
                  : "border-kac-iron/70 bg-kac-bone-light/85 text-kac-iron shadow-[2px_2px_0_0_#121b23] hover:bg-kac-bone-light",
              )
            }
            onClick={() => setMenuOpen(false)}
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};
