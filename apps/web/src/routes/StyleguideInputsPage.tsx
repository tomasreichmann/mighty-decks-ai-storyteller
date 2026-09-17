import { Link } from "react-router-dom";
import { Button } from "../components/common/Button";
import { Heading } from "../components/common/Heading";
import { Panel } from "../components/common/Panel";
import { Text } from "../components/common/Text";
import { TextArea } from "../components/common/TextArea";
import { TextField } from "../components/common/TextField";
import { StyleguideSectionNav } from "../components/styleguide/StyleguideSectionNav";

const formStackClassName = "stack max-w-2xl gap-2";
const actionRowClassName = "flex flex-wrap items-center gap-2";

export const StyleguideInputsPage = (): JSX.Element => {
  return (
    <div className="styleguide-inputs-page app-shell stack gap-6 py-8">
      <StyleguideSectionNav />

      <div className="stack gap-2">
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
          Inputs
        </Heading>
        <Text variant="body" color="iron-light" className="max-w-3xl text-sm">
          Keep the field and its actions distinct: input first, a small gap,
          then a compact action row. This protects readable forms at every
          control size.
        </Text>
      </div>

      <Panel as="section" tone="bone" contentClassName="stack gap-4">
        <div className="stack gap-1">
          <Text variant="h3" color="iron">
          Short-form input
          </Text>
          <Text variant="body" color="iron-light" className="text-sm">
            `TextField` is for titles, names, and short structured values.
          </Text>
        </div>

        <form className="grid gap-6" onSubmit={(event) => event.preventDefault()}>
          <div className={formStackClassName}>
            <TextField
              label="Title"
              size="md"
              color="gold"
              placeholder="A short, descriptive title..."
            />
            <div className={actionRowClassName}>
              <Button type="submit" size="md" color="gold">
                Save
              </Button>
              <Button type="button" variant="ghost" size="md" color="cloth">
                Preview
              </Button>
            </div>
          </div>

          <div className={formStackClassName}>
            <TextField
              id="adventure-slug"
              label="Adventure URL"
              size="md"
              color="cloth"
              defaultValue="the-hidden-valley"
              readOnly
              aria-describedby="adventure-slug-help"
            />
            <div id="adventure-slug-help">
              <Text variant="note" color="iron-light">
                Generated from the title. Read-only until you unlock the adventure.
              </Text>
            </div>
          </div>

          <div className={formStackClassName}>
            <TextField
              id="join-code"
              label="Join code"
              size="md"
              color="fire"
              aria-invalid="true"
              aria-describedby="join-code-error"
              placeholder="Enter the six-character code"
            />
            <div id="join-code-error" role="alert">
              <Text variant="note" color="blood">
                Enter all six characters to continue.
              </Text>
            </div>
          </div>
        </form>
      </Panel>

      <Panel as="section" tone="cloth" contentClassName="stack gap-4">
        <div className="stack gap-1">
          <Text variant="h3" color="iron">
          Long-form input
          </Text>
          <Text variant="body" color="iron-light" className="text-sm">
            `TextArea` is for descriptions, summaries, and prompts. Actions
            belong beneath the writing surface, not on its edge.
          </Text>
        </div>

        <form className="grid gap-6" onSubmit={(event) => event.preventDefault()}>
          <div className={formStackClassName}>
            <TextArea
              label="Description"
              size="md"
              color="cloth"
              rows={4}
              placeholder="Share the details of your adventure..."
            />
            <div className={actionRowClassName}>
              <Button type="button" variant="ghost" size="md" color="cloth">
                Preview
              </Button>
              <Button type="submit" size="md" color="monster">
                Submit
              </Button>
            </div>
          </div>

          <div className={formStackClassName}>
            <TextArea
              label="Session recap"
              size="md"
              color="bone"
              rows={3}
              defaultValue="The party crossed the frost bridge and found the old signal tower."
              readOnly
            />
            <Text variant="note" color="iron-light">
              Read-only fields preserve system-authored continuity notes.
            </Text>
          </div>
          <div className={formStackClassName}>
            <TextField
              label="Locked title"
              size="sm"
              color="steel"
              defaultValue="Awaiting the storyteller"
              disabled
            />
          </div>
        </form>
      </Panel>

      <Panel as="section" tone="bone" contentClassName="stack gap-2">
        <Text variant="h3" color="iron">
          Where to use it
        </Text>
        <Text variant="body" color="iron-light" className="text-sm">
          Use `TextField` for short single-line input, `TextArea` for compact
          multi-line copy, and place any actions in a separate row beneath the
          field.
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
