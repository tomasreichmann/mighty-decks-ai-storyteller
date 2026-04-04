import { useState } from "react";
import { Link } from "react-router-dom";
import { ButtonRadioGroup } from "../components/common/ButtonRadioGroup";
import { CTAButton } from "../components/common/CTAButton";
import { ConnectionStatusPill } from "../components/common/ConnectionStatusPill";
import { Heading } from "../components/common/Heading";
import { RockerSwitch } from "../components/common/RockerSwitch";
import { ToggleButton } from "../components/common/ToggleButton";
import { Panel } from "../components/common/Panel";
import { Text } from "../components/common/Text";

const toggleColors = ["gold", "fire", "monster", "cloth", "bone", "curse"] as const;
const toggleSizes = ["s", "m", "l"] as const;

export const StyleguideIndexPage = (): JSX.Element => {
  const [activeColor, setActiveColor] =
    useState<(typeof toggleColors)[number]>("gold");
  const [rockerModeActive, setRockerModeActive] = useState(false);
  const [rockerPowerActive, setRockerPowerActive] = useState(true);
  const [rockerReadyActive, setRockerReadyActive] = useState(true);

  return (
    <div className="app-shell stack gap-6 py-8">
      <div className="stack gap-2">
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
          Styleguide
        </Heading>
        <Text
          variant="body"
          color="iron-light"
          className="relative z-10 mt-3 max-w-3xl text-sm"
        >
          Hidden component playground for iterating on visual directions without
          touching the main player or storyteller flows.
        </Text>
      </div>

      <Panel as="section" tone="bone" contentClassName="stack gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="stack gap-1">
            <Text variant="h3" color="iron">
              Location Card
            </Text>
            <Text variant="body" color="iron-light" className="text-sm">
              Current local LocationCard direction for the location-focused
              GameCard.
            </Text>
          </div>
          <Link
            to="/styleguide/location-card"
            className="inline-flex items-center rounded-sm border-2 border-kac-iron bg-gradient-to-b from-kac-gold to-kac-gold-dark px-4 py-2 font-ui text-sm font-bold uppercase tracking-[0.08em] text-kac-iron shadow-[3px_3px_0_0_#121b23] transition duration-100 hover:brightness-[1.03] active:translate-y-[2px] active:shadow-[1px_1px_0_0_#121b23]"
          >
            Open Gallery
          </Link>
        </div>
      </Panel>

      <Panel as="section" tone="bone" contentClassName="stack gap-3">
        <div className="stack gap-3">
          <div className="stack gap-1">
            <Text variant="h3" color="iron">
              Shared CTA and Status Pills
            </Text>
            <Text variant="body" color="iron-light" className="text-sm">
              Shared action and connection treatments used across the landing
              page, Adventure header, and campaign session surfaces.
            </Text>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <CTAButton size="md">Join as Player</CTAButton>
            <ConnectionStatusPill label="Player" status="connected" />
            <ConnectionStatusPill
              label="Storyteller"
              status="disconnected"
            />
          </div>
        </div>
      </Panel>

      <Panel as="section" tone="cloth" contentClassName="stack gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="stack gap-1">
            <Text variant="h3" color="iron">
              Session Chat Player
            </Text>
            <Text variant="body" color="iron-light" className="max-w-3xl text-sm">
              Full-screen player-side session chat mock with the new Table
              surface at desktop width and the collapsed Chat-first mobile state
              under a `Table` / `Chat` ButtonRadioGroup.
            </Text>
          </div>
          <Link
            to="/styleguide/session-chat-player"
            className="inline-flex items-center rounded-sm border-2 border-kac-iron bg-gradient-to-b from-kac-gold to-kac-gold-dark px-4 py-2 font-ui text-sm font-bold uppercase tracking-[0.08em] text-kac-iron shadow-[3px_3px_0_0_#121b23] transition duration-100 hover:brightness-[1.03] active:translate-y-[2px] active:shadow-[1px_1px_0_0_#121b23]"
          >
            Open Lab
          </Link>
        </div>
      </Panel>

      <Panel as="section" tone="gold" contentClassName="stack gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="stack gap-1">
            <Text variant="h3" color="iron">
              Session Chat Storyteller
            </Text>
            <Text variant="body" color="iron-light" className="max-w-3xl text-sm">
              Full-screen storyteller session chat mock with the same responsive
              Table / Chat shell and table-wide discard affordances for every
              player lane plus the Shared section.
            </Text>
          </div>
          <Link
            to="/styleguide/session-chat-storyteller"
            className="inline-flex items-center rounded-sm border-2 border-kac-iron bg-gradient-to-b from-kac-gold to-kac-gold-dark px-4 py-2 font-ui text-sm font-bold uppercase tracking-[0.08em] text-kac-iron shadow-[3px_3px_0_0_#121b23] transition duration-100 hover:brightness-[1.03] active:translate-y-[2px] active:shadow-[1px_1px_0_0_#121b23]"
          >
            Open Lab
          </Link>
        </div>
      </Panel>

      <Panel as="section" tone="bone" contentClassName="stack gap-4">
        <div className="stack gap-1">
          <Text variant="h3" color="iron">
            Toggle and Radio Buttons
          </Text>
          <Text variant="body" color="iron-light" className="max-w-3xl text-sm">
            Straight-edged grouped controls for option picking. They keep the
            tactile comic palette, but avoid the tilted primary button
            silhouette so active rows stay orderly when buttons sit together.
          </Text>
        </div>

        <div className="stack gap-2">
          <Text variant="note" color="iron-light" className="text-xs uppercase">
            ToggleButton states
          </Text>
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

        <div className="stack gap-2">
          <Text variant="note" color="iron-light" className="text-xs uppercase">
            RockerSwitch
          </Text>
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
        </div>
      </Panel>

      <Panel as="section" tone="bone" contentClassName="stack gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="stack gap-1">
            <Text variant="h3" color="iron">
              Encounter Card
            </Text>
            <Text variant="body" color="iron-light" className="text-sm">
              Shared scene-card direction adapted for encounter embeds and
              authoring previews.
            </Text>
          </div>
          <Link
            to="/styleguide/encounter-card"
            className="inline-flex items-center rounded-sm border-2 border-kac-iron bg-gradient-to-b from-kac-gold to-kac-gold-dark px-4 py-2 font-ui text-sm font-bold uppercase tracking-[0.08em] text-kac-iron shadow-[3px_3px_0_0_#121b23] transition duration-100 hover:brightness-[1.03] active:translate-y-[2px] active:shadow-[1px_1px_0_0_#121b23]"
          >
            Open Gallery
          </Link>
        </div>
      </Panel>

      <Panel as="section" tone="bone" contentClassName="stack gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="stack gap-1">
            <Text variant="h3" color="iron">
              Quest Card
            </Text>
            <Text variant="body" color="iron-light" className="text-sm">
              Shared scene-card direction adapted for quest embeds and authoring
              previews.
            </Text>
          </div>
          <Link
            to="/styleguide/quest-card"
            className="inline-flex items-center rounded-sm border-2 border-kac-iron bg-gradient-to-b from-kac-gold to-kac-gold-dark px-4 py-2 font-ui text-sm font-bold uppercase tracking-[0.08em] text-kac-iron shadow-[3px_3px_0_0_#121b23] transition duration-100 hover:brightness-[1.03] active:translate-y-[2px] active:shadow-[1px_1px_0_0_#121b23]"
          >
            Open Gallery
          </Link>
        </div>
      </Panel>
    </div>
  );
};
