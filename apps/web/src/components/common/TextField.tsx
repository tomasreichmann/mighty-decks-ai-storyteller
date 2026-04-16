import { InputHTMLAttributes } from "react";
import { cn } from "../../utils/cn";
import { Label, type LabelColor } from "./Label";
import { InputDescriptionHint } from "./InputDescriptionHint";
import { componentSurfaceSizeClassMap, type ComponentSize } from "./componentSizing";

const sizeClassMap: Record<ComponentSize, string> = componentSurfaceSizeClassMap;

interface TextFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "className"> {
  label: string;
  description?: string;
  size?: ComponentSize;
  color?: LabelColor;
  className?: string;
}

export const TextField = ({
  label,
  description,
  id,
  size = "md",
  color = "gold",
  className = "",
  ...props
}: TextFieldProps): JSX.Element => {
  const fallbackId = label.toLowerCase().replace(/\s+/g, "-");
  const inputId = id ?? fallbackId;

  return (
    <label htmlFor={inputId} className="text-field stack gap-1">
      <div className="inline-flex items-start gap-1 self-start">
        <Label color={color} size={size}>
          {label}
        </Label>
        {description ? <InputDescriptionHint description={description} /> : null}
      </div>
      <input
        id={inputId}
        className={cn(
          "border-[3px] border-b-[6px] border-kac-iron bg-gradient-to-b from-[#fffdf5] to-kac-bone-light text-kac-iron shadow-[2px_2px_0_0_#121b23] outline-none transition duration-100",
          "placeholder:text-kac-steel-dark/85",
          "focus-visible:border-kac-gold-darker focus-visible:ring-2 focus-visible:ring-kac-gold-dark/40",
          "disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-[1px_1px_0_0_#121b23]",
          "font-ui",
          sizeClassMap[size],
          className,
        )}
        {...props}
      />
    </label>
  );
};
