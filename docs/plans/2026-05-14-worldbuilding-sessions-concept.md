# Campaign Worldbuilding Sessions Concept

## Summary

Worldbuilding sessions are Campaign-attached collaboration sessions where players use chat to define future campaign canon without immediately mutating campaign content.

The implementation reuses the existing campaign session realtime stack for presence and transcript, and reuses the shared board primitives from `/board` and `/spaceship` for a visual result board. Accepted proposals remain non-canonical until a user with session edit authority imports them from the Worldbuilding Result page.

## Current Slice

- Campaign sessions can now be created with `mode: "worldbuilding"`.
- Worldbuilding sessions store a `worldbuilding` result record on the session.
- Result records track the phase, committed theme, proposal cards, and imported proposal ids.
- Socket.IO events can commit the theme, submit motifs, add proposal cards, accept/reject proposals, advance phases, and import selected proposals.
- `/campaign/:campaignSlug/worldbuilding/:sessionId` renders the board result and import controls.
- Import creates normal campaign Locations, Actors, Assets, Encounters, and Quests from selected proposal cards.

AI extraction, contradiction checking, and generated card art are intentionally left for the next slice. The current slice gives the AI layer a stable place to write proposals.

## Session Flow

1. Theme discussion
   - Prompt: "What is the main theme of this adventure?"
   - Example commitment: "Arthurian gothic horror about conquering a shadow realm."
   - Created proposal: `theme`.
   - Board layout: centered root card at the top.

2. Must-have and avoid motifs
   - Players submit one or more `must_have` and `avoid` motifs.
   - Examples: cursed knights, haunted castles, lake magic; avoid time travel, zombies, suicide.
   - Created proposals: `motif`.
   - Board layout: must-have stack left of the theme, avoid stack right of the theme.

3. First worldbuilding turn
   - Example facts:
     - "Shadow realm monsters appear in Albion."
     - "A tear to the shadow realm opens in the capital."
   - Created proposals: `quest`, `encounter`, optional `location`.
   - Board layout: quests and encounters form the central pressure column; locations form the left places column.

4. Second worldbuilding turn
   - Example fact: "King Arthur receives Excalibur from the mysterious Lady of the Lake."
   - Created proposals: `actor`, `actor`, `asset`, optional `relationship`.
   - Board layout: actors, assets, and relationship notes form the right-side people/assets column.

5. Review
   - The result board groups proposals by type and shows their review status.
   - Theme and motifs stay as context.
   - Importable proposals are Locations, Actors, Assets, Encounters, and Quests.

6. Import
   - The result page imports selected accepted proposals into campaign content.
   - Imported proposals are marked `imported` and retained in the result for auditability.

## Data Model

Worldbuilding state lives on `CampaignSessionDetail.worldbuilding`:

- `phase`: `theme_discussion | motifs | turn_building | review | closed`
- `theme`: committed theme text
- `proposals`: reviewable proposal cards
- `importedProposalIds`: proposals already imported into campaign content

Proposal kinds:

- `theme`
- `motif`
- `location`
- `actor`
- `asset`
- `encounter`
- `quest`
- `relationship`

Only `location`, `actor`, `asset`, `encounter`, and `quest` currently import into campaign entities.

## Next Slice

- Add AI workflow steps that read recent transcript entries and propose structured cards.
- Add contradiction checks against accepted/imported proposals.
- Add image generation per proposal with async status.
- Add a guided worldbuilding session UI for theme, motifs, turn prompts, and active-player prompts instead of relying on direct socket actions.
- Expand import to write summaries/body content, not just entity titles.
