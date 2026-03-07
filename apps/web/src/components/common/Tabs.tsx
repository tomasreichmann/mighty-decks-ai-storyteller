import { NavLink } from "react-router-dom";
import { cn } from "../../utils/cn";
import styles from "./Tabs.module.css";

export interface TabItem {
  id?: string;
  to: string;
  label: string;
  end?: boolean;
}

interface TabsProps {
  items: TabItem[];
  ariaLabel: string;
  className?: string;
}

export const Tabs = ({
  items,
  ariaLabel,
  className,
}: TabsProps): JSX.Element => {
  return (
    <nav className={cn(styles.tabRail, className)} aria-label={ariaLabel}>
      {items.map((tab) => (
        <NavLink
          key={tab.id ?? tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) =>
            cn(styles.tabLink, isActive && styles.activeTab)
          }
        >
          <span className={styles.tabLabel}>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};
