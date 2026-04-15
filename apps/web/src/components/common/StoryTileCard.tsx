import type { ReactNode } from "react";
import { Panel } from "./Panel";
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
    <article className="flex h-full flex-col">
      <div className="relative overflow-hidden border-b-2 border-kac-iron bg-kac-iron-dark">
        <img
          src={imageUrl}
          alt={imageAlt}
          loading={imageLoading}
          decoding={imageDecoding}
          className="aspect-video h-auto w-full object-cover object-center transition-transform duration-300 ease-out group-hover:scale-[1.02]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-kac-iron-dark/85 via-kac-iron-dark/20 to-transparent" />

        {(topMeta || kindBadge) ? (
          <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
            <div className="flex max-w-[calc(100%-5.5rem)] flex-wrap gap-2">
              {topMeta}
            </div>
            {kindBadge}
          </div>
        ) : null}

        <div className="absolute inset-x-3 bottom-3">
          <Text
            variant="h3"
            color="paper"
            className="max-w-[16rem] text-[1.8rem] leading-none drop-shadow-[0_2px_0_#090f15] sm:max-w-[20rem] sm:text-[2rem]"
          >
            {title}
          </Text>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 px-4 py-4">
        {summary ? (
          <Text
            variant="body"
            color="iron-light"
            className={cn(
              "text-sm leading-relaxed",
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
    <Panel
      tone="bone"
      className={cn(
        "group h-full w-full max-w-[30rem] transition-transform duration-200 ease-out hover:-translate-y-1 focus-within:-translate-y-1",
        className,
      )}
      contentClassName="h-full p-0"
    >
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
    </Panel>
  );
};
