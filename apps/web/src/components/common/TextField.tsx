import { InputHTMLAttributes } from "react";
import { cn } from "../../utils/cn";
import { Label } from "./Label";
import { InputDescriptionHint } from "./InputDescriptionHint";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  description?: string;
}

export const TextField = ({
  label,
  description,
  id,
  className = "",
  ...props
}: TextFieldProps): JSX.Element => {
  const fallbackId = label.toLowerCase().replace(/\s+/g, "-");
  const inputId = id ?? fallbackId;

  return (
    <label htmlFor={inputId} className="stack gap-1">
      <div className="inline-flex items-start gap-1 self-start">
        <Label>{label}</Label>
        {description ? <InputDescriptionHint description={description} /> : null}
      </div>
      <input
        id={inputId}
        className={cn(
          "border-[3px] border-b-[6px] border-kac-iron bg-gradient-to-b from-[#fffdf5] to-kac-bone-light px-3 py-2 text-kac-iron shadow-[2px_2px_0_0_#121b23] outline-none transition duration-100",
          "placeholder:text-kac-steel-dark/85",
          "focus-visible:border-kac-gold-darker focus-visible:ring-2 focus-visible:ring-kac-gold-dark/40",
          "disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-[1px_1px_0_0_#121b23]",
          "font-ui",
          className,
        )}
        {...props}
      />
    </label>
  );
};
