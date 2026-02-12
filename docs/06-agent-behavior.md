# 06 – Agent Behavior

This document defines the **behavioral contracts for AI agents** in the MVP.
It focuses on **what each agent is responsible for**, how they interact, and the
rules they must follow to ensure a fun, coherent experience.

This is **not** a prompt dump.  
Prompt templates and concrete AI schemas live in `apps/server/src/ai/storyteller/`.

---

## Agent model (MVP)

Agents are **logical roles**, not necessarily separate model instances.
In MVP, agents are executed **sequentially** by the server’s `AgentRunner`.

Agents must:

- respect server-provided state
- never invent hidden mechanics
- never contradict established facts
- fail safely and concisely

---

## Agent roster (MVP)

### 1. Pitch Generator

**Purpose**
Generate 2–3 adventure pitches that merge player preferences.

**Inputs**

- Player character names
- Player adventure preference texts

**Outputs**

- A list of 2–3 pitch options, each with:
  - title
  - short hook (2–4 lines)
  - implied tone or genre

**Rules**

- Pitches must be meaningfully distinct
- Avoid referencing rules, stats, or cards
- Keep scope suitable for a one-session story
- Do not introduce hidden lore yet

---

### 2. Narrative Director (Main Storyteller)

**Purpose**
Act as the primary narrative voice responding to player actions.

**Inputs**

- Current scene (public)
- Rolling summary and facts
- Player action text

**Outputs**

- Concise narrative response
- Optional follow-up prompt to players

**Rules**

- Default to brevity
- Expand only when players ask for detail
- Bias outcomes toward success (~75%)
- Failures must **fail forward**
- Never block play with “nothing happens”
- Never contradict names, locations, or outcomes already stated

---

### 3. Scene Controller

**Purpose**
Frame scenes, control pacing, and decide when to close scenes.

**Inputs**

- Session context
- Current scene state
- Recent transcript entries

**Outputs**

- New scene definition (on scene start)
- Scene closure decision + summary (on scene end)

**Rules**

- Each scene must have:
  - a clear situation
  - a pressure or goal
  - at least one exit (even if not immediately obvious)
- Close scenes proactively when:
  - the core question is answered
  - tension peaks
  - players clearly change direction
- Scene summaries must be short and factual
- On closure, hand off to server-driven transition vote (`Next Scene` vs `End Session`)
- Transition vote timing and tie-break rules are server-managed, not agent-managed

---

### 4. Continuity Keeper

**Purpose**
Preserve narrative consistency and compress context.

**Inputs**

- Full transcript
- Latest scene updates

**Outputs**

- Rolling summary
- Facts list (names, locations, promises, consequences)
- Open threads list

**Rules**

- Never invent new facts
- Prefer compression over paraphrase
- Flag potential contradictions internally
- Output must be machine-readable

---

### 5. Image Generator

**Purpose**
Generate a visual mood image for a scene.

**Inputs**

- Scene public description
- Optional style constraints

**Outputs**

- Image URL or asset reference

**Rules**

- Image generation is asynchronous
- Must not block scene start
- One image per scene start (MVP)
- No text overlays
- Avoid depicting specific copyrighted characters

**Technical note**

- Uses **FLUX.2 Klein 4B via OpenRouter**

---

## Agent interaction order (MVP)

### Scene start

1. Scene Controller → defines scene
2. Narrative Director → produces intro prose
3. Image Generator → starts async image generation
4. Continuity Keeper → updates summary

---

### Player action

1. Continuity Keeper → prepares condensed context
2. Narrative Director → responds to action
3. Scene Controller → decides continue vs close
4. Continuity Keeper → updates summary/facts
5. Server commits transcript

---

## Global behavioral rules

### Tone & voice

- Neutral narrator voice
- No meta commentary
- No rule explanations
- No breaking the fourth wall

---

### Success & failure

- Success bias is hidden
- Failure introduces complications, not dead ends
- Never punish players for creativity

---

### Player agency

- Never remove player choices retroactively
- Never assume player intent beyond text
- Ask clarifying questions only when absolutely necessary

---

### Safety (MVP stance)

- No explicit safety tooling
- Avoid graphic descriptions involving minors
- Avoid real-world hate or harassment

(Expanded safety controls are a post-MVP concern.)

---

## Determinism & randomness

- Outcomes may vary between runs
- Consistency matters more than surprise
- Prefer stable names, places, and motifs
- limiting amount of context by reusing existing content is desirable as long as it does not feel repetitive

---

## Non-goals for agents (MVP)

- Simulating RPG rules
- Tracking stats or inventories
- Acting as a human GM
- Enforcing “correct” play

---

## Summary

Agents are designed to:

- keep the story moving
- stay out of the players’ way
- preserve continuity
- make the table want “just one more scene”

If agents disagree, **continuity and clarity win over creativity**.
