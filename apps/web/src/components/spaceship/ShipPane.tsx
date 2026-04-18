import type { ShipPaneModel, ShipLocationInstance } from "../../lib/spaceship/spaceshipTypes";
import { Label } from "../common/Label";
import { Text } from "../common/Text";
import { ShipLocationCard } from "./ShipLocationCard";
import { SpaceshipActorStrip } from "./SpaceshipActorStrip";

interface ShipPaneProps {
  pane: ShipPaneModel;
}

const sortLocations = (
  locations: ShipLocationInstance[],
  row: ShipLocationInstance["row"],
): ShipLocationInstance[] =>
  locations
    .filter((location) => location.row === row)
    .sort((left, right) => left.lastTouchedOrder - right.lastTouchedOrder);

export const ShipPane = ({ pane }: ShipPaneProps): JSX.Element => {
  const topRow = sortLocations(pane.locations, "top");
  const bottomRow = sortLocations(pane.locations, "bottom");

  return (
    <section
      data-ship-pane
      className="ship-pane relative overflow-hidden rounded-[1.5rem] border-[3px] border-kac-iron bg-[linear-gradient(180deg,rgba(18,27,35,0.96)_0%,rgba(35,48,61,0.98)_100%)] p-4 shadow-[6px_6px_0_0_#121b23]"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,245,192,0.14),transparent_42%),radial-gradient(circle_at_bottom,rgba(128,160,188,0.14),transparent_35%),repeating-linear-gradient(90deg,rgba(255,255,255,0.03)_0px,rgba(255,255,255,0.03)_1px,transparent_1px,transparent_44px),repeating-linear-gradient(0deg,rgba(255,255,255,0.03)_0px,rgba(255,255,255,0.03)_1px,transparent_1px,transparent_44px)]" />
      <div className="relative z-10 stack gap-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="stack gap-2">
            <Label color={pane.emphasis === "player" ? "gold" : "blood"} size="lg">
              {pane.faction}
            </Label>
            <Text variant="h3" color="steel-light" className="text-[1.8rem]">
              {pane.title}
            </Text>
            <Text variant="body" color="steel-light" className="max-w-xl text-sm">
              {pane.subtitle}
            </Text>
          </div>
          <div className="rounded-[1rem] border-2 border-kac-steel bg-kac-steel-light/90 px-3 py-2 shadow-[3px_3px_0_0_#121b23]">
            <Text variant="note" color="iron-light" className="text-[0.68rem] !opacity-100">
              Z bands
            </Text>
            <Text variant="emphasised" color="iron" className="text-sm">
              Cards under Tokens
            </Text>
          </div>
        </div>

        <div className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            {topRow.map((location) => (
              <ShipLocationCard key={location.locationId} location={location} />
            ))}
          </div>

          <div className="relative h-4 overflow-hidden rounded-full border-2 border-kac-iron bg-kac-bone-light/60 shadow-[3px_3px_0_0_#121b23]">
            <div className="absolute inset-y-0 left-[4%] right-[4%] rounded-full bg-[repeating-linear-gradient(90deg,rgba(18,27,35,0.12)_0px,rgba(18,27,35,0.12)_10px,transparent_10px,transparent_20px)]" />
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            {bottomRow.map((location) => (
              <ShipLocationCard key={location.locationId} location={location} />
            ))}
          </div>
        </div>

        <div className="rounded-[1.25rem] border-[3px] border-kac-iron bg-[linear-gradient(180deg,rgba(255,253,245,0.95)_0%,rgba(236,184,123,0.88)_100%)] p-4 shadow-[5px_5px_0_0_#121b23]">
          <div className="mb-3 flex items-center justify-between gap-3">
            <Text variant="emphasised" color="iron" className="text-lg">
              Crew Strip
            </Text>
            <Text variant="note" color="iron-light" className="text-xs !opacity-100">
              Actor cards stay grounded while tokens show room position.
            </Text>
          </div>
          <SpaceshipActorStrip actors={pane.actors} />
        </div>
      </div>
    </section>
  );
};
