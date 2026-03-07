# 16 - Adventure Module Best Practices and Examples

This appendix records external design patterns and examples that inform the Adventure Module specification.
It translates those patterns into practical authoring rules for Mighty Decks modules.

This document is advisory research support for the post-MVP module track.

---

## 1. Research Method and Selection Criteria

Method:

1. Select primary sources from widely used TTRPG design references.
2. Prioritize sources with concrete structural practices over abstract advice.
3. Extract patterns that improve reliability for one-session arc adventures.
4. Translate each pattern into module-level authoring requirements.

Selection criteria:

- Practical at table, not only theoretical
- Supports non-linear play
- Reduces dead-end risk
- Compatible with text-first authoring and AI consumption
- Applicable to both AI and physical Storyteller launch profiles

---

## 2. Best-Practice Patterns

### Pattern A: Node-Based Scenario Structure

Summary:

- Build scenario structure as interconnected nodes instead of fixed sequence.
- Players choose paths while scenario logic stays coherent.

Why it matters for modules:

- Supports replayability and player agency.
- Makes remix and fork workflows safer.

Module rule translation:

- Every quest uses explicit nodes, edges, entry nodes, and conclusion nodes.
- No module should depend on one mandatory linear path.

References:

- https://thealexandrian.net/wordpress/13085/roleplaying-games/node-based-scenario-design-part-1-the-plotted-approach
- https://fate-srd.com/fate-codex/improv-adventures

### Pattern B: Three-Clue Redundancy

Summary:

- Critical information should be discoverable through multiple clues.

Why it matters for modules:

- Prevents blocked progression when one clue path is missed.

Module rule translation:

- For each required quest progression gate, include at least two alternative clue vectors and one fallback consequence path.

Reference:

- https://thealexandrian.net/wordpress/1118/roleplaying-games/three-clue-rule

### Pattern C: Escalation Clocks and Pressure Tracking

Summary:

- Use explicit pressure trackers to keep momentum visible and actionable.

Why it matters for modules:

- Reinforces fail-forward pacing and prevents static scenes.

Module rule translation:

- Encounters and high-pressure nodes include counter opportunities and escalation triggers.
- Counter guidance should define what changes when pressure advances.

References:

- https://bladesinthedark.com/progress-clocks
- https://www.dungeonworldsrd.com/gamemastering/fronts/

### Pattern D: Fronts and Agenda-Driven Threats

Summary:

- Threats advance according to agenda even when players do nothing.

Why it matters for modules:

- Maintains narrative pressure and avoids passive worlds.

Module rule translation:

- Actor and encounter fragments should include agenda pressure notes and likely next moves.
- Quest graph edges should include consequence hints.

Reference:

- https://www.dungeonworldsrd.com/gamemastering/fronts/

### Pattern E: One-Page Usability Constraints

Summary:

- High utility prep artifacts are concise, easy to scan, and table-usable.

Why it matters for modules:

- Faster adoption by time-constrained storytellers.

Module rule translation:

- Fragment summaries should remain short.
- Key hooks, pressures, and exits should be scannable without full-text reading.

References:

- https://www.dungeoncontest.com/one-page-dungeon-contest-2024-submission-rules
- https://www.dungeoncontest.com/one-page-dungeon-contest-2024-winners
- https://blog.trilemma.com/2016/04/crevasse-city.html

### Pattern F: Focused Adventure Prep Templates

Summary:

- Strong prep templates define essentials first: premise, conflict, locations, secrets, and likely scenes.

Why it matters for modules:

- Keeps module creation consistent and reviewable.

Module rule translation:

- Mandatory fragment set is fixed and checked before publish.
- The index acts as canonical checklist and reference map.

Reference:

- https://slyflourish.com/adventure_template.html

---

## 3. Concrete Adventure-Design Examples

### Example Type 1: Multi-Node Heist

Observed strengths:

- Multiple infiltration vectors
- Parallel clues
- Escalation pressure from alarms/patrols

Module adaptation:

- Quest graph with several entry nodes
- Layered assets tied to access and leverage
- Counter opportunities for alarm pressure

### Example Type 2: Mystery with Redundant Leads

Observed strengths:

- Redundant clues across NPCs, locations, and artifacts
- Flexible sequence with stable core facts

Module adaptation:

- Hook arrays per quest
- Node transitions based on discovered facts, not strict order
- Conclusion variants for partial or full resolution

### Example Type 3: Crisis Front with Countdown

Observed strengths:

- Threat advances by clock even when players stall
- Clear consequence escalations

Module adaptation:

- Encounter and actor fragments include agenda progression notes
- Counter opportunities linked to quest node transitions

---

## 4. Translation to Mighty Decks Adventure Module Rules

1. Quest graphs are mandatory and node-based.
2. Required progression points must have clue redundancy.
3. Pressure escalation should be represented with counter opportunities.
4. Actors and encounters should include threat agendas and likely consequences.
5. Fragments should remain concise and scannable.
6. Component opportunities should be explicit and rationalized.
7. Minis/map references remain phase-2 tags only.

---

## 5. Anti-Patterns to Avoid

1. Single-path quest dependency
- Risk: dead-end progression and brittle sessions

2. Hidden mandatory clue with no backup
- Risk: stalled play and forced GM patching

3. Static threat with no escalation
- Risk: pacing collapse

4. Overlong prose-only fragments
- Risk: poor scanability at table

5. Component mentions without placement rationale
- Risk: unusable mapping for runtime/physical facilitation

6. Mixing runtime and authored terminology
- Risk: contract confusion between module and session state

---

## 6. Practical Authoring Heuristics

1. Keep each fragment summary short and decision-oriented.
2. Ensure each quest has multiple hooks and at least one fail-forward path.
3. Validate that every edge reflects a plausible fiction transition.
4. Add at least one pressure vector in each major encounter.
5. Prefer specific consequence wording over abstract warnings.
6. Use component opportunity strength (`required`, `recommended`, `optional`) to prioritize review effort.
7. Treat the module index as canonical truth for references and manifests.

---

## 7. Source Links

- https://thealexandrian.net/wordpress/13085/roleplaying-games/node-based-scenario-design-part-1-the-plotted-approach
- https://thealexandrian.net/wordpress/1118/roleplaying-games/three-clue-rule
- https://bladesinthedark.com/progress-clocks
- https://www.dungeonworldsrd.com/gamemastering/fronts/
- https://slyflourish.com/adventure_template.html
- https://www.dungeoncontest.com/one-page-dungeon-contest-2024-submission-rules
- https://www.dungeoncontest.com/one-page-dungeon-contest-2024-winners
- https://blog.trilemma.com/2016/04/crevasse-city.html
- https://fate-srd.com/fate-codex/improv-adventures
- https://fate-srd.com/fate-codex/never-ever-mark-scenic-waypoint

