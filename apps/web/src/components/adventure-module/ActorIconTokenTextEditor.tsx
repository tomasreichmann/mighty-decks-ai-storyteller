import { useId, useRef } from "react";
import {
  actorTextIconSlugs,
  getActorTextIconUri,
  type ActorTextIconSlug,
} from "../../data/actorCards";
import { cn } from "../../utils/cn";
import { ActorCardTextWithIcons } from "../cards/ActorCardTextWithIcons";
import { Button } from "../common/Button";
import {
  FieldShell,
  fieldControlBaseClassName,
  fieldControlDepthClassName,
  fieldControlStateClassName,
} from "../common/FieldShell";

interface ActorIconTokenTextEditorProps {
  label: string;
  value: string;
  onChange: (nextValue: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  rows?: number;
  maxLength?: number;
  description?: string;
}

const editorClassName =
  "min-h-24 resize-y px-3 py-2 text-[11px] leading-[16px]";

export const ActorIconTokenTextEditor = ({
  label,
  value,
  onChange,
  onBlur,
  disabled = false,
  rows = 4,
  maxLength,
  description,
}: ActorIconTokenTextEditorProps): JSX.Element => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const generatedId = useId();
  const inputId = `${label.toLowerCase().replace(/\s+/g, "-")}-${generatedId.replace(/:/g, "")}`;

  const insertToken = (slug: ActorTextIconSlug): void => {
    if (disabled) {
      return;
    }
    const token = `[${slug}]`;
    const textarea = textareaRef.current;
    const selectionStart = textarea?.selectionStart ?? value.length;
    const selectionEnd = textarea?.selectionEnd ?? value.length;
    const nextValue =
      value.slice(0, selectionStart) + token + value.slice(selectionEnd);
    if (typeof maxLength === "number" && nextValue.length > maxLength) {
      return;
    }
    onChange(nextValue);
    window.requestAnimationFrame(() => {
      const nextCursor = selectionStart + token.length;
      textarea?.focus();
      textarea?.setSelectionRange(nextCursor, nextCursor);
    });
  };

  return (
    <div className="stack gap-2">
      <FieldShell
        label={label}
        description={description}
        id={inputId}
        showCharCount={typeof maxLength === "number"}
        value={value}
        maxLength={maxLength}
      >
        <textarea
          id={inputId}
          ref={textareaRef}
          className={cn(
            fieldControlBaseClassName,
            fieldControlDepthClassName,
            fieldControlStateClassName,
            editorClassName,
          )}
          value={value}
          rows={rows}
          maxLength={maxLength}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          spellCheck
        />
      </FieldShell>

      <details className="group border-2 border-kac-steel-dark/55 bg-kac-steel-light/20 px-2 py-1.5 shadow-[1px_1px_0_0_#121b23]">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 font-ui text-[11px] font-bold uppercase tracking-[0.08em] text-kac-iron marker:hidden [&::-webkit-details-marker]:hidden">
          <span>Insert Icons</span>
          <span
            aria-hidden="true"
            className="h-0 w-0 border-y-[4px] border-l-[6px] border-y-transparent border-l-kac-iron transition-transform group-open:rotate-90"
          />
        </summary>
        <div
          className="mt-2 flex flex-wrap gap-1.5"
          aria-label={`${label} icons`}
        >
          {actorTextIconSlugs.map((slug) => (
            <Button
              key={slug}
              type="button"
              variant="ghost"
              color="steel"
              size="sm"
              className={cn(
                "min-h-7 gap-1.5 px-2 py-1 text-[10px] normal-case tracking-[0.02em]",
                disabled ? "shadow-none" : "",
              )}
              disabled={disabled}
              title={`Insert [${slug}]`}
              aria-label={`Insert ${slug} icon`}
              onClick={() => insertToken(slug)}
            >
              <img
                src={getActorTextIconUri(slug)}
                alt=""
                aria-hidden="true"
                className="h-4 w-4 object-contain"
              />
              <span>{slug}</span>
            </Button>
          ))}
        </div>
      </details>

      {value.trim().length > 0 ? (
        <div className="whitespace-pre-wrap border-2 border-kac-iron/20 bg-kac-bone-light/50 px-3 py-2 font-ui text-[11px] leading-[16px] text-kac-iron-light">
          <ActorCardTextWithIcons text={value} multiline iconClassName="mx-[-1px]" />
        </div>
      ) : null}
    </div>
  );
};
