import { Link } from "react-router-dom";
import { Button } from "../components/common/Button";
import { Heading } from "../components/common/Heading";
import { Label } from "../components/common/Label";
import { Panel } from "../components/common/Panel";
import { Text } from "../components/common/Text";
import { StyleguideSectionNav } from "../components/styleguide/StyleguideSectionNav";

export const StyleguideSessionChatPage = (): JSX.Element => {
  return (
    <div className="styleguide-session-chat-page app-shell stack gap-6 py-8">
      <StyleguideSectionNav />

      <div className="stack gap-2">
        <Label color="fire" className="self-start">
          Session Chat Labs
        </Label>
        <Heading
          level="h1"
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
          Session Chat
        </Heading>
        <Text variant="body" color="iron-light" className="max-w-3xl text-sm">
          The full-screen chat mock stays in its own pair of pages, while this
          overview gives contributors one place to jump into the player or
          storyteller view.
        </Text>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel as="section" tone="cloth" contentClassName="stack gap-3">
          <div className="stack gap-1">
            <Text variant="h3" color="iron">
              Session Chat Player
            </Text>
            <Text variant="body" color="iron-light" className="text-sm">
              Player-facing version of the table and chat shell.
            </Text>
          </div>
          <Button href="/styleguide/session-chat-player" color="gold" size="sm">
            Open Player Lab
          </Button>
        </Panel>

        <Panel as="section" tone="gold" contentClassName="stack gap-3">
          <div className="stack gap-1">
            <Text variant="h3" color="iron">
              Session Chat Storyteller
            </Text>
            <Text variant="body" color="iron-light" className="text-sm">
              Storyteller-facing version with the same layout and broader
              visibility.
            </Text>
          </div>
          <Button href="/styleguide/session-chat-storyteller" color="gold" size="sm">
            Open Storyteller Lab
          </Button>
        </Panel>
      </div>

      <Panel as="section" tone="bone" contentClassName="stack gap-2">
        <Text variant="h3" color="iron">
          Why it is split out
        </Text>
        <Text variant="body" color="iron-light" className="text-sm">
          The session mock is heavy enough to deserve its own landing page, so
          the top-level styleguide no longer has to carry every lab at once.
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
