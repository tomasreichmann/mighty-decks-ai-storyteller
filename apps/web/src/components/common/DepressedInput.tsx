import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "../../utils/cn";
import { Label } from "./Label";

interface BaseDepressedInputProps {
  label: string;
  id?: string;
  className?: string;
  controlClassName?: string;
}

type DepressedSingleLineInputProps = BaseDepressedInputProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "id"> & {
    multiline?: false;
  };

type DepressedMultiLineInputProps = BaseDepressedInputProps &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className" | "id"> & {
    multiline: true;
  };

export type DepressedInputProps =
  | DepressedSingleLineInputProps
  | DepressedMultiLineInputProps;

const inputBaseClassName =
  "inputFocusHighlight relative w-full border-2 border-kac-iron rounded-sm bg-gradient-to-b from-[#f8efd8] to-[#e5d4b9] px-3 py-2 text-kac-iron outline-none transition duration-100 font-ui";

const inputDepthClassName =
  "shadow-[inset_2px_2px_0_0_#9f8a6d,inset_-2px_-2px_0_0_#fff7e6]";

const inputStateClassName =
  "placeholder:text-kac-steel-dark disabled:cursor-not-allowed disabled:opacity-60";

export const DepressedInput = (props: DepressedInputProps): JSX.Element => {
  const { label, id, className = "", controlClassName = "" } = props;

  const fallbackId = label.toLowerCase().replace(/\s+/g, "-");
  const inputId = id ?? fallbackId;

  const labelClassName = cn(
    "flex flex-col gap-1 text-sm text-kac-iron-light",
    className,
  );
  const controlClasses = cn(
    inputBaseClassName,
    inputDepthClassName,
    inputStateClassName,
    controlClassName,
  );

  const labelElement = (
    <Label className="-mb-2 -ml-1 relative self-start [z-index:2]">
      {label}
    </Label>
  );

  if (props.multiline) {
    const {
      multiline,
      label: _ignoredLabel,
      id: _ignoredId,
      className: _ignoredClassName,
      controlClassName: _ignoredControlClassName,
      ...textAreaProps
    } = props;

    return (
      <label htmlFor={inputId} className={labelClassName}>
        {labelElement}
        <div className="focusHighlightWrapper">
          <textarea
            id={inputId}
            className={cn(controlClasses, "resize-y")}
            {...textAreaProps}
          />
          <div className="focusHighlight"></div>
        </div>
      </label>
    );
  }

  const {
    label: _ignoredLabel,
    id: _ignoredId,
    className: _ignoredClassName,
    controlClassName: _ignoredControlClassName,
    ...inputProps
  } = props;

  return (
    <label htmlFor={inputId} className={labelClassName}>
      {labelElement}
      <div className="focusHighlightWrapper">
        <input id={inputId} className={controlClasses} {...inputProps} />
        <div className="focusHighlight"></div>
      </div>
    </label>
  );
};
