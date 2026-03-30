import { NavLink } from "react-router-dom";
import { cn } from "../../utils/cn";
import {
  buttonRadioGroupRailClassName,
  getButtonRadioGroupCapClassName,
  getButtonRadioGroupSegmentClassName,
} from "./ButtonRadioGroup";
import type { ToggleButtonColor } from "./ToggleButton";

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
  color?: ToggleButtonColor;
}

export const Tabs = ({
  items,
  ariaLabel,
  className,
  color = "gold",
}: TabsProps): JSX.Element => {
  return (
    <nav
      className={cn(buttonRadioGroupRailClassName, className)}
      aria-label={ariaLabel}
    >
      <span
        aria-hidden="true"
        className={getButtonRadioGroupCapClassName(color, "left")}
      />
      <div className="flex min-w-0 flex-wrap items-stretch pl-px pt-px">
        {items.map((tab) => (
          <NavLink
            key={tab.id ?? tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              cn(
                "inline-flex min-h-10 items-center justify-center font-ui text-sm font-bold uppercase tracking-[0.08em] no-underline transition duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kac-gold-dark/50",
                getButtonRadioGroupSegmentClassName({
                  active: isActive,
                  color,
                }),
              )
            }
          >
            <span className="whitespace-nowrap">{tab.label}</span>
          </NavLink>
        ))}
      </div>
      <span
        aria-hidden="true"
        className={getButtonRadioGroupCapClassName(color, "right")}
      />
    </nav>
  );
};
