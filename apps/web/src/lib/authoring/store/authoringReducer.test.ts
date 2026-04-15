import test from "node:test";
import assert from "node:assert/strict";
import type { AdventureModuleDetail } from "@mighty-decks/spec/adventureModuleAuthoring";
import { authoringReducer, createInitialAuthoringState } from "./authoringReducer";

const createDetail = (): AdventureModuleDetail =>
  ({
  index: {
    moduleId: "module-1",
    slug: "lantern-heist",
    title: "Lantern Heist",
    summary: "A smoky caper.",
    premise: "Steal the lantern.",
    status: "draft",
    authorLabel: "Author",
    createdAtIso: "2026-04-01T12:00:00.000Z",
    updatedAtIso: "2026-04-01T12:00:00.000Z",
    sessionScope: "one_session_arc",
    launchProfile: "ai_storyteller",
    dos: ["mists"],
    donts: ["gore"],
    fragments: [
      {
        fragmentId: "player-fragment",
        kind: "player_summary",
        title: "Player Info",
        path: "player-info",
        summary: "Players know the city.",
        tags: [],
        containsSpoilers: false,
        intendedAudience: "players",
      },
      {
        fragmentId: "story-fragment",
        kind: "storyteller_summary",
        title: "Storyteller Info",
        path: "storyteller-info",
        summary: "The lantern is haunted.",
        tags: [],
        containsSpoilers: true,
        intendedAudience: "storyteller",
      },
      {
        fragmentId: "actor-fragment",
        kind: "actor",
        title: "Rook",
        path: "actors/rook",
        summary: "Anxious scout.",
        tags: [],
        containsSpoilers: false,
        intendedAudience: "shared",
      },
    ],
    playerSummaryFragmentId: "player-fragment",
    playerSummaryMarkdown: "Player summary",
    storytellerSummaryFragmentId: "story-fragment",
    storytellerSummaryMarkdown: "Storyteller summary",
    actorFragmentIds: ["actor-fragment"],
    actorCards: [
      {
        fragmentId: "actor-fragment",
        baseLayerSlug: "civilian",
        tacticalRoleSlug: "pawn",
        isPlayerCharacter: false,
      },
    ],
    counterCards: [],
    counters: [],
    assetFragmentIds: [],
    assetCards: [],
    locationFragmentIds: [],
    locationDetails: [],
    encounterFragmentIds: [],
    encounterDetails: [],
    questFragmentIds: [],
    questDetails: [],
    tags: [],
  },
  fragments: [
      {
        fragment: {
          fragmentId: "player-fragment",
          kind: "player_summary",
          title: "Player Info",
          path: "player-info",
          summary: "Players know the city.",
          tags: [],
          containsSpoilers: false,
          intendedAudience: "players",
        },
        content: "Player markdown",
      },
      {
        fragment: {
          fragmentId: "story-fragment",
          kind: "storyteller_summary",
          title: "Storyteller Info",
          path: "storyteller-info",
          summary: "The lantern is haunted.",
          tags: [],
          containsSpoilers: true,
          intendedAudience: "storyteller",
        },
        content: "Story markdown",
      },
      {
        fragment: {
          fragmentId: "actor-fragment",
          kind: "actor",
          title: "Rook",
          path: "actors/rook",
          summary: "Anxious scout.",
          tags: [],
          containsSpoilers: false,
          intendedAudience: "shared",
        },
        content: "Actor markdown",
      },
  ],
  actors: [
    {
      fragmentId: "actor-fragment",
      actorSlug: "rook",
      title: "Rook",
      summary: "Anxious scout.",
      baseLayerSlug: "civilian",
      tacticalRoleSlug: "pawn",
      isPlayerCharacter: false,
      content: "Actor markdown",
    },
  ],
  counters: [],
  assets: [],
  locations: [],
  encounters: [],
  quests: [],
  coverImageUrl: "https://example.com/cover.png",
  ownedByRequester: true,
} as unknown as AdventureModuleDetail);

test("authoringReducer hydrates shared forms and active entity drafts from a loaded detail", () => {
  const state = authoringReducer(
    createInitialAuthoringState({
      detailType: "module",
      activeTab: "actors",
      entityId: "rook",
    }),
    {
      type: "loadSucceeded",
      detail: createDetail(),
    },
  );

  assert.equal(state.detail?.index.title, "Lantern Heist");
  assert.equal(state.forms.base.title, "Lantern Heist");
  assert.equal(state.forms.playerInfo.summary, "Player summary");
  assert.equal(state.forms.storytellerInfo.summary, "Storyteller summary");
  assert.equal(state.forms.actor?.actorSlug, "rook");
  assert.equal(state.dirty.actor, false);
  assert.equal(state.validation.actor, null);
});

test("authoringReducer setDraftField marks the matching form dirty and clears validation", () => {
  const loadedState = authoringReducer(
    createInitialAuthoringState({
      detailType: "module",
      activeTab: "actors",
      entityId: "rook",
    }),
    {
      type: "loadSucceeded",
      detail: createDetail(),
    },
  );

  const state = authoringReducer(loadedState, {
    type: "setDraftField",
    form: "actor",
    field: "title",
    value: "Rook the Bold",
  });

  assert.equal(state.forms.actor?.title, "Rook the Bold");
  assert.equal(state.dirty.actor, true);
  assert.equal(state.validation.actor, null);
});

test("authoringReducer rolls optimistic actor saves back on failure", () => {
  const loadedState = authoringReducer(
    createInitialAuthoringState({
      detailType: "module",
      activeTab: "actors",
      entityId: "rook",
    }),
    {
      type: "loadSucceeded",
      detail: createDetail(),
    },
  );
  const editedState = authoringReducer(loadedState, {
    type: "setDraftField",
    form: "actor",
    field: "title",
    value: "Rook the Bold",
  });
  const optimisticState = authoringReducer(editedState, {
    type: "saveStarted",
    form: "actor",
    optimisticDetail: {
      ...createDetail(),
      actors: [
        {
          ...createDetail().actors[0],
          title: "Rook the Bold",
        },
      ],
    },
  });
  const rolledBackState = authoringReducer(optimisticState, {
    type: "saveFailed",
    form: "actor",
    message: "Could not update actor.",
  });

  assert.equal(optimisticState.detail?.actors[0]?.title, "Rook the Bold");
  assert.equal(rolledBackState.detail?.actors[0]?.title, "Rook");
  assert.equal(rolledBackState.error, "Could not update actor.");
  assert.equal(rolledBackState.autosave.status, "error");
});
