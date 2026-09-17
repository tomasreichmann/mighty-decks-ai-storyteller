import type { ReactNode } from "react";
import { Text } from "./Text";
import { cn } from "../../utils/cn";

export interface StoryTileCardProps {
  title: string;
  imageUrl: string;
  imageAlt: string;
  href?: string;
  topMeta?: ReactNode;
  kindBadge?: ReactNode;
  summary?: ReactNode;
  supportingContent?: ReactNode;
  actions?: ReactNode;
  imageLoading?: "lazy" | "eager";
  imageDecoding?: "async" | "auto" | "sync";
  className?: string;
}

export const StoryTileCard = ({
  title,
  imageUrl,
  imageAlt,
  href,
  topMeta,
  kindBadge,
  summary,
  supportingContent,
  actions,
  imageLoading = "lazy",
  imageDecoding = "async",
  className = "",
}: StoryTileCardProps): JSX.Element => {
  const cardBody = (
    <article className="flex h-full flex-col overflow-hidden rounded-sm border-2 border-kac-iron bg-kac-bone-light shadow-[3px_3px_0_0_#121b23] transition duration-200 ease-out group-hover:-translate-y-0.5 group-hover:shadow-[4px_4px_0_0_#121b23] group-focus-within:-translate-y-0.5 group-focus-within:shadow-[4px_4px_0_0_#121b23]">
      <div className="overflow-hidden border-b-2 border-kac-iron bg-kac-iron-dark">
        <img
          src={imageUrl}
          alt={imageAlt}
          loading={imageLoading}
          decoding={imageDecoding}
          className="aspect-video h-auto w-full object-cover object-center transition-transform duration-300 ease-out group-hover:scale-[1.01]"
        />
      </div>

      <div className="flex flex-1 flex-col gap-3 bg-kac-bone-light px-4 py-4">
        {(topMeta || kindBadge) ? (
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex flex-wrap gap-2">{topMeta}</div>
            {kindBadge}
          </div>
        ) : null}

        <Text
          variant="h3"
          color="iron"
          data-story-tile-title
          className="text-[1.6rem] leading-none sm:text-[1.8rem]"
        >
          {title}
        </Text>

        {summary ? (
          <Text
            variant="body"
            color="iron-light"
            className={cn(
              "text-sm leading-relaxed text-kac-iron-light",
              "overflow-hidden [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3]",
            )}
          >
            {summary}
          </Text>
        ) : null}

        {supportingContent ? (
          <div className="stack gap-2">{supportingContent}</div>
        ) : null}

        {actions ? (
          <div className="mt-auto flex flex-col items-end gap-2 pt-1 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
            {actions}
          </div>
        ) : null}
      </div>
    </article>
  );

  return (
    <div className={cn("group h-full w-full max-w-[30rem]", className)}>
      {href ? (
        <a
          href={href}
          className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kac-gold-dark/50"
        >
          {cardBody}
        </a>
      ) : (
        cardBody
      )}
    </div>
  );
};
