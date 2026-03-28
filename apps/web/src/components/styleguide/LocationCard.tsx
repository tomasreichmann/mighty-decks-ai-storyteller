import React from "react";
import type { ReactNode } from "react";
import { SceneCardFrame } from "./SceneCardFrame";

void React;

interface LocationCardProps {
  imageUrl: string;
  imageAlt?: string;
  title: ReactNode;
  description: ReactNode;
  className?: string;
}

export const LocationCard = ({
  imageUrl,
  imageAlt = "",
  title,
  description,
  className = "",
}: LocationCardProps): JSX.Element => {
  return (
    <SceneCardFrame
      imageUrl={imageUrl}
      imageAlt={imageAlt}
      title={title}
      titleVariant="cloth"
      typeIcon="📌"
      description={description}
      className={className}
    />
  );
};
