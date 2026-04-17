import type { ChangeEventHandler } from "react";
import { cn } from "../../utils/cn";
import { TextField } from "./TextField";

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
    <div className={cn("w-full max-w-lg", className)}>
      <TextField
        label={label}
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    </div>
  );
};
