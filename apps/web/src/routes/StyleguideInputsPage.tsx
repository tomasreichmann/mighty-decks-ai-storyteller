import { Link } from "react-router-dom";
import { Button } from "../components/common/Button";
import { DepressedInput } from "../components/common/DepressedInput";
import { Heading } from "../components/common/Heading";
import { Label } from "../components/common/Label";
import { Panel } from "../components/common/Panel";
import { Text } from "../components/common/Text";
import { TextArea } from "../components/common/TextArea";
import { TextField } from "../components/common/TextField";
import { StyleguideSectionNav } from "../components/styleguide/StyleguideSectionNav";

export const StyleguideInputsPage = (): JSX.Element => {
  return (
    <div className="styleguide-inputs-page app-shell stack gap-6 py-8">
      <StyleguideSectionNav />

      <div className="stack gap-2">
        <Label color="gold" className="self-start">
          Inputs
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
          Inputs
        </Heading>
        <Text variant="body" color="iron-light" className="max-w-3xl text-sm">
          Validate the field APIs here. The rows below keep inputs and buttons
          beside each other so we can check that matching sizes stay aligned.
        </Text>
      </div>

      <Panel as="section" tone="bone" contentClassName="stack gap-4">
        <div className="stack gap-1">
          <Text variant="h3" color="iron">
            TextField and Button
          </Text>
          <Text variant="body" color="iron-light" className="text-sm">
            `TextField` is the simple one-line input for titles, names, and
            short structured values.
          </Text>
        </div>

        <div className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
            <TextField
              label="Short title"
              size="sm"
              color="gold"
              placeholder="A compact title"
              className="w-full max-w-md"
            />
            <div className="sm:pt-7">
              <Button size="sm" color="cloth">
                Save
              </Button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
            <TextField
              label="Display name"
              size="md"
              color="cloth"
              placeholder="A slightly longer label"
              className="w-full max-w-md"
            />
            <div className="sm:pt-7">
              <Button size="md" color="cloth">
                Preview
              </Button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
            <TextField
              label="Public prompt"
              size="lg"
              color="fire"
              placeholder="A more prominent input"
              className="w-full max-w-md"
            />
            <div className="sm:pt-7">
              <Button size="lg" color="fire">
                Submit
              </Button>
            </div>
          </div>
        </div>
      </Panel>

      <Panel as="section" tone="cloth" contentClassName="stack gap-4">
        <div className="stack gap-1">
          <Text variant="h3" color="iron">
            TextArea and Button
          </Text>
          <Text variant="body" color="iron-light" className="text-sm">
            `TextArea` is for slightly longer notes, summaries, and prompts that
            still need the same shared size and color controls.
          </Text>
        </div>

        <div className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
            <TextArea
              label="Short note"
              size="sm"
              color="gold"
              rows={1}
              placeholder="One line of copy"
              className="w-full max-w-md"
            />
            <div className="sm:pt-7">
              <Button size="sm" color="cloth">
                Insert
              </Button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
            <TextArea
              label="Summary"
              size="md"
              color="cloth"
              rows={1}
              placeholder="A quick summary"
              className="w-full max-w-md"
            />
            <div className="sm:pt-7">
              <Button size="md" color="cloth">
                Preview
              </Button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
            <TextArea
              label="Long prompt"
              size="lg"
              color="fire"
              rows={1}
              placeholder="A more expressive block of copy"
              className="w-full max-w-md"
            />
            <div className="sm:pt-7">
              <Button size="lg" color="fire">
                Send
              </Button>
            </div>
          </div>
        </div>
      </Panel>

      <Panel as="section" tone="gold" contentClassName="stack gap-4">
        <div className="stack gap-1">
          <Text variant="h3" color="iron">
            DepressedInput and Button
          </Text>
          <Text variant="body" color="iron-light" className="text-sm">
            `DepressedInput` is the inset style variant for heavier authoring
            flows, including multiline prompts and fields that need counter or
            helper affordances.
          </Text>
        </div>

        <div className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
            <DepressedInput
              label="Light prompt"
              size="sm"
              color="gold"
              placeholder="Compact inset field"
              className="w-full max-w-md"
            />
            <div className="sm:pt-7">
              <Button size="sm" color="cloth">
                Save
              </Button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
            <DepressedInput
              label="Message"
              size="md"
              color="cloth"
              placeholder="A standard inset input"
              className="w-full max-w-md"
            />
            <div className="sm:pt-7">
              <Button size="md" color="cloth">
                Draft
              </Button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
            <DepressedInput
              label="Scene action"
              size="lg"
              color="fire"
              placeholder="A larger inset input"
              className="w-full max-w-md"
            />
            <div className="sm:pt-7">
              <Button size="lg" color="fire">
                Send
              </Button>
            </div>
          </div>
        </div>
      </Panel>

      <Panel as="section" tone="bone" contentClassName="stack gap-2">
        <Text variant="h3" color="iron">
          Where to use it
        </Text>
        <Text variant="body" color="iron-light" className="text-sm">
          Use `TextField` for short single-line input, `TextArea` for compact
          multi-line copy, and `DepressedInput` when the authoring flow needs a
          heavier inset treatment and extra controls.
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
