import type { CampaignListItem } from "@mighty-decks/spec/campaign";
import { Button } from "../common/Button";
import { StoryTileCard } from "../common/StoryTileCard";
import { Tag } from "../common/Tag";
import { Text } from "../common/Text";
import { resolveServerUrl } from "../../lib/socket";

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
    <StoryTileCard
      title={campaign.title}
      imageUrl={imageUrl}
      imageAlt={`${campaign.title} campaign cover`}
      imageLoading="lazy"
      imageDecoding="async"
      topMeta={
        <>
          <Tag tone={liveTone} size="sm">
            {formatLiveStatus(campaign.activeSessionCount)}
          </Tag>
          <Tag tone="cloth" size="sm">
            {formatSessionCount(campaign.sessionCount)}
          </Tag>
          <Tag tone="steel" size="sm">
            Updated {formatDate(campaign.updatedAtIso)}
          </Tag>
        </>
      }
      kindBadge={
        <Tag tone="bone" size="sm">
          Campaign
        </Tag>
      }
      summary={campaign.summary}
      supportingContent={
        <>
          <Text variant="note" color="steel-dark" className="text-xs">
            Source Module: {campaign.sourceModuleTitle}
          </Text>
        </>
      }
      actions={
        <>
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
        </>
      }
    />
  );
};
