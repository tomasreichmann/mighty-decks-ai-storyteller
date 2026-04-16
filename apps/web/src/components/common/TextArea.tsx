import { TextareaHTMLAttributes } from "react";
import { cn } from "../../utils/cn";
import { InputDescriptionHint } from "./InputDescriptionHint";
import { Label, type LabelColor } from "./Label";
import { componentSurfaceSizeClassMap, type ComponentSize } from "./componentSizing";

const sizeClassMap: Record<ComponentSize, string> = componentSurfaceSizeClassMap;

interface TextAreaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className"> {
  label: string;
  description?: string;
  size?: ComponentSize;
  color?: LabelColor;
  className?: string;
}

export const TextArea = ({
  label,
  description,
  id,
  size = "md",
  color = "gold",
  className = "",
  ...props
}: TextAreaProps): JSX.Element => {
  const fallbackId = label.toLowerCase().replace(/\s+/g, "-");
  const inputId = id ?? fallbackId;

  return (
    <label htmlFor={inputId} className="text-area grid gap-1">
      <span className="inline-flex items-start gap-1 self-start">
        <Label color={color} size={size}>
          {label}
        </Label>
        {description ? <InputDescriptionHint description={description} /> : null}
      </span>
      <textarea
        id={inputId}
        className={cn(
          "border-[3px] border-b-[6px] border-kac-iron bg-gradient-to-b from-[#fffdf5] to-kac-bone-light text-kac-iron shadow-[2px_2px_0_0_#121b23] outline-none transition duration-100",
          "placeholder:text-kac-steel-dark/85",
          "focus-visible:border-kac-gold-darker focus-visible:ring-2 focus-visible:ring-kac-gold-dark/40",
          "disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-[1px_1px_0_0_#121b23]",
          "resize-y font-ui",
          sizeClassMap[size],
          className,
        )}
        {...props}
      />
    </label>
  );
};
