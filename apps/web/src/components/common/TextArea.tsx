import { TextareaHTMLAttributes } from "react";
import { cn } from "../../utils/cn";
import { Text } from "./Text";

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
}

export const TextArea = ({ label, id, className = "", ...props }: TextAreaProps): JSX.Element => {
  const fallbackId = label.toLowerCase().replace(/\s+/g, "-");
  const inputId = id ?? fallbackId;

  return (
    <label htmlFor={inputId} className="grid gap-1">
      <Text
        as="span"
        variant="note"
        color="iron"
        className="text-base tracking-[0.04em]"
      >
        {label}
      </Text>
      <textarea
        id={inputId}
        className={cn(
          "border-[3px] border-b-[6px] border-kac-iron bg-gradient-to-b from-[#fffdf5] to-kac-bone-light px-3 py-2 text-kac-iron shadow-[2px_2px_0_0_#121b23] outline-none transition duration-100",
          "placeholder:text-kac-steel-dark/85",
          "focus-visible:border-kac-gold-darker focus-visible:ring-2 focus-visible:ring-kac-gold-dark/40",
          "disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-[1px_1px_0_0_#121b23]",
          "resize-y font-ui",
          className,
        )}
        {...props}
      />
    </label>
  );
};
