import { useRef } from "react";
import {
  actorTextIconSlugs,
  getActorTextIconUri,
  type ActorTextIconSlug,
} from "../../data/actorCards";
import { cn } from "../../utils/cn";
import { ActorCardTextWithIcons } from "../cards/ActorCardTextWithIcons";
import { Button } from "../common/Button";
import { Text } from "../common/Text";

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
  "min-h-24 resize-y border-[3px] border-b-[6px] border-kac-iron bg-gradient-to-b from-[#fffdf5] to-kac-bone-light px-3 py-2 font-ui text-[11px] leading-[16px] text-kac-iron shadow-[2px_2px_0_0_#121b23] outline-none transition duration-100 focus-visible:border-kac-gold-darker focus-visible:ring-2 focus-visible:ring-kac-gold-dark/40 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-[1px_1px_0_0_#121b23]";

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
      <label className="grid gap-1">
        <Text as="span" variant="note" color="iron" className="text-base tracking-[0.04em]">
          {label}
        </Text>
        {description ? (
          <Text variant="body" color="iron-light" className="text-sm">
            {description}
          </Text>
        ) : null}
        <textarea
          ref={textareaRef}
          className={editorClassName}
          value={value}
          rows={rows}
          maxLength={maxLength}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          spellCheck
        />
      </label>

      <details className="group border-2 border-kac-steel-dark/55 bg-kac-steel-light/20 px-2 py-1.5 shadow-[1px_1px_0_0_#121b23]">
        <summary className="cursor-pointer list-none font-ui text-[11px] font-bold uppercase tracking-[0.08em] text-kac-iron marker:hidden [&::-webkit-details-marker]:hidden">
          Insert Icons
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
          <ActorCardTextWithIcons text={value} iconClassName="mx-[-1px]" />
        </div>
      ) : null}
    </div>
  );
};
