import { useState } from "react";
import { Link } from "react-router-dom";
import { ConnectionStatusPill } from "../components/common/ConnectionStatusPill";
import { Heading } from "../components/common/Heading";
import { Panel } from "../components/common/Panel";
import { Tag } from "../components/common/Tag";
import { Tags } from "../components/common/Tags";
import { Text } from "../components/common/Text";
import { StyleguideSectionNav } from "../components/styleguide/StyleguideSectionNav";

const tagPalette = [
  "gold",
  "fire",
  "blood",
  "bone",
  "steel",
  "skin",
  "cloth",
  "curse",
  "monster",
  "iron",
] as const;

const connectionStates = [
  { label: "Storyteller", status: "connected" as const, detail: "online" },
  { label: "Players", status: "reconnecting" as const, detail: "syncing" },
  { label: "Archive", status: "offline" as const, detail: "idle" },
] as const;

export const StyleguideTagsPage = (): JSX.Element => {
  const [selectedTags, setSelectedTags] = useState([
    "Drowned pumps",
    "Signal flares",
  ]);

  return (
    <div className="styleguide-tags-page app-shell stack gap-6 py-8">
      <StyleguideSectionNav />

      <div className="stack gap-2">
        <Heading
          level="h1"
          color="iron"
          className="relative z-0 text-[2.4rem] leading-none sm:text-[3.4rem] sm:leading-none"
          highlightProps={{
            color: "cloth",
            lineHeight: 8,
            brushHeight: 6,
            lineOffsets: [0, 8, 14, 20],
            className:
              "left-1/2 bottom-[0.08em] h-[0.5em] w-[calc(100%+0.22em)] -translate-x-1/2",
          }}
        >
          Tags
        </Heading>
        <Text variant="body" color="iron-light" className="max-w-3xl text-sm">
          This page keeps the shared chip primitives together so style and
          behavior stay aligned across editable tags and read-only status pills.
        </Text>
      </div>

      <Panel as="section" tone="bone" contentClassName="stack gap-4">
        <div className="stack gap-1">
          <Text variant="h3" color="iron">
            Tag Tone samples
          </Text>
          <Text variant="body" color="iron-light" className="text-sm">
            The same shell now powers simple labels, interactive tag rows, and
            status pills.
          </Text>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {tagPalette.map((tone) => (
            <Tag key={tone} tone={tone}>
              {tone}
            </Tag>
          ))}
          <Tag
            tone="gold"
            leading={<span aria-hidden="true">*</span>}
            trailing={
              <span className="inline-flex h-full items-center border-l border-kac-iron px-2 text-xs font-bold uppercase tracking-[0.06em] text-kac-iron">
                04
              </span>
            }
            contentClassName="min-w-[6rem]"
          >
            Tag Tone
          </Tag>
        </div>
      </Panel>

      <Panel
        as="section"
        tone="cloth"
        className="relative z-20"
        contentClassName="stack gap-4 pb-8"
      >
        <div className="stack gap-1">
          <Text variant="h3" color="iron">
            Editable Tags
          </Text>
          <Text variant="body" color="iron-light" className="text-sm">
            The editable field reuses the same `Tag` shell for the selected
            chips so the remove affordance feels like the same family.
          </Text>
        </div>

        <Tags
          label="Adventure Tags"
          description="These chips now share the same underlying shell as the read-only tag and connection surfaces."
          value={selectedTags}
          onChange={setSelectedTags}
          options={[
            "Drowned pumps",
            "Signal flares",
            "Flood gates",
            "Patrol routes",
            "Hidden exits",
          ]}
          tagVariant="cloth"
          removeTone="blood"
        />
      </Panel>

      <Panel as="section" tone="gold" contentClassName="stack gap-4">
        <div className="stack gap-1">
          <Text variant="h3" color="iron">
            Connection Status
          </Text>
          <Text variant="body" color="iron-light" className="text-sm">
            Status pills use the same chip base so live state reads as part of
            the same visual system.
          </Text>
        </div>

        <div className="flex flex-wrap gap-3">
          {connectionStates.map((state) => (
            <ConnectionStatusPill
              key={state.label}
              label={state.label}
              status={state.status}
              detail={state.detail}
            />
          ))}
        </div>
      </Panel>

      <Panel as="section" tone="bone" contentClassName="stack gap-2">
        <Text variant="h3" color="iron">
          Shared chip rules
        </Text>
        <Text variant="body" color="iron-light" className="text-sm">
          Use `Tag` for anything that looks like a pill, let `Tags` handle
          editable collections, and use `ConnectionStatusPill` when the chip
          needs a live dot.
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
