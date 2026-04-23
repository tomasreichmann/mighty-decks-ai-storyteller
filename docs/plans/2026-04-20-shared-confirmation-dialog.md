# Shared Confirmation Dialog Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace all native confirm dialogs in the web app with one shared confirmation dialog and add bottom-right delete affordances for modules and campaigns.

**Architecture:** Add a reusable `ConfirmationDialog` component on top of the existing shared `Overlay`, then thread local open/close state through each destructive UI surface. Keep destructive actions close to their owning route/component so list refresh, navigation suppression, and target-specific copy remain explicit.

**Tech Stack:** React, TypeScript, Vite, existing shared UI primitives, node:test test files, repo-local API helpers.

---

### Task 1: Document The Approved Change

**Files:**
- Create: `docs/plans/2026-04-20-shared-confirmation-dialog-design.md`
- Create: `docs/plans/2026-04-20-shared-confirmation-dialog.md`

**Step 1: Write the design note**

- Capture the approved UX contract, scope, ownership assumptions, technical approach, risks, and validation points.

**Step 2: Write the implementation plan**

- Break the work into test-first tasks with exact files, commands, and expected outcomes.

**Step 3: Verify both docs exist**

Run: `Get-ChildItem docs/plans/2026-04-20-shared-confirmation-dialog*`
Expected: both markdown files are listed.

### Task 2: Add Failing Shared Dialog Tests

**Files:**
- Create: `apps/web/src/components/common/ConfirmationDialog.test.tsx`
- Modify: `apps/web/src/components/common/Overlay.tsx`

**Step 1: Write the failing test**

- Add coverage that a confirmation dialog renders title/body text, calls `onConfirm`, and closes via cancel/Escape.

**Step 2: Run test to verify it fails**

Run: `pnpm -C apps/web test -- ConfirmationDialog.test.tsx`
Expected: FAIL because `ConfirmationDialog` does not exist yet.

**Step 3: Write minimal implementation**

- Add the shared dialog component and any small `Overlay` accessibility hooks it needs.

**Step 4: Run test to verify it passes**

Run: `pnpm -C apps/web test -- ConfirmationDialog.test.tsx`
Expected: PASS.

### Task 3: Add Failing Top-Level Delete Flow Tests

**Files:**
- Modify: `apps/web/src/components/adventure-module/AdventureModuleCard.test.ts`
- Modify: `apps/web/src/components/campaign/CampaignListCard.test.ts`
- Modify: `apps/web/src/routes/AdventureModuleListPage.tsx`
- Modify: `apps/web/src/routes/CampaignListPage.tsx`

**Step 1: Write the failing tests**

- Add coverage that owned module cards expose a delete affordance and non-owned ones do not.
- Add coverage that campaign cards expose a delete affordance.
- Add route-level tests or render assertions for confirmation-driven deletion state if practical in the existing test style.

**Step 2: Run tests to verify they fail**

Run: `pnpm -C apps/web test -- AdventureModuleCard.test.ts CampaignListCard.test.ts`
Expected: FAIL because the new affordances are not rendered yet.

**Step 3: Write minimal implementation**

- Extend `StoryTileCard`, `AdventureModuleCard`, and `CampaignListCard` to support the bottom-right trash affordance without breaking current navigation and button actions.

**Step 4: Run tests to verify they pass**

Run: `pnpm -C apps/web test -- AdventureModuleCard.test.ts CampaignListCard.test.ts`
Expected: PASS.

### Task 4: Add Failing Authoring Confirmation Tests

**Files:**
- Modify: `apps/web/src/lib/authoring/store/AuthoringProvider.tsx`
- Modify: `apps/web/src/components/adventure-module/AdventureModuleGeneratedImageField.test.ts`
- Modify: `apps/web/src/components/adventure-module/CommonAuthoringTabContent.test.ts`

**Step 1: Write the failing tests**

- Cover that authoring deletes no longer depend on native confirm and instead require explicit dialog confirmation.
- Cover that generated-image removal opens the shared dialog and only deletes on confirm.

**Step 2: Run tests to verify they fail**

Run: `pnpm -C apps/web test -- AdventureModuleGeneratedImageField.test.ts CommonAuthoringTabContent.test.ts`
Expected: FAIL because the dialog flow is not wired yet.

**Step 3: Write minimal implementation**

- Introduce local confirmation state in the authoring surfaces and generated-image field.

**Step 4: Run tests to verify they pass**

Run: `pnpm -C apps/web test -- AdventureModuleGeneratedImageField.test.ts CommonAuthoringTabContent.test.ts`
Expected: PASS.

### Task 5: Add Failing Session And Image-Lab Confirmation Tests

**Files:**
- Modify: `apps/web/src/components/ActionComposer.tsx`
- Modify: `apps/web/src/components/EndSessionButton.tsx`
- Modify: `apps/web/src/components/campaign/CampaignStorytellerSessionShell.tsx`
- Modify: `apps/web/src/routes/ImageGenerator.tsx`

**Step 1: Write the failing tests**

- Cover end-session confirmation using the shared dialog.
- Cover image and batch delete actions using the shared dialog.

**Step 2: Run tests to verify they fail**

Run: `pnpm -C apps/web test -- ImageGenerator ActionComposer EndSessionButton CampaignStorytellerSessionShell`
Expected: FAIL because those surfaces still call `window.confirm`.

**Step 3: Write minimal implementation**

- Replace each remaining native confirm with local dialog state and explicit confirm callbacks.

**Step 4: Run tests to verify they pass**

Run: `pnpm -C apps/web test -- ImageGenerator ActionComposer EndSessionButton CampaignStorytellerSessionShell`
Expected: PASS.

### Task 6: Add Delete API Helpers And Route Wiring

**Files:**
- Modify: `apps/web/src/lib/adventureModuleApi.ts`
- Modify: `apps/web/src/lib/campaignApi.ts`
- Modify: `apps/web/src/routes/AdventureModuleListPage.tsx`
- Modify: `apps/web/src/routes/CampaignListPage.tsx`

**Step 1: Write the failing test**

- Add API-helper and route tests that expect module/campaign deletion to call the correct REST endpoints and prune local list state after success.

**Step 2: Run test to verify it fails**

Run: `pnpm -C apps/web test -- adventureModuleApi.test.ts campaignApi.test.ts`
Expected: FAIL because top-level delete helpers are missing.

**Step 3: Write minimal implementation**

- Add `deleteAdventureModule` and `deleteCampaign`.
- Open the shared dialog from list pages, call the delete helpers on confirm, and remove the deleted item from local state while preserving current filter/page behavior.

**Step 4: Run test to verify it passes**

Run: `pnpm -C apps/web test -- adventureModuleApi.test.ts campaignApi.test.ts`
Expected: PASS.

### Task 7: Update Docs And Changelog

**Files:**
- Modify: `docs/18-adventure-module-authoring-flow.md`
- Modify: `CHANGELOG.md`

**Step 1: Update the docs**

- Note that shared destructive confirmations now use a reusable dialog and that module/campaign list cards expose delete affordances.

**Step 2: Update changelog**

- Add concise unreleased bullets describing the new shared confirmation dialog and delete affordances.

**Step 3: Verify doc diff**

Run: `git diff -- docs/18-adventure-module-authoring-flow.md CHANGELOG.md`
Expected: only the intended documentation updates appear.

### Task 8: Final Verification

**Files:**
- Modify: `apps/web/src/...` files from previous tasks

**Step 1: Run targeted tests**

Run: `pnpm -C apps/web test -- ConfirmationDialog AdventureModuleCard CampaignListCard AdventureModuleGeneratedImageField CommonAuthoringTabContent ImageGenerator`
Expected: PASS.

**Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS.

**Step 3: Review native confirm removal**

Run: `rg -n "window\\.confirm\\(|confirm\\(" apps/web/src`
Expected: no remaining native confirm calls in app code.
