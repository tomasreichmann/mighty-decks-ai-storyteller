import React from "react";
import type { ReactNode } from "react";
import { SceneCardFrame } from "./SceneCardFrame";

void React;

interface QuestCardProps {
  imageUrl: string;
  imageAlt?: string;
  title: ReactNode;
  description: ReactNode;
  className?: string;
}

export const QuestCard = ({
  imageUrl,
  imageAlt = "",
  title,
  description,
  className = "",
}: QuestCardProps): JSX.Element => {
  return (
    <SceneCardFrame
      imageUrl={imageUrl}
      imageAlt={imageAlt}
      title={title}
      titleVariant="gold"
      typeIcon={"\u{1F4DC}"}
      description={description}
      className={className}
    />
  );
};
