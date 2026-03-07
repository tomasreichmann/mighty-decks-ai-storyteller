import type { ReactNode } from "react";
import { cn } from "../../utils/cn";
import { Button } from "./Button";
import {
  Dropdown,
  type DropdownAlign,
  type DropdownDirection,
  type DropdownRenderContext,
  type DropdownTriggerRenderProps,
} from "./Dropdown";

export type ContextMenuRowAction = {
  kind: "action";
  id: string;
  label: ReactNode;
  onSelect: () => void | Promise<void>;
  disabled?: boolean;
  closeOnSelect?: boolean;
  className?: string;
};

export type ContextMenuRowCustom = {
  kind: "custom";
  id: string;
  render: (ctx: DropdownRenderContext) => ReactNode;
  className?: string;
};

export type ContextMenuRow = ContextMenuRowAction | ContextMenuRowCustom;

export interface ContextMenuProps {
  rows: ContextMenuRow[];
  direction?: DropdownDirection;
  align?: DropdownAlign;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  menuClassName?: string;
  renderTrigger?: (props: DropdownTriggerRenderProps) => ReactNode;
}

const renderDefaultTrigger = (
  triggerProps: DropdownTriggerRenderProps,
): JSX.Element => {
  return (
    <Button
      size="sm"
      variant="circle"
      color="cloth"
      className="h-8 w-8 p-0"
      aria-label="Open menu"
      onClick={triggerProps.onClick}
      aria-haspopup={triggerProps["aria-haspopup"]}
      aria-expanded={triggerProps["aria-expanded"]}
      aria-controls={triggerProps["aria-controls"]}
    >
      <span aria-hidden="true" className="flex flex-col items-center justify-center gap-[2px]">
        <span className="h-1 w-1 rounded-full bg-kac-iron" />
        <span className="h-1 w-1 rounded-full bg-kac-iron" />
        <span className="h-1 w-1 rounded-full bg-kac-iron" />
      </span>
    </Button>
  );
};

export const ContextMenu = ({
  rows,
  direction = "bottom",
  align = "start",
  open,
  defaultOpen = false,
  onOpenChange,
  className = "",
  menuClassName = "",
  renderTrigger,
}: ContextMenuProps): JSX.Element => {
  return (
    <Dropdown
      direction={direction}
      align={align}
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      className={className}
      menuClassName={cn(
        "min-w-[160px] rounded-sm border-2 border-kac-iron-dark",
        "bg-[linear-gradient(179deg,var(--tw-gradient-stops))] from-[#f8efd8] to-kac-bone-light",
        "p-2 shadow-[2px_2px_0_0_#121b23]",
        menuClassName,
      )}
      renderTrigger={renderTrigger ?? renderDefaultTrigger}
    >
      {(ctx) => (
        <div role="menu" className="stack gap-1">
          {rows.map((row) => {
            if (row.kind === "custom") {
              return (
                <div key={row.id} className={cn("min-w-0", row.className)}>
                  {row.render(ctx)}
                </div>
              );
            }

            const shouldClose = row.closeOnSelect ?? true;

            return (
              <Button
                key={row.id}
                variant="ghost"
                color="cloth"
                size="sm"
                role="menuitem"
                disabled={row.disabled}
                className={cn("w-full justify-start", row.className)}
                onClick={() => {
                  if (shouldClose) {
                    ctx.close();
                  }
                  void row.onSelect();
                }}
              >
                {row.label}
              </Button>
            );
          })}
        </div>
      )}
    </Dropdown>
  );
};
