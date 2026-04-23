# Shared Confirmation Dialog Design

**Date:** 2026-04-20

**Goal:** Replace all native `window.confirm` usage in the web app with one shared confirmation dialog, and add module/campaign deletion affordances that match the existing authoring-item trash-button pattern.

## Scope

- Add a reusable confirmation dialog component in `apps/web/src/components/common`.
- Reuse the existing shared `Overlay` primitive instead of introducing another modal foundation.
- Replace every current `window.confirm` call in the web app.
- Add delete affordances to Adventure Module and Campaign list cards.

## UX Contract

- Confirmation uses one shared visual shell and button layout across the app.
- Destructive actions use the existing blood/cursed visual language.
- Module and campaign delete affordances appear in the bottom-right card action area, matching authoring-item trash placement.
- Dialog copy is action-specific and explicit about the target being removed.
- Confirming a module or campaign delete removes the item from the current list without a full-page reload.
- Cancelling leaves local state untouched.

## Ownership And Visibility

- Adventure Modules already expose `ownedByRequester` on the list payload, so the list card delete affordance should render only for owned modules.
- Campaigns are authored through the shared campaign editor token on the server, so the campaign list can treat listed campaigns as deletable within the current MVP flow without adding another ownership contract in this change.

## Technical Approach

- Build a generic `ConfirmationDialog` component on top of `Overlay`.
- Add a small controller hook/component pattern where local state decides when the dialog is open and which callback runs on confirm.
- Keep dialog orchestration local to each surface instead of introducing a global confirmation service.
- Extend API helpers with top-level delete methods for Adventure Modules and Campaigns.
- Preserve existing authoring-store delete behavior, but route the actual user confirmation through the shared dialog instead of inline `window.confirm`.

## Affected Areas

- Shared primitives: new confirmation dialog component.
- Authoring store: entity delete confirmation.
- Adventure Module generated-image picker: gallery image removal confirmation.
- Image Lab route: image and batch deletion confirmation.
- Session UI: end-session confirmation in player/storyteller entry points.
- List cards: module and campaign top-level deletion.

## Risks

- Card actions sit inside clickable tiles, so the trash affordance must stop navigation events reliably.
- Replacing inline confirms with deferred dialog callbacks can accidentally capture stale props if handlers are not updated carefully.
- Module/campaign delete flows must keep pagination and filtered list state coherent after local removal.

## Validation

- Dialog opens and closes correctly with cancel, backdrop click, and Escape.
- Confirm fires the correct destructive callback exactly once.
- Module and campaign trash buttons render in the bottom-right action area and do not trigger card navigation.
- All previous native-confirm flows now use the shared dialog instead.
