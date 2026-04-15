import { useMemo, useState } from "react";
import { Dropdown } from "./Dropdown";
import { cn } from "../../utils/cn";

export interface CompactOptionPickerItem {
  value: string;
  label: string;
  secondaryLabel?: string;
}

interface CompactOptionPickerProps {
  ariaLabel: string;
  value: string;
  items: CompactOptionPickerItem[];
  emptyLabel: string;
  disabled?: boolean;
  className?: string;
  onChange: (nextValue: string) => void;
}

export const CompactOptionPicker = ({
  ariaLabel,
  value,
  items,
  emptyLabel,
  disabled = false,
  className = "",
  onChange,
}: CompactOptionPickerProps): JSX.Element => {
  const [open, setOpen] = useState(false);
  const selectedItem = useMemo(
    () => items.find((item) => item.value === value) ?? null,
    [items, value],
  );
  const selectedTitle = selectedItem?.label ?? emptyLabel;

  return (
    <Dropdown
      open={open}
      onOpenChange={setOpen}
      direction="bottom"
      align="start"
      className={className}
      menuClassName="w-[14rem]"
      renderTrigger={(triggerProps) => (
        <button
          type="button"
          aria-label={ariaLabel}
          disabled={disabled || items.length === 0}
          onClick={triggerProps.onClick}
          aria-haspopup={triggerProps["aria-haspopup"]}
          aria-expanded={triggerProps["aria-expanded"]}
          aria-controls={triggerProps["aria-controls"]}
          className={cn(
            "h-7 min-w-[11rem] max-w-[14rem] rounded-sm border-2 border-kac-iron bg-gradient-to-b from-[#f8efd8] to-[#e5d4b9] px-2 text-left text-xs text-kac-iron font-ui disabled:cursor-not-allowed disabled:opacity-60",
            triggerProps["aria-expanded"]
              ? "shadow-[inset_1px_1px_0_0_#9f8a6d,inset_-1px_-1px_0_0_#fff7e6]"
              : "",
          )}
        >
          <span className="block truncate">{selectedTitle}</span>
        </button>
      )}
    >
      {({ close }) => (
        <div
          role="menu"
          className="max-h-72 overflow-y-auto rounded-sm border-2 border-kac-iron-dark bg-gradient-to-b from-[#f8efd8] to-[#e5d4b9] p-1 shadow-[3px_3px_0_0_#121b23]"
        >
          {items.length > 0 ? (
            items.map((item) => {
              const selected = item.value === value;
              return (
                <button
                  key={item.value}
                  type="button"
                  role="menuitemradio"
                  aria-checked={selected}
                  className={cn(
                    "flex w-full flex-col items-start rounded-sm px-2 py-1.5 text-left transition-colors duration-100",
                    selected
                      ? "bg-kac-gold-light/55 text-kac-iron"
                      : "text-kac-iron hover:bg-kac-bone-light/80",
                  )}
                  onClick={() => {
                    onChange(item.value);
                    close();
                  }}
                >
                  <span className="block w-full truncate text-xs font-semibold">
                    {item.label}
                  </span>
                  {item.secondaryLabel ? (
                    <span className="block w-full truncate text-[10px] uppercase tracking-[0.06em] text-kac-steel-dark">
                      {item.secondaryLabel}
                    </span>
                  ) : null}
                </button>
              );
            })
          ) : (
            <div className="px-2 py-1.5 text-xs text-kac-steel-dark">
              {emptyLabel}
            </div>
          )}
        </div>
      )}
    </Dropdown>
  );
};
