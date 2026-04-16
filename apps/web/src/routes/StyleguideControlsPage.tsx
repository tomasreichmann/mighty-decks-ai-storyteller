import { useState } from "react";
import { Link } from "react-router-dom";
import { ButtonRadioGroup } from "../components/common/ButtonRadioGroup";
import { Heading } from "../components/common/Heading";
import { Label } from "../components/common/Label";
import { Panel } from "../components/common/Panel";
import { RockerSwitch } from "../components/common/RockerSwitch";
import { ToggleButton } from "../components/common/ToggleButton";
import { Text } from "../components/common/Text";
import { StyleguideSectionNav } from "../components/styleguide/StyleguideSectionNav";

const toggleColors = ["gold", "fire", "monster", "cloth", "bone", "curse"] as const;
const toggleSizes = ["s", "m", "l"] as const;

export const StyleguideControlsPage = (): JSX.Element => {
  const [activeColor, setActiveColor] =
    useState<(typeof toggleColors)[number]>("gold");
  const [rockerModeActive, setRockerModeActive] = useState(false);
  const [rockerPowerActive, setRockerPowerActive] = useState(true);
  const [rockerReadyActive, setRockerReadyActive] = useState(true);

  return (
    <div className="styleguide-controls-page app-shell stack gap-6 py-8">
      <StyleguideSectionNav />

      <div className="stack gap-2">
        <Label variant="gold" className="self-start">
          Grouped Controls
        </Label>
        <Heading
          variant="h1"
          color="iron"
          className="relative z-0 text-[2.4rem] leading-none sm:text-[3.4rem] sm:leading-none"
          highlightProps={{
            color: "gold",
            lineHeight: 8,
            brushHeight: 6,
            lineOffsets: [0, 8, 14, 20],
            className:
              "left-1/2 bottom-[0.08em] h-[0.5em] w-[calc(100%+0.22em)] -translate-x-1/2",
          }}
        >
          Controls
        </Heading>
        <Text variant="body" color="iron-light" className="max-w-3xl text-sm">
          Toggle and rocker controls stay on their own page so grouped
          interactions can be reviewed without the rest of the component labs.
        </Text>
      </div>

      <Panel as="section" tone="bone" contentClassName="stack gap-4">
        <div className="stack gap-3">
          <div className="stack gap-1">
            <Text variant="h3" color="iron">
              ToggleButton states
            </Text>
            <Text variant="body" color="iron-light" className="text-sm">
              Straight-edged grouped controls for option picking.
            </Text>
          </div>
          <div className="flex flex-wrap gap-3">
            <ToggleButton color="gold">Inactive</ToggleButton>
            <ToggleButton active color="gold">
              Active
            </ToggleButton>
            <ToggleButton color="cloth" disabled>
              Disabled
            </ToggleButton>
          </div>
        </div>

        <div className="stack gap-2">
          <Text variant="note" color="iron-light" className="text-xs uppercase">
            ButtonRadioGroup example
          </Text>
          <ButtonRadioGroup
            ariaLabel="Toggle button palette lab"
            color={activeColor}
            onValueChange={setActiveColor}
            options={toggleColors.map((color) => ({
              label: color,
              value: color,
            }))}
            size="m"
            value={activeColor}
          />
        </div>

        <div className="stack gap-2">
          <Text variant="note" color="iron-light" className="text-xs uppercase">
            Color variants
          </Text>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {toggleColors.map((color) => (
              <div
                key={color}
                className="flex flex-wrap items-center gap-3 rounded-sm border border-kac-iron/15 bg-kac-bone-light/35 p-3"
              >
                <ToggleButton color={color}>{color}</ToggleButton>
                <ToggleButton active color={color}>
                  {color} active
                </ToggleButton>
              </div>
            ))}
          </div>
        </div>

        <div className="stack gap-2">
          <Text variant="note" color="iron-light" className="text-xs uppercase">
            Size variants
          </Text>
          <div className="flex flex-wrap items-center gap-3">
            {toggleSizes.map((size) => (
              <ToggleButton key={size} active color="fire" size={size}>
                Size {size.toUpperCase()}
              </ToggleButton>
            ))}
          </div>
        </div>
      </Panel>

      <Panel as="section" tone="gold" contentClassName="stack gap-4">
        <div className="stack gap-1">
          <Text variant="h3" color="iron">
            RockerSwitch
          </Text>
          <Text variant="body" color="iron-light" className="text-sm">
            Use the rocker when a binary choice should feel a little more
            mechanical than a flat toggle.
          </Text>
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <RockerSwitch
            active={rockerModeActive}
            color="cloth"
            label="Mode"
            inactiveText="Off"
            activeText="On"
            onClick={() => setRockerModeActive((current) => !current)}
          />
          <RockerSwitch
            active={rockerPowerActive}
            color="fire"
            label="Power"
            inactiveText="Idle"
            activeText="Live"
            onClick={() => setRockerPowerActive((current) => !current)}
          />
          <RockerSwitch
            active={rockerReadyActive}
            color="monster"
            size="l"
            label="Ready"
            inactiveText="Safe"
            activeText="Armed"
            onClick={() => setRockerReadyActive((current) => !current)}
          />
        </div>
      </Panel>

      <Panel as="section" tone="bone" contentClassName="stack gap-2">
        <Text variant="h3" color="iron">
          Back to the overview
        </Text>
        <Text variant="body" color="iron-light" className="text-sm">
          This page now holds the grouped control work so it can stay focused
          without sharing the screen with card labs or tag chip examples.
        </Text>
        <Link
          to="/styleguide"
          className="inline-flex items-center gap-2 self-start font-ui text-sm font-bold uppercase tracking-[0.08em] text-kac-iron transition hover:text-kac-blood-dark"
        >
          <span aria-hidden="true">&larr;</span>
          Back to Overview
        </Link>
      </Panel>
    </div>
  );
};
