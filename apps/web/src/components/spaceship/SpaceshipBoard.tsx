import type { ReactNode } from "react";
import type { SpaceshipScene } from "../../lib/spaceship/spaceshipTypes";
import { cn } from "../../utils/cn";
import { Label } from "../common/Label";
import { Text } from "../common/Text";
import { ShipPane } from "./ShipPane";

interface SpaceshipBoardProps {
  scene: SpaceshipScene;
  label: string;
  note: string;
  actionSlot?: ReactNode;
  className?: string;
}

export const SpaceshipBoard = ({
  scene,
  label,
  note,
  actionSlot,
  className,
}: SpaceshipBoardProps): JSX.Element => {
  return (
    <div className={cn("spaceship-board flex w-full flex-col gap-5", className)}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="stack gap-3">
          <Label size="lg" color="gold">
            {label}
          </Label>
          <div className="stack gap-2">
            <Text variant="h2" color="steel-light" className="text-[2.2rem]">
              {scene.title}
            </Text>
            <Text variant="body" color="steel-light" className="max-w-4xl text-sm">
              {scene.subtitle}
            </Text>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-[1rem] border-[3px] border-kac-iron bg-kac-bone-light px-3 py-2 shadow-[4px_4px_0_0_#121b23]">
            <Text variant="note" color="iron-light" className="text-xs !opacity-100">
              Prototype
            </Text>
            <Text variant="emphasised" color="iron" className="text-sm">
              {note}
            </Text>
          </div>
          {actionSlot}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {scene.panes.map((pane) => (
          <ShipPane key={pane.paneId} pane={pane} />
        ))}
      </div>
    </div>
  );
};
