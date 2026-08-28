# Scene Stunt Rewards Design

## Goal

Add the missing rule explaining how the Storyteller can offer scene-specific
Stunts, how players earn them, and how long earned Stunts remain with a
character.

## Rules Design

At the beginning of some scenes, the Storyteller may place a number of
scene-appropriate Stunts face up on the table, up to the number of players.
Each displayed Stunt has a requirement that can be completed during that
scene. The first player to complete the requirement gains the Stunt
immediately and keeps it for the rest of the Adventure.

A player may earn multiple scene Stunts. This is not subject to a hard cap,
but the Storyteller should guide the fiction and available opportunities so
that a single player does not hoard the rewards.

## Presentation

Place the new rule at the beginning of section 9.2, after the one-sentence
definition of Stunts and before the existing setup rule. Use a separate
paragraph for the Storyteller's spotlight guidance so readers can distinguish
the binding reward mechanics from table-management advice.

The public `/rules` page already renders `docs/mighty-decks-rulebook.md`, so no
new component, layout, or styling is required.

## Verification

Add focused source coverage that asserts the public rulebook contains the key
reward duration and first-player language. Run the relevant rulebook tests and
the repository agent check. Because this is a prose-only change using the
existing renderer, browser verification is unnecessary.
