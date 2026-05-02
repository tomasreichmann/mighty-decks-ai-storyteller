import { getActorTextIconUri } from "../../data/actorCards";
import { cn } from "../../utils/cn";

interface ActorCardTextWithIconsProps {
  text: string;
  iconClassName?: string;
}

export const tokenPattern = /(\[[^\]]+\])/g;
export const iconTokenPattern = /^\[([a-zA-Z_]+)(\d*)\]$/;
export const actorBodyLineHeightClassName = "leading-[16px]";
export const actorBodyRowClassName = `flex min-h-4 items-center ${actorBodyLineHeightClassName}`;

export const ActorCardTextWithIcons = ({
  text,
  iconClassName,
}: ActorCardTextWithIconsProps): JSX.Element => {
  const fragments = text
    .split(tokenPattern)
    .filter((fragment) => fragment !== "");

  return (
    <>
      {fragments.map((fragment, fragmentIndex) => {
        const iconNameMatch = fragment.match(iconTokenPattern);
        if (!iconNameMatch) {
          return <span key={fragmentIndex}>{fragment}</span>;
        }

        const [, iconName, iconCountString = "1"] = iconNameMatch;
        const iconCount = Number.parseInt(iconCountString || "1", 10);
        if (!Number.isFinite(iconCount) || iconCount < 1) {
          return <span key={fragmentIndex}>{fragment}</span>;
        }

        return (
          <span
            key={fragmentIndex}
            className={cn("inline-flex items-center", actorBodyLineHeightClassName)}
          >
            {Array.from({ length: iconCount }).map((_, iconIndex) => (
              <img
                key={`${iconName}-${iconIndex}`}
                src={getActorTextIconUri(iconName)}
                alt=""
                aria-hidden="true"
                className={cn(
                  "inline-block h-4 w-4 object-contain align-middle",
                  iconClassName,
                  iconIndex > 0 ? "-ml-1" : "",
                )}
              />
            ))}
          </span>
        );
      })}
    </>
  );
};

export const getIconTextLength = (text: string): number => {
  const fragments = text
    .split(tokenPattern)
    .filter((fragment) => fragment !== "");
  return fragments.reduce((length, fragment) => {
    const iconNameMatch = fragment.match(iconTokenPattern);
    if (!iconNameMatch) {
      return length + fragment.length * 0.25;
    }
    const [, , iconCountString = "1"] = iconNameMatch;
    const iconCount = Number.parseInt(iconCountString || "1", 10);
    return Number.isFinite(iconCount) && iconCount > 0
      ? length + iconCount
      : length;
  }, 0);
};
