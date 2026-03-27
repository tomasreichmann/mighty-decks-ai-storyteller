import React from "react";
import type { ReactNode } from "react";
import { SceneCardFrame } from "./SceneCardFrame";

void React;

interface EncounterCardProps {
  imageUrl: string;
  imageAlt?: string;
  title: ReactNode;
  description: ReactNode;
  className?: string;
}

export const EncounterCard = ({
  imageUrl,
  imageAlt = "",
  title,
  description,
  className = "",
}: EncounterCardProps): JSX.Element => {
  return (
    <SceneCardFrame
      imageUrl={imageUrl}
      imageAlt={imageAlt}
      title={title}
      typeLabel="Encounter"
      typeVariant="fire"
      description={description}
      className={className}
    />
  );
};
