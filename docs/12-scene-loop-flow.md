# 12 - Scene Loop Flow (Draft)

This is a proposed AI Storyteller orchestration flow, not a separate rules source. Core gameplay follows [the canonical Mighty Decks rulebook](mighty-decks-rulebook.md), which is rendered at `/rules`. The runtime may automate or defer a rule, but it must not silently redefine it.

This flow chart defines the proposed play-phase turn loop to address:

1. Information-seeking actions should return concrete information (with longer output when needed).
2. Dangerous failed actions should apply visible negative consequences.
3. NPCs should act from their own agenda, not only react to player actions.
4. Rewards should be granted when goals are actually completed, not just when a single Outcome is strong.

---

## Agent Interaction Sequence

```mermaid
sequenceDiagram
  autonumber
  participant P as Player
  participant S as AdventureManager (Server)
  participant O as Outcome Decider
  participant N as Narrative Director
  participant C as Scene Controller
  participant K as Continuity Keeper

  S->>C: resolve scene mode (high_tension or low_tension)

  P->>S: submit_action(text)
  S->>O: classify action intent + stakes

  alt Outcome check required
    S-->>P: activeOutcomeCheck prompt
    P->>S: play_outcome_card(card)
    S->>N: narrate with outcome guidance
  else No outcome check
    alt intent = information_request
      S->>N: expanded answer request
    else intent = standard_action
      S->>N: concise action resolution
    end
  end

  S->>C: apply world reaction (goal progress, due Actor turn, pressure, reward gate, closeScene)
  C-->>S: structured turn package
  S->>K: refresh rolling summary + facts + open threads
  K-->>S: continuity update
  S-->>P: storyteller response + scene updates

  alt closeScene = true
    S-->>P: start scene_transition vote
  else closeScene = false
    S-->>P: prompt next player action
  end
```

---

## Turn Decision Flow

```mermaid
flowchart TD
  A[Scene active] --> B{Scene mode?}
  B -->|High tension| C[Use agreed player order and placed Actor timing]
  B -->|Low tension| D[Any connected player may act when queue is free]
  C --> E[Current player submits action]
  D --> E
  E --> F[AdventureManager validates phase, player eligibility, and queue]
  F --> G[Outcome Decider classifies intent and stakes]
  G --> H{Outcome check needed?}

  H -->|Yes| I[Request Outcome card from targeted player]
  I --> J[Player plays card]
  J --> K[Narrative Director resolves action using card guidance]

  H -->|No| L{Information request?}
  L -->|Yes| M[Narrative Director gives expanded answer with actionable details]
  L -->|No| N[Narrative Director gives concise fail-forward resolution]

  K --> O[Scene Controller applies world reaction]
  M --> O
  N --> O

  O --> P{Goal or milestone completed?}
  P -->|Yes| Q[Reward package: loot, intel, recognition, access, advantage]
  P -->|No| R[No reward yet: narrate progress or setback only]

  O --> S{Outcome guidance}
  S -->|Positive Effect| T[Apply total Effect through the fiction]
  S -->|Fumble| U[Apply roughly one negative Effect and fail forward]
  S -->|Chaos| V[Create an unpredictable roughly neutral twist]

  Q --> W{Actor placed after this player?}
  R --> W
  T --> W
  U --> W
  V --> W
  W -->|Yes| WA[Resolve all due Actors in Storyteller-chosen order using fixed Effects]
  W -->|No| X[Recalculate scene tension from latest fiction]
  WA --> X
  X --> Y{Tension changed?}
  Y -->|Escalated| YA[Switch to high_tension immediately if needed]
  Y -->|Dropped| YB[Switch to low_tension immediately if needed]
  Y -->|No change| YC[Keep current mode]
  YA --> Z[Continuity Keeper updates goals, consequences, rewards, NPC threads]
  YB --> Z
  YC --> Z
  Z --> ZA[Server commits transcript and state updates]
  ZA --> ZB{Scene closes now?}
  ZB -->|Yes| ZC[Start scene transition vote]
  ZB -->|No| ZD[Return to next valid actor]
```

---

## Outcome Interpretation Matrix (Narrative Layer)

| Outcome signal | Minimum narrative obligation |
| --- | --- |
| `success` | Apply +2 Effect through the fiction; reward only if this completes a concrete goal or milestone. |
| `special-action` | Apply +3 Effect when the card is legal through a Stunt, expertise, another rule, or Storyteller approval. |
| `partial-success` | Apply +1 Effect as reduced impact, an imperfect result, or a fitting cost; do not automatically create a Complication card. |
| `fumble` | Apply roughly one significant negative Effect. The attempted action may fail or partly work with a larger consequence; fail forward. |
| `chaos` | Create an unpredictable, roughly neutral twist rather than a disguised Success or Fumble. Chaos cannot be used for Defense. |

Consequence examples (from Mighty Decks effect concepts): injury, distress, complication, movement hindrance, or environmental pressure.

Reward examples: useful loot, leverage, trustworthy intel, faction recognition, temporary advantage.

---

## Goal Completion Reward Gate

- Rewards are tied to completed fictional objectives or milestones.
- Strong outcomes can accelerate progress without immediately paying out loot or social rewards.
- If a player sets up a finishing move, payout happens on the finishing move when the objective actually resolves.

Example sequence:

1. Player uses `special-action` to strike an enemy: enemy is bloodied but still active.
2. No loot reward yet, because the enemy objective is not complete.
3. Next turn player uses `partial-success` to finish the enemy.
4. Reward now applies: loot from the enemy, plus a cost/complication if appropriate.

---

## Fail-Forward Constraint

- Failure must not dead-end mandatory progression.
- When an action fails at a required bottleneck, the story still advances, but with cost.
- Costs should be concrete: injury, distress, broken gear, time loss, noise, exposure, or NPC escalation.

Example sequence:

1. Player needs a tool to force a locked door.
2. Repeated `fumble` still allows discovery of a weak tool (progress path preserved).
3. Door is forced open, but tool breaks and player is injured.
4. Scene advances with consequences recorded for later turns.

---

## Tension Modes And Acting Order

- `high_tension`: use the simple player order agreed before the Adventure. An NPC Actor acts after the player its card is placed in front of; several Actors at one position act in Storyteller-chosen order.
- `low_tension`: players act more freely (queue-limited), and NPC beats trigger when fiction demands.
- Mode can switch mid-scene as pressure escalates or drops.
- The Scene Controller tracks the agreed order and Actor placement; it does not invent a new initiative order when tension rises.

---

## Dynamic Tension Shifts

- Tension is not fixed for the whole scene. It is recalculated after each resolved action and NPC beat.
- Escalation can happen immediately when fiction changes sharply.
- De-escalation can happen immediately when major threats are removed.

Escalation trigger examples:

1. A hidden player is discovered.
2. A new hazard appears or spreads (for example, fire in the house).
3. Players initiate violence (attack, sabotage, direct confrontation).
4. A time-critical clock jumps forward.

De-escalation trigger examples:

1. All active enemies are neutralized or routed.
2. Players reach temporary safety.
3. Major hazards are removed or contained.
4. Immediate pursuit pressure ends.

Mode switch rule:

- If escalation crosses high-tension threshold, switch to `high_tension` before the next actor is selected.
- If de-escalation drops below threshold, switch to `low_tension` before the next actor is selected.
- The switch is server-authored and visible to all clients through state updates.

---

## Notes For Next Implementation Step

- Keep this text-first: rewards and consequences can be represented in narration plus continuity facts; no new dashboard UI is required.
- Preserve server authority and FIFO action processing.
- Keep `Scene Controller` as the source of mode (`high_tension`/`low_tension`), due Actor turns and other NPC beats, and close/continue decisions while preserving canonical player order and Actor placement.
- Keep `Continuity Keeper` responsible for persisting consequences and rewards as durable story facts.
