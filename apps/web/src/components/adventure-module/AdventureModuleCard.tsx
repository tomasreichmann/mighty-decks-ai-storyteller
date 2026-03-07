import { ImageCard } from "../common/ImageCard";
import { Label } from "../common/Label";
import { Panel } from "../common/Panel";
import { Text } from "../common/Text";
import { resolveServerUrl } from "../../lib/socket";

interface AdventureModuleCardProps {
  moduleId: string;
  name: string;
  imageUrl: string;
  author: string;
  createdAtIso: string;
  tags?: string[];
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

export const AdventureModuleCard = ({
  moduleId,
  name,
  imageUrl,
  author,
  createdAtIso,
  tags = [],
}: AdventureModuleCardProps): JSX.Element => {
  return (
    <Panel className="w-full max-w-[336px]" contentClassName="stack gap-3 items-center">
      <ImageCard
        imageUrl={resolveCardImageUrl(imageUrl)}
        imageAlt={`${name} module cover`}
        label={name}
      />

      <div className="w-full stack gap-1">
        <Text variant="body" color="iron" className="text-sm">
          <span className="font-bold">Author:</span> {author}
        </Text>
        <Text variant="body" color="iron-light" className="text-xs">
          <span className="font-bold">Created:</span> {formatDate(createdAtIso)}
        </Text>
        <Text variant="note" color="steel-dark" className="text-[11px] break-all">
          ID: {moduleId}
        </Text>
      </div>

      {tags.length > 0 ? (
        <div className="flex w-full flex-wrap gap-2">
          {tags.map((tag) => (
            <Label key={tag} variant="cloth" rotate={false} className="text-[10px]">
              {tag}
            </Label>
          ))}
        </div>
      ) : null}
    </Panel>
  );
};
