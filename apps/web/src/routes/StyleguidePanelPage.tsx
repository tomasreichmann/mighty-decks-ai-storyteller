import { Link } from "react-router-dom";
import { Heading } from "../components/common/Heading";
import { Label } from "../components/common/Label";
import { Message } from "../components/common/Message";
import { Panel } from "../components/common/Panel";
import { Text } from "../components/common/Text";
import { StyleguideSectionNav } from "../components/styleguide/StyleguideSectionNav";

export const StyleguidePanelPage = (): JSX.Element => {
  return (
    <div className="styleguide-panel-page app-shell stack gap-6 py-8">
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
          Panel
        </Heading>
        <Text variant="body" color="iron-light" className="max-w-3xl text-sm">
          Panels are quiet paper cards for meaningful grouped content. Keep ordinary
          content open, and reserve semantic color callouts for Message.
        </Text>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="stack gap-2 px-1 py-2">
          <Text variant="h3" color="iron">
            Open Section (no Panel)
          </Text>
          <Text variant="body" color="iron-light" className="max-w-sm text-sm">
            Use spacing, type hierarchy, and a clear heading for primary content that
            does not need a boundary.
          </Text>
        </section>

        <Panel as="section" contentClassName="stack gap-2">
          <Text variant="h3" color="iron">
            Paper Panel
          </Text>
          <Text variant="body" color="iron-light" className="text-sm">
            A flexible container for related content: one border, one small shadow,
            and a restrained edge accent.
          </Text>
        </Panel>

        <Panel as="section" tone="cloth" contentClassName="stack gap-3">
          <Label color="cloth" rotate={false} className="self-start">
            Quiet note
          </Label>
          <Text variant="h3" color="iron">
            Panel + Label
          </Text>
          <Text variant="body" color="iron-light" className="text-sm">
            Add a label when a grouped surface needs a compact editorial cue, without
            making the surface itself a semantic alert.
          </Text>
        </Panel>

        <Message as="section" color="monster" label="Success" rotateLabel={false}>
          <Text variant="h3" color="iron">
            Semantic Message
          </Text>
          <Text variant="body" color="iron-light" className="mt-1 text-sm">
            Messages own full semantic color when content needs to communicate status,
            guidance, warning, or an outcome.
          </Text>
        </Message>
      </div>

      <Link
        to="/styleguide"
        className="inline-flex items-center gap-2 self-start font-ui text-sm font-bold uppercase tracking-[0.08em] text-kac-iron transition hover:text-kac-blood-dark"
      >
        <span aria-hidden="true">&larr;</span>
        Back to Overview
      </Link>
    </div>
  );
};
