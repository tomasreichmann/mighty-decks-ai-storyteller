---
name: mighty-decks-rules
description: Use when making Mighty Decks gameplay, adventure, encounter, card, effect, counter, scene pacing, rules reference, or ship-combat design decisions in this repo.
---

# Mighty Decks Rules

Ground gameplay and content decisions in the rulebook rendered by `/rules`, not in generic RPG assumptions or older prototype text.

## Source Authority

1. `docs/mighty-decks-rulebook.md` is the canonical source for core gameplay. `/rules` imports that file directly.
2. `spec/rulesCards.ts` is the shared card catalog. It must match the rulebook but does not override it.
3. Ship combat is a separate prototype extension. Its explicit overrides apply only in that mode; otherwise the core rulebook wins.
4. External prototype pages are inspiration only. Never use them to override repo rules.

If another doc, skill reference, card, or example conflicts with the canonical rulebook, follow the rulebook and update the stale repo source in the same change when it is in scope.

## Default Approach

1. Identify whether the decision is core rules, adventure content, or the ship-combat prototype.
2. Read the relevant canonical rulebook sections before deciding; use `references/core-rules.md` as the section index.
3. Preserve fiction-first Effect, player choice, visible tactical information, fail-forward consequences, and low bookkeeping.
4. Use Outcome cards only when risk and meaningful consequences exist. NPC Actors use fixed Effects rather than Outcome hands.
5. Represent persistent state with Effects, Stunts, Counters, Assets, Locations, and scene/adventure structure before inventing new subsystems.

## References

- Read `references/core-rules.md` to locate the authoritative sections in `docs/mighty-decks-rulebook.md` and check common drift points.
- For ship combat, read the canonical core sections first, then `references/ship-combat.md` for prototype-only extensions and explicit overrides.
- Read `references/adventure-examples.md` for external prototype links and how to use them as style/content references.
