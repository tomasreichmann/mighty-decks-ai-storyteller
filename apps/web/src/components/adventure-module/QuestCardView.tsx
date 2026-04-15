import React from "react";
import type { AdventureModuleResolvedQuest } from "@mighty-decks/spec/adventureModuleAuthoring";
import { QuestCard } from "../styleguide/QuestCard";
import { toMarkdownPlainTextSnippet } from "../../lib/markdownSnippet";
import { resolveServerUrl } from "../../lib/socket";
import { cn } from "../../utils/cn";
import { AUTHORED_SCENE_CARD_CLASS } from "./sceneCardSizing";

void React;

interface QuestCardViewProps {
  quest: AdventureModuleResolvedQuest;
  className?: string;
}

interface InvalidQuestCardViewProps {
  slug?: string;
  className?: string;
}

const toPlainText = (value: string | undefined, maxLength: number): string =>
  value ? toMarkdownPlainTextSnippet(value, maxLength).trim() : "";

const toImageSrc = (imageUrl: string): string => {
  if (
    imageUrl.startsWith("http://") ||
    imageUrl.startsWith("https://") ||
    imageUrl.startsWith("data:")
  ) {
    return imageUrl;
  }

  return new URL(imageUrl, resolveServerUrl()).toString();
};

const getQuestImage = (quest: AdventureModuleResolvedQuest): string =>
  quest.titleImageUrl?.trim() ? toImageSrc(quest.titleImageUrl) : "/sample-scene-image.png";

const getQuestDescription = (quest: AdventureModuleResolvedQuest): string =>
  toPlainText(quest.summary, 140) || toPlainText(quest.content, 140);

export const QuestCardView = ({
  quest,
  className,
}: QuestCardViewProps): JSX.Element => {
  return (
    <QuestCard
      imageUrl={getQuestImage(quest)}
      imageAlt={quest.title}
      title={quest.title}
      description={getQuestDescription(quest)}
      className={cn(AUTHORED_SCENE_CARD_CLASS, className)}
    />
  );
};

export const InvalidQuestCardView = ({
  slug,
  className,
}: InvalidQuestCardViewProps): JSX.Element => {
  const summary =
    typeof slug === "string" && slug.trim().length > 0
      ? `Quest / ${slug}`
      : "Missing or unknown quest props";

  return (
    <span
      className={cn(
        "inline-flex max-w-[20rem] flex-col rounded border-2 border-dashed border-kac-gold-dark/70 bg-kac-bone-light/70 px-3 py-2 text-left font-ui text-xs text-kac-iron shadow-[2px_2px_0_0_#121b23]",
        className,
      )}
    >
      <span className="font-bold uppercase tracking-[0.08em] text-kac-gold-dark">
        Invalid QuestCard
      </span>
      <span>{summary}</span>
    </span>
  );
};
