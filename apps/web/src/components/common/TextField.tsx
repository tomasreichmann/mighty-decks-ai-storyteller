import { InputHTMLAttributes } from "react";
import { cn } from "../../utils/cn";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const TextField = ({ label, id, className = "", ...props }: TextFieldProps): JSX.Element => {
  const fallbackId = label.toLowerCase().replace(/\s+/g, "-");
  const inputId = id ?? fallbackId;

  return (
    <label htmlFor={inputId} className="grid gap-1 text-sm text-slate-700">
      <span className="font-medium">{label}</span>
      <input
        id={inputId}
        className={cn(
          "rounded-md border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-accent",
          className,
        )}
        {...props}
      />
    </label>
  );
};
