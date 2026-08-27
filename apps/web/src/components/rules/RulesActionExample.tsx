import type { ReactNode } from "react";
import type { OutcomeCardType } from "@mighty-decks/spec/adventureState";
import { OutcomeCard } from "../cards/OutcomeCard";
import { Heading } from "../common/Heading";
import { Message } from "../common/Message";
import { Panel } from "../common/Panel";
import { Text } from "../common/Text";

export type RuleExampleTurn = {
  speaker: "player" | "storyteller" | "rules";
  label: string;
  body: ReactNode;
  outcomes?: readonly OutcomeCardType[];
};

export interface RuleActionExample {
  title: string;
  turns: readonly RuleExampleTurn[];
}

export const ruleExampleById: Readonly<Record<string, RuleActionExample>> = {
  "example-a-basic-action": {
    title: "Example — A Basic Action",
    turns: [
      { speaker: "player", label: "Mira", body: "I climb the crumbling wall before the guards arrive." },
      { speaker: "storyteller", label: "Storyteller", body: "If this goes badly, you could fall or get stuck halfway." },
      { speaker: "player", label: "Mira", body: "I play:", outcomes: ["success"] },
      { speaker: "storyteller", label: "Storyteller", body: "You reach the top quickly and find a good vantage point." },
      { speaker: "rules", label: "Rules", body: "Discard the Success and immediately draw a replacement Outcome card." },
    ],
  },
  "example-partial-success": {
    title: "Example — Partial Success",
    turns: [
      { speaker: "player", label: "Brother Tomas", body: "I tell the suspicious guard that we were summoned by the lord of the keep." },
      { speaker: "player", label: "Brother Tomas", body: "I play:", outcomes: ["partial-success"] },
      { speaker: "storyteller", label: "Storyteller", body: "The guard lets you through, but follows you to verify your story." },
    ],
  },
  "example-two-valid-fumbles": {
    title: "Example — Two Valid Fumbles",
    turns: [
      { speaker: "player", label: "Mira", body: "I force the portcullis mechanism before the guards catch us." },
      { speaker: "player", label: "Mira", body: "I play:", outcomes: ["fumble"] },
      { speaker: "rules", label: "Rules", body: "A Fumble can still move the fiction forward with a fitting cost." },
    ],
  },
  "example-chaos": {
    title: "Example — Chaos",
    turns: [
      { speaker: "player", label: "Mira", body: "I pull the unstable lever and hope it opens the gate." },
      { speaker: "player", label: "Mira", body: "I play:", outcomes: ["chaos"] },
      { speaker: "storyteller", label: "Storyteller", body: "The gate opens — and the alarm bell begins to ring." },
    ],
  },
  "example-effect-is-impact-not-damage": {
    title: "Example — Effect Is Impact, Not Damage",
    turns: [
      { speaker: "player", label: "Mira", body: "I shoot the chandelier chain above the guard." },
      { speaker: "player", label: "Mira", body: "I play:", outcomes: ["success"] },
      { speaker: "storyteller", label: "Storyteller", body: "The chandelier crashes down: 1 Distress and 1 Stuck." },
      { speaker: "rules", label: "Rules", body: "Effect describes the impact that makes sense in the fiction, not only damage." },
    ],
  },
  "example-catastrophe": {
    title: "Example — Catastrophe",
    turns: [
      { speaker: "player", label: "Mira", body: "My replacement draw leaves me with:", outcomes: ["fumble", "fumble", "fumble"] },
      { speaker: "player", label: "Mira", body: "I announce a Catastrophe." },
      { speaker: "storyteller", label: "Storyteller", body: "You take 1 Injury, your bow gains a Complication, and a nearby bandit gains a Boost." },
    ],
  },
  "example-stacking-modifiers": {
    title: "Example — Stacking Modifiers",
    turns: [
      { speaker: "player", label: "Aldren", body: "I use my tool and Stunt with:", outcomes: ["success"] },
      { speaker: "rules", label: "Rules", body: "Relevant Assets, Stunts, Effects, and Outcome values stack unless a rule says otherwise." },
      { speaker: "storyteller", label: "Storyteller", body: "Your combined 4 Effect tears the lock free." },
    ],
  },
  "example-healing-with-a-consumable": {
    title: "Example — Healing with a Consumable",
    turns: [
      { speaker: "player", label: "Brother Tomas", body: "I spend my healing consumable to treat Aldren's Injury." },
      { speaker: "rules", label: "Rules", body: "The consumable is discarded after use unless a rule makes it permanent." },
    ],
  },
  "example-injury-and-distress-combine": {
    title: "Example — Injury and Distress Combine",
    turns: [
      { speaker: "storyteller", label: "Storyteller", body: "The collapsing balcony leaves you hurt and shaken." },
      { speaker: "rules", label: "Rules", body: "Injury and Distress use their own thresholds and can both apply to the same character." },
    ],
  },
  "example-range-and-zones": {
    title: "Example — Range and Zones",
    turns: [
      { speaker: "player", label: "Mira", body: "I cross to the next zone, then throw my dagger at the guard." },
      { speaker: "storyteller", label: "Storyteller", body: "The target is in range. Resolve the action normally." },
    ],
  },
  "example-defense": {
    title: "Example — Defense",
    turns: [
      { speaker: "storyteller", label: "Storyteller", body: "A Bandit attacks Aldren for 2 Injury." },
      { speaker: "player", label: "Aldren", body: "I play:", outcomes: ["success"] },
      { speaker: "rules", label: "Rules", body: "2 incoming Injury minus 2 Defense leaves 0 Injury." },
      { speaker: "storyteller", label: "Storyteller", body: "You catch the axe on your shield and force the bandit off balance. Take a Boost." },
    ],
  },
  "tiny-example-splash": {
    title: "Tiny Example — Splash",
    turns: [
      { speaker: "rules", label: "Rules", body: "Splash only affects the targets and zones described by the action or Stunt." },
    ],
  },
  "example-taken-out": {
    title: "Example — Taken Out",
    turns: [
      { speaker: "storyteller", label: "Storyteller", body: "The final consequence takes the guard out of the scene." },
      { speaker: "rules", label: "Rules", body: "Taken Out describes the fictional result; it does not have to mean death." },
    ],
  },
  "example-progress-counter": {
    title: "Example — Progress Counter",
    turns: [
      { speaker: "storyteller", label: "Storyteller", body: "Raise the Portcullis is at 0/4." },
      { speaker: "player", label: "Aldren", body: "I play:", outcomes: ["success"] },
      { speaker: "storyteller", label: "Storyteller", body: "Mira later Fumbles while helping, so the mechanism slips back to 1/4." },
    ],
  },
  "example-ongoing-counter": {
    title: "Example — Ongoing Counter",
    turns: [
      { speaker: "storyteller", label: "Storyteller", body: "Ice Storm is at 3/4." },
      { speaker: "rules", label: "Rules", body: "At the end of each round, exposed characters gain 1 Distress for each current level of Ice Storm." },
    ],
  },
};

export const RulesActionExample = ({
  example,
}: {
  example: RuleActionExample;
}): JSX.Element => (
  <div className="stack gap-4">
    <Heading level="h3" color="iron">
      {example.title}
    </Heading>
    <Panel as="section" tone="bone" className="mt-2" contentClassName="stack gap-4">
      {example.turns.map((turn, index) => {
        const player = turn.speaker === "player";
        const color = turn.speaker === "player"
          ? "fire"
          : turn.speaker === "storyteller"
            ? "gold"
            : "cloth";
        return (
          <Message
            key={`${turn.label}-${index}`}
            label={turn.label}
            color={color}
            rotateLabel={false}
            className={player ? "self-end" : "self-start"}
          >
            <div className="flex flex-wrap items-center gap-3">
              <span>{turn.body}</span>
              {turn.outcomes?.map((outcome, outcomeIndex) => (
                <OutcomeCard
                  key={`${outcome}-${outcomeIndex}`}
                  card={outcome}
                  className="mx-0 w-24"
                />
              ))}
            </div>
          </Message>
        );
      })}
    </Panel>
    <Text variant="note" color="iron-light">
      A static table exchange showing how the rule reads in play.
    </Text>
  </div>
);
