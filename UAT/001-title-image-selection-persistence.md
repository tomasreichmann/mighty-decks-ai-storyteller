# UAT: Title Image Selection and Lookup on Base Tab

**Date**: 2026-03-18

## Test Title

Base tab loses selected title image on navigation and Lookup omits images generated with different models

## Observed Behavior

1. **Selected title image lost on reload**: After generating 3 title images for the "Play at the river" module, navigating away from the "Base" tab and returning causes the visual image selection (generation group / batch thumbnails) to disappear. The URL is retained in the text field, but the generation UI resets to empty.

2. **Lookup missing Flux Pro image**: Clicking "Lookup Existing" after generating images with two different models (Flux-schnell and Flux Pro) only offers the images from the currently selected model in the dropdown. The third image (generated with `fal-ai/flux-2-pro`) is not available for selection when the model dropdown is set to `fal-ai/flux/schnell`.

## Expected Behavior

1. The "Base" tab should retain the full visual selection state (including the generation group thumbnails and active image highlight) when navigating between tabs, or at minimum auto-lookup the persisted image on re-mount.

2. The "Lookup Existing" button should surface all title images generated for this module regardless of which model produced them, so the user can compare and choose across models.

## Investigation Findings

### Image persistence (issue 1)

- The `coverImageUrl` is stored in `system.json` on the server and correctly persisted via `updateAdventureModuleCoverImage()` in `AdventureModuleTitleImagePanel.tsx`.
- **Root cause**: The `adventureModuleDetailSchema` (the schema for the module detail API response) did not include a `coverImageUrl` field. The detail endpoint (`getModule` / `getModuleBySlug`) never returned it, so the frontend always received `undefined` for `coverImageUrl`.
- The `AdventureModuleAuthoringPage.tsx` did not pass `coverImageUrl` to the `AdventureModuleBaseTabPanel` component.
- Additionally, the `useImageGeneration` hook stores `group` and `job` as ephemeral React state that resets to `null` on component unmount/remount. No automatic re-lookup occurred on mount.

### Model-scoped lookup (issue 2)

- Each generated image is stored in a **group** keyed by `SHA-256(provider + promptHash + modelHash)` (`ImageNaming.ts:26-33`).
- The three generated images live in three separate groups (two different prompts x two different models):
  - Group `5767dc...` — `fal-ai/flux/schnell`, prompt variant A (1 image)
  - Group `b6c93f...` — `fal-ai/flux/schnell`, prompt variant B (1 image)
  - Group `df3333...` — `fal-ai/flux-2-pro`, prompt variant B (1 image)
- The existing `lookupImageGroup()` sends `prompt + model + provider` to the backend, returning only a single matching group. No cross-model or cross-prompt aggregation existed.
- The "Lookup Existing" button was also gated behind `canRunActions` which required a non-empty prompt, making it unusable after tab navigation when the prompt resets to empty.

### Environment check

Both behaviors are **application-level design**, not caused by the local machine, OS, Node.js version, or any environment-specific factor. The server correctly stores all 3 images and the module cover URL. Confirmed by inspecting `apps/server/output/generated-images/index.json` and `apps/server/output/adventure-modules/am-mmwf69gdb8yh7j/system.json`.

## Implemented Solution

### Issue 1 — coverImageUrl in detail response + auto-lookup on remount

1. Added `coverImageUrl` to `adventureModuleDetailSchema` so the module detail API includes it.
2. Included `coverImageUrl: loaded.system.coverImageUrl` in the `getModule()` response construction.
3. Passed `coverImageUrl={moduleDetail.coverImageUrl}` prop from `AdventureModuleAuthoringPage` through `BaseTabPanel` to `TitleImagePanel`.
4. Added a `useEffect` in `AdventureModuleGeneratedImageField` that auto-lookups the matching image group by file name on mount, restoring the thumbnail UI without user action.
5. Relaxed `matchingGroup` logic to accept groups that contain the persisted image URL (not just exact prompt+model match).

### Issue 2 — Cross-model and cross-prompt image browsing

1. Added 3 new server endpoints (full vertical slice through spec/server/client/hook/UI):
   - `GET /api/image/groups/by-file/:fileName` — find the group containing a specific image file
   - `POST /api/image/groups/lookup-by-prompt` — find all groups sharing a prompt hash (any model)
   - `GET /api/image/groups?provider=fal` — list all groups for a provider
2. When the user types a prompt and clicks "Lookup Existing", it does prompt-specific lookup for the current model plus cross-model search for the same prompt.
3. When no prompt is typed (e.g. after tab navigation or clearing), "Lookup Existing" fetches ALL groups for the provider, showing every previously generated image.
4. Images appear in a "Previously generated images (click to select)" section with 96x96 thumbnails labeled by model name. Clicking selects the image as the title image.
5. Relaxed the "Lookup Existing" button to be enabled whenever the component is editable (no longer requires a typed prompt).

### UI Changes Summary

| Element | Before | After |
|---|---|---|
| Title image on tab switch | Lost (empty URL field, no preview) | Persisted (URL populated, preview shown, group auto-loaded) |
| "Clear Image" button | Disabled after tab switch | Enabled when image URL is present |
| "Lookup Existing" button | Required typed prompt to be enabled | Always enabled when editable |
| Lookup with prompt | Showed only current model's group | Shows current model + cross-model matches |
| Lookup without prompt | Not possible (button disabled) | Shows all previously generated images |
| Cross-model images | Not visible | Shown in "Previously generated images" section with model labels |

### Verification

- All 122 server tests pass
- TypeScript typecheck clean across all 3 workspace packages
- Playwright automated tests confirm: title image persists across tab switches, all 3 images visible after Lookup, buttons enabled correctly
- Manual UAT confirmed by module creator

### Files changed

- `spec/adventureModuleAuthoring.ts` — `coverImageUrl` in `adventureModuleDetailSchema`
- `spec/imageGeneration.ts` — new `imageLookupGroupsByPromptRequestSchema` and `imageGroupsResponseSchema`
- `apps/server/src/persistence/AdventureModuleStore.ts` — include `coverImageUrl` in detail response
- `apps/server/src/image/ImageStore.ts` — `lookupGroupByFileName()`, `lookupGroupsByPrompt()`, `listGroups()`
- `apps/server/src/image/ImageGenerationService.ts` — service layer delegation for new methods
- `apps/server/src/image/registerImageRoutes.ts` — 3 new routes
- `apps/web/src/lib/imageApi.ts` — 3 new client API functions
- `apps/web/src/hooks/useImageGeneration.ts` — 3 new hook methods
- `apps/web/src/components/adventure-module/AdventureModuleGeneratedImageField.tsx` — auto-lookup, cross-model gallery, relaxed button states
- `apps/web/src/routes/AdventureModuleAuthoringPage.tsx` — pass `coverImageUrl` prop
