# Scene Stunt Rewards Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Document how scene-specific Stunts are displayed, earned, retained, and distributed on the public `/rules` page.

**Architecture:** Keep the canonical rule in `docs/mighty-decks-rulebook.md`, which the existing rulebook document loader renders on `/rules`. Add one focused source assertion and a concise Unreleased changelog entry; no UI component or styling changes are needed.

**Tech Stack:** Markdown, React/TypeScript source tests, Node test runner

---

### Task 1: Add source coverage for scene Stunt rewards

**Files:**
- Modify: `apps/web/src/lib/rulebookDocument.test.ts`

**Step 1: Write the failing test**

Add an assertion that the imported rulebook source includes both `The first player to fulfill a Stunt's requirement` and `keeps it for the rest of the Adventure`.

**Step 2: Run the focused test to verify it fails**

Run: `pnpm -C apps/web exec tsx --test src/lib/rulebookDocument.test.ts`

Expected: FAIL because the scene Stunt reward rule is not yet in the canonical Markdown.

### Task 2: Add the scene Stunt reward rule

**Files:**
- Modify: `docs/mighty-decks-rulebook.md:437`
- Modify: `CHANGELOG.md`

**Step 1: Add the approved rule text**

After the opening definition in section 9.2, add:

```markdown
At the beginning of some scenes, the Storyteller may choose up to as many scene-appropriate Stunts as there are players and place them face up on the table. Each displayed Stunt lists a requirement that players can fulfill during that scene. The first player to fulfill a Stunt's requirement gains that Stunt immediately and keeps it for the rest of the Adventure.

A player may earn more than one Stunt, but the Storyteller should guide opportunities so that one player does not hoard the available Stunts.
```

**Step 2: Update the changelog**

Under `## [Unreleased]`, add a concise Changed bullet describing the clarified scene Stunt rewards.

**Step 3: Run the focused test**

Run: `pnpm -C apps/web exec tsx --test src/lib/rulebookDocument.test.ts`

Expected: PASS.

### Task 3: Verify the repository

**Files:**
- Verify only

**Step 1: Run the agent check**

Run: `pnpm check:agent`

Expected: PASS, with full output recorded under `.agent-logs/`.

**Step 2: Review the scoped diff**

Run: `git diff -- docs/mighty-decks-rulebook.md apps/web/src/lib/rulebookDocument.test.ts CHANGELOG.md docs/plans/2026-08-28-scene-stunt-rewards-design.md docs/plans/2026-08-28-scene-stunt-rewards.md`

Expected: only the approved rule, its focused coverage, changelog note, and planning documents.
