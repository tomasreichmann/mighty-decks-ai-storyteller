import { cn } from "../../utils/cn";
import { Label, type LabelVariant } from "./Label";
import { Text } from "./Text";

export interface ToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  labelVariant?: LabelVariant;
  description?: string;
  id?: string;
  name?: string;
  disabled?: boolean;
  className?: string;
}

export const Toggle = ({
  checked,
  onCheckedChange,
  label,
  labelVariant = "cloth",
  description,
  id,
  name,
  disabled = false,
  className = "",
}: ToggleProps): JSX.Element => {
  const handleToggle = (): void => {
    if (disabled) {
      return;
    }

    onCheckedChange(!checked);
  };

  return (
    <div className={cn("stack gap-1", className)}>
      {label ? (
        <Label
          variant={labelVariant}
          className="self-start -mb-1.5 [z-index:2] relative"
        >
          {label}
        </Label>
      ) : null}
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-disabled={disabled || undefined}
        disabled={disabled}
        onClick={handleToggle}
        className={cn("appearance-none")}
      >
        <span className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className={cn(
              "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border-2 border-kac-iron",
              "shadow-[inset_1px_1px_0_0_#fffaf0,inset_-1px_-1px_0_0_#9f8a6d]",
              checked
                ? "bg-gradient-to-b from-kac-cloth-light to-kac-cloth"
                : "bg-gradient-to-b from-kac-steel-light to-kac-steel",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 h-5 w-5 rounded-full border-2 border-kac-iron",
                "bg-gradient-to-b from-[#fffdf5] to-kac-bone-light",
                "shadow-[1px_1px_0_0_#121b23] transition-all duration-150",
                checked ? "left-6" : "left-0.5",
              )}
            />
          </span>
          <span
            className={cn(
              "font-ui text-xs font-bold uppercase tracking-[0.08em]",
              checked ? "text-kac-cloth-dark" : "text-kac-steel-dark",
            )}
          >
            {checked ? "On" : "Off"}
          </span>
        </span>
      </button>
      {description ? (
        <Text
          variant="note"
          color="steel-dark"
          className="normal-case tracking-normal"
        >
          {description}
        </Text>
      ) : null}
      {name ? (
        <input type="hidden" name={name} value={checked ? "true" : "false"} />
      ) : null}
    </div>
  );
};
