import {
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ForwardedRef,
  forwardRef,
} from "react";
import { cn } from "../../utils/cn";
import {
  resolveHeadingHighlightColorClass,
  type HighlightColor,
} from "./headingHighlightColor";

type HighlightActionBaseProps = {
  /** Keeps the marker stroke visible, for example on the current navigation item. */
  active?: boolean;
  /** Selects the marker color while the readable label remains Iron. */
  color?: HighlightColor;
  disabled?: boolean;
};

export type HighlightActionAnchorProps = HighlightActionBaseProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "color" | "href"> & {
    href: string;
  };

export type HighlightActionButtonProps = HighlightActionBaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "color" | "href"> & {
    href?: never;
  };

export type HighlightActionProps =
  | HighlightActionAnchorProps
  | HighlightActionButtonProps;

const isHighlightActionAnchor = (
  props: HighlightActionProps,
): props is HighlightActionAnchorProps => props.href !== undefined;

/**
 * A native text link or button with a semantic marker highlight. Use it for
 * lightweight navigation and secondary actions rather than framed controls.
 * Labels are intentionally kept to one line for navigation and text actions.
 */
export const HighlightAction = forwardRef<
  HTMLAnchorElement | HTMLButtonElement,
  HighlightActionProps
>(
  (rawProps, ref) => {
    const {
      active = false,
      color = "gold",
      className,
      disabled = false,
      children,
    } = rawProps;
    const classes = cn("highlight-action", active && "highlight-action--active", className);
    const content = (
      <span className={cn("highlight-action__marker", resolveHeadingHighlightColorClass(color))}>
        <span className="highlight-action__label">{children}</span>
      </span>
    );

    if (isHighlightActionAnchor(rawProps)) {
      const {
        active: _active,
        color: _color,
        className: _className,
        disabled: _disabled,
        href,
        target,
        rel,
        download,
        referrerPolicy,
        children: _children,
        onClick,
        tabIndex: _tabIndex,
        ...anchorProps
      } = rawProps;

      return (
        <a
          ref={ref as ForwardedRef<HTMLAnchorElement>}
          href={disabled ? undefined : href}
          target={target}
          rel={rel}
          download={download}
          referrerPolicy={referrerPolicy}
          aria-current={active ? rawProps["aria-current"] ?? "page" : rawProps["aria-current"]}
          aria-disabled={disabled || undefined}
          tabIndex={disabled ? -1 : rawProps.tabIndex}
          className={classes}
          onClick={(event) => {
            if (disabled) {
              event.preventDefault();
              return;
            }
            onClick?.(event);
          }}
          {...anchorProps}
        >
          {content}
        </a>
      );
    }

    const {
      active: _active,
      color: _color,
      className: _className,
      disabled: _disabled,
      children: _children,
      type = "button",
      ...buttonProps
    } = rawProps;

    return (
      <button
        ref={ref as ForwardedRef<HTMLButtonElement>}
        type={type}
        disabled={disabled}
        className={classes}
        {...buttonProps}
      >
        {content}
      </button>
    );
  },
);

HighlightAction.displayName = "HighlightAction";
