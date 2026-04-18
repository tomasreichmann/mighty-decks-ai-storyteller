import { Link } from "react-router-dom";
import { Heading } from "../components/common/Heading";
import { Message } from "../components/common/Message";
import { Panel } from "../components/common/Panel";
import { Text } from "../components/common/Text";
import { StyleguideSectionNav } from "../components/styleguide/StyleguideSectionNav";

const highlightSamples = [
  {
    color: "gold" as const,
    label: "Fresh update",
    content:
      "The storyteller just added a new lead. Highlighted messages should feel alive, so use them sparingly for the most recent or most important note.",
  },
  {
    color: "fire" as const,
    label: "Immediate risk",
    content:
      "The patrol is on the staircase now. The pulse treatment works best when the callout must steal focus right away.",
  },
] as const;

export const StyleguideMessagesPage = (): JSX.Element => {
  return (
    <div className="styleguide-messages-page app-shell stack gap-6 py-8">
      <StyleguideSectionNav />

      <div className="stack gap-2">
        <Heading
          level="h1"
          color="iron"
          className="relative z-0 text-[2.4rem] leading-none sm:text-[3.4rem] sm:leading-none"
          highlightProps={{
            color: "fire",
            lineHeight: 8,
            brushHeight: 6,
            lineOffsets: [0, 8, 14, 20],
            className:
              "left-1/2 bottom-[0.08em] h-[0.5em] w-[calc(100%+0.22em)] -translate-x-1/2",
          }}
        >
          Messages
        </Heading>
        <Text variant="body" color="iron-light" className="max-w-3xl text-sm">
          This page keeps the shared `Message` shell together so the tone
          gradients, label placement, and highlighted pulse treatment can be
          checked without digging through a feature surface.
        </Text>
      </div>

      <Panel as="section" tone="bone" contentClassName="stack gap-4">
        <div className="stack gap-1">
          <Text variant="h3" color="iron">
            Semantic callout shells
          </Text>
          <Text variant="body" color="iron-light" className="text-sm">
            These samples show the tone families that `Message` uses for alerts,
            status lines, and soft story guidance.
          </Text>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <div className="xl:col-span-2">
            <Message color="bone" label="Quiet note">
              The tunnel is safe for now. Use this tone when the callout should
              stay readable without shouting over the page.
            </Message>
          </div>
          <Message color="cloth" label="Story beat" rotateLabel={false}>
            The next clue is in the archive hall. This is the tone for gentle
            guidance and narrative support.
          </Message>
          <Message color="gold" label="Table signal">
            The group has a clean path forward. Use this when the message
            should feel positive, clear, and immediately actionable.
          </Message>
          <Message color="fire" label="Warning">
            The gate will lock in one minute. Reserve this tone for urgent
            interruptions or highly visible hazard notes.
          </Message>
          <Message color="monster" label="Success">
            The lock gives way and the route opens cleanly. It should feel
            reassuring, not celebratory noise.
          </Message>
        </div>
      </Panel>

      <Panel as="section" tone="cloth" contentClassName="stack gap-4">
        <div className="stack gap-1">
          <Text variant="h3" color="iron">
            Highlighted callouts
          </Text>
          <Text variant="body" color="iron-light" className="text-sm">
            Highlighted messages pulse, so reserve them for the freshest or
            most urgent note on the page.
          </Text>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {highlightSamples.map((sample, index) => (
            <Message
              key={sample.label}
              color={sample.color}
              label={sample.label}
              highlighted
              rotateLabel={false}
              labelVariant={index === 0 ? "gold" : "fire"}
            >
              {sample.content}
            </Message>
          ))}
        </div>
      </Panel>

      <Panel as="section" tone="gold" contentClassName="stack gap-2">
        <Text variant="h3" color="iron">
          Where to use it
        </Text>
        <Text variant="body" color="iron-light" className="text-sm">
          Use `Message` for alerts, status notes, and story callouts that need
          to feel like part of the narrative surface. Keep the highlight pulse
          rare, and flatten the embedded label when a calmer alignment reads
          better against the surrounding copy.
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
