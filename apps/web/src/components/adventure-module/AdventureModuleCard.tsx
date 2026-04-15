import type { AdventureModuleListItem } from "@mighty-decks/spec/adventureModuleAuthoring";
import { StoryTileCard } from "../common/StoryTileCard";
import { Tag } from "../common/Tag";
import { Text } from "../common/Text";
import { resolveServerUrl } from "../../lib/socket";

interface AdventureModuleCardProps {
  module: AdventureModuleListItem;
}

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

const resolveStatusTone = (
  status: AdventureModuleListItem["status"],
): "cloth" | "monster" | "steel" => {
  switch (status) {
    case "published":
      return "monster";
    case "archived":
      return "steel";
    case "draft":
    default:
      return "cloth";
  }
};

const formatStatusLabel = (
  status: AdventureModuleListItem["status"],
): string => {
  switch (status) {
    case "published":
      return "Published";
    case "archived":
      return "Archived";
    case "draft":
    default:
      return "Draft";
  }
};

export const AdventureModuleCard = ({
  module,
}: AdventureModuleCardProps): JSX.Element => {
  return (
    <StoryTileCard
      title={module.title}
      imageUrl={resolveCardImageUrl(module.coverImageUrl ?? "/sample-scene-image.png")}
      imageAlt={`${module.title} module cover`}
      href={`/adventure-module/${encodeURIComponent(module.slug)}/player-info`}
      imageLoading="lazy"
      imageDecoding="async"
      topMeta={
        <>
          {module.ownedByRequester ? (
            <Tag tone="gold" size="sm">
              Mine
            </Tag>
          ) : null}
          <Tag tone={resolveStatusTone(module.status)} size="sm">
            {formatStatusLabel(module.status)}
          </Tag>
          <Tag tone="steel" size="sm">
            Created {formatDate(module.createdAtIso)}
          </Tag>
        </>
      }
      kindBadge={
        <Tag tone="bone" size="sm">
          Module
        </Tag>
      }
      summary={module.summary}
      supportingContent={
        <>
          <Text variant="note" color="steel-dark" className="text-xs">
            By {module.authorLabel}
          </Text>
          {module.tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {module.tags.map((tag) => (
                <Tag key={tag} tone="cloth" size="sm">
                  {tag}
                </Tag>
              ))}
            </div>
          ) : null}
        </>
      }
    />
  );
};
