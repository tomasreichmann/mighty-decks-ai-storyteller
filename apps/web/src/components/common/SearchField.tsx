import type { ChangeEventHandler } from "react";
import { cn } from "../../utils/cn";
import { DepressedInput } from "./DepressedInput";

interface SearchFieldProps {
  label: string;
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  placeholder: string;
  id?: string;
  className?: string;
}

export const SearchField = ({
  label,
  value,
  onChange,
  placeholder,
  id,
  className = "",
}: SearchFieldProps): JSX.Element => {
  return (
    <DepressedInput
      label={label}
      id={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={cn("w-full max-w-lg", className)}
    />
  );
};
