import type { CampaignListItem } from "@mighty-decks/spec/campaign";
import { Button } from "../common/Button";
import { Panel } from "../common/Panel";
import { Tag } from "../common/Tag";
import { Text } from "../common/Text";
import { resolveServerUrl } from "../../lib/socket";
import { cn } from "../../utils/cn";

const FALLBACK_IMAGE_URL = "/sample-scene-image.png";

const formatDate = (value: string): string => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatLiveStatus = (activeSessionCount: number): string =>
  activeSessionCount > 0 ? `LIVE ${activeSessionCount}` : "IDLE";

const formatSessionCount = (sessionCount: number): string =>
  sessionCount === 1 ? "1 SESSION" : `${sessionCount} SESSIONS`;

const resolveCardImageUrl = (imageUrl: string): string => {
  if (
    imageUrl.startsWith("http://") ||
    imageUrl.startsWith("https://") ||
    imageUrl.startsWith("data:")
  ) {
    return imageUrl;
  }

  if (imageUrl.startsWith("/api/")) {
    return new URL(imageUrl, resolveServerUrl()).toString();
  }

  return imageUrl;
};

interface CampaignListCardProps {
  campaign: CampaignListItem;
}

export const CampaignListCard = ({
  campaign,
}: CampaignListCardProps): JSX.Element => {
  const imageUrl = resolveCardImageUrl(campaign.coverImageUrl ?? FALLBACK_IMAGE_URL);
  const liveTone = campaign.activeSessionCount > 0 ? "monster" : "cloth";

  return (
    <Panel
      tone="bone"
      className={cn(
        "group h-full w-full max-w-[30rem] transition-transform duration-200 ease-out hover:-translate-y-1",
      )}
      contentClassName="h-full p-0"
    >
      <article className="flex h-full flex-col">
        <div className="relative overflow-hidden border-b-2 border-kac-iron bg-kac-iron-dark">
          <img
            src={imageUrl}
            alt={`${campaign.title} campaign cover`}
            loading="lazy"
            decoding="async"
            className="aspect-video h-auto w-full object-cover object-center transition-transform duration-300 ease-out group-hover:scale-[1.02]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-kac-iron-dark/85 via-kac-iron-dark/20 to-transparent" />

          <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
            <div className="flex max-w-[calc(100%-5.5rem)] flex-wrap gap-2">
              <Tag tone={liveTone} size="sm">
                {formatLiveStatus(campaign.activeSessionCount)}
              </Tag>
              <Tag tone="cloth" size="sm">
                {formatSessionCount(campaign.sessionCount)}
              </Tag>
              <Tag tone="steel" size="sm">
                Updated {formatDate(campaign.updatedAtIso)}
              </Tag>
            </div>

            <Tag tone="bone" size="sm">
              Campaign
            </Tag>
          </div>

          <div className="absolute inset-x-3 bottom-3">
            <Text
              variant="h3"
              color="paper"
              className="max-w-[16rem] text-[1.8rem] leading-none drop-shadow-[0_2px_0_#090f15] sm:max-w-[20rem] sm:text-[2rem]"
            >
              {campaign.title}
            </Text>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3 px-4 py-4">
          <Text
            variant="body"
            color="iron-light"
            className={cn(
              "text-sm leading-relaxed",
              "overflow-hidden [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]",
            )}
          >
            {campaign.summary}
          </Text>

          <div className="mt-auto flex flex-col items-end gap-2 pt-1 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
            <Button
              href={`/campaign/${encodeURIComponent(campaign.slug)}/sessions`}
              color="cloth"
              size="sm"
            >
              View Sessions
            </Button>
            <Button
              href={`/campaign/${encodeURIComponent(campaign.slug)}/base`}
              color="gold"
              size="sm"
            >
              Open Campaign
            </Button>
          </div>
        </div>
      </article>
    </Panel>
  );
};
