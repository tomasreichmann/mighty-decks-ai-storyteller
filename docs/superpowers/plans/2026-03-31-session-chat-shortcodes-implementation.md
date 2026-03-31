# Session Chat Shortcodes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render supported shortcodes inline inside campaign session chat messages so players and storytellers can paste any number of components into one message without changing the stored transcript text.

**Architecture:** Keep campaign session transcript entries as raw text and add a web-only parse-and-render layer for chat message content. A shared message content component will parse text into ordered segments, resolve cards from the active campaign catalog plus built-in game card data, and render unresolved tokens back as visible text.

**Tech Stack:** React 18, TypeScript, `node:test`, `tsx --test`, existing `GameCardCatalogContext`, existing card resolver utilities

---

## File Map

- Create: `apps/web/src/lib/campaignSessionMessageSegments.ts`
  Purpose: parse raw session chat text into ordered text and shortcode segments.
- Create: `apps/web/src/lib/campaignSessionMessageSegments.test.ts`
  Purpose: cover repeated, mixed, and punctuation-adjacent shortcode parsing.
- Create: `apps/web/src/components/CampaignSessionMessageContent.tsx`
  Purpose: render parsed session chat segments inline using existing card views and resolver helpers.
- Create: `apps/web/src/components/CampaignSessionMessageContent.test.tsx`
  Purpose: verify rendered output keeps prose, resolves cards, and falls back to raw tokens when unresolved.
- Modify: `apps/web/src/lib/gameCardCatalogContext.tsx`
  Purpose: export a helper for building the catalog context value from campaign entity arrays.
- Modify: `apps/web/src/routes/CampaignSessionPlayerPage.tsx`
  Purpose: swap plain transcript text rendering for the shared inline shortcode renderer.
- Modify: `apps/web/src/routes/CampaignAuthoringPage.tsx`
  Purpose: swap storyteller chat transcript text rendering for the shared inline shortcode renderer.
- Modify: `apps/web/src/routes/CampaignSessionPages.test.ts`
  Purpose: assert the player session page now uses the shared inline renderer.
- Modify: `apps/web/src/routes/CampaignAuthoringPage.test.ts`
  Purpose: assert the storyteller chat transcript uses the shared inline renderer.
- Modify: `CHANGELOG.md`
  Purpose: record the visible chat behavior change under `## [Unreleased]`.

### Task 1: Parse Session Chat Shortcodes

**Files:**
- Create: `apps/web/src/lib/campaignSessionMessageSegments.test.ts`
- Create: `apps/web/src/lib/campaignSessionMessageSegments.ts`

- [ ] **Step 1: Write the failing test**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import {
  parseCampaignSessionMessageSegments,
} from "./campaignSessionMessageSegments";

test("parseCampaignSessionMessageSegments preserves mixed prose and repeated shortcode order", () => {
  assert.deepEqual(
    parseCampaignSessionMessageSegments(
      "Push @counter/threat-clock, then inspect @quest/recover-the-shard and @counter/threat-clock again.",
    ),
    [
      { kind: "text", text: "Push " },
      {
        kind: "game_card",
        token: "@counter/threat-clock",
        type: "CounterCard",
        slug: "threat-clock",
      },
      { kind: "text", text: ", then inspect " },
      {
        kind: "quest_card",
        token: "@quest/recover-the-shard",
        slug: "recover-the-shard",
      },
      { kind: "text", text: " and " },
      {
        kind: "game_card",
        token: "@counter/threat-clock",
        type: "CounterCard",
        slug: "threat-clock",
      },
      { kind: "text", text: " again." },
    ],
  );
});

test("parseCampaignSessionMessageSegments recognizes punctuation-adjacent asset and encounter shortcodes", () => {
  assert.deepEqual(
    parseCampaignSessionMessageSegments(
      "Ready @asset/base_light/base_hidden? Trigger @encounter/bridge-tribute-checkpoint!",
    ),
    [
      { kind: "text", text: "Ready " },
      {
        kind: "game_card",
        token: "@asset/base_light/base_hidden",
        type: "AssetCard",
        slug: "base_light",
        modifierSlug: "base_hidden",
      },
      { kind: "text", text: "? Trigger " },
      {
        kind: "encounter_card",
        token: "@encounter/bridge-tribute-checkpoint",
        slug: "bridge-tribute-checkpoint",
      },
      { kind: "text", text: "!" },
    ],
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec tsx --test apps/web/src/lib/campaignSessionMessageSegments.test.ts`

Expected: FAIL with module resolution errors because `campaignSessionMessageSegments.ts` does not exist yet.

- [ ] **Step 3: Write minimal implementation**

```ts
import {
  parseLegacyGameCardToken,
  type GameCardType,
} from "./gameCardMarkdown";

const SHORTCODE_PATTERN =
  /@(?:asset\/[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)?|(?:outcome|effect|stunt|actor|counter|encounter|quest)\/[A-Za-z0-9_-]+)/g;

export type CampaignSessionMessageSegment =
  | { kind: "text"; text: string }
  | {
      kind: "game_card";
      token: string;
      type: GameCardType;
      slug: string;
      modifierSlug?: string;
    }
  | { kind: "encounter_card"; token: string; slug: string }
  | { kind: "quest_card"; token: string; slug: string };

const toShortcodeSegment = (
  token: string,
): CampaignSessionMessageSegment | null => {
  if (token.startsWith("@encounter/")) {
    return {
      kind: "encounter_card",
      token,
      slug: token.slice("@encounter/".length),
    };
  }

  if (token.startsWith("@quest/")) {
    return {
      kind: "quest_card",
      token,
      slug: token.slice("@quest/".length),
    };
  }

  const parsed = parseLegacyGameCardToken(token);
  if (!parsed) {
    return null;
  }

  return {
    kind: "game_card",
    token,
    type: parsed.type,
    slug: parsed.slug,
    modifierSlug: parsed.modifierSlug,
  };
};

export const parseCampaignSessionMessageSegments = (
  value: string,
): CampaignSessionMessageSegment[] => {
  const segments: CampaignSessionMessageSegment[] = [];
  let cursor = 0;

  for (const match of value.matchAll(SHORTCODE_PATTERN)) {
    const token = match[0];
    const index = match.index ?? 0;

    if (index > cursor) {
      segments.push({
        kind: "text",
        text: value.slice(cursor, index),
      });
    }

    const shortcodeSegment = toShortcodeSegment(token);
    if (shortcodeSegment) {
      segments.push(shortcodeSegment);
    } else {
      segments.push({ kind: "text", text: token });
    }

    cursor = index + token.length;
  }

  if (cursor < value.length) {
    segments.push({
      kind: "text",
      text: value.slice(cursor),
    });
  }

  return segments.filter((segment) => segment.kind !== "text" || segment.text.length > 0);
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec tsx --test apps/web/src/lib/campaignSessionMessageSegments.test.ts`

Expected: PASS for both parsing tests.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/campaignSessionMessageSegments.ts apps/web/src/lib/campaignSessionMessageSegments.test.ts
git commit -m "feat: parse session chat shortcodes"
```

### Task 2: Render Parsed Chat Segments Inline

**Files:**
- Modify: `apps/web/src/lib/gameCardCatalogContext.tsx`
- Create: `apps/web/src/components/CampaignSessionMessageContent.tsx`
- Create: `apps/web/src/components/CampaignSessionMessageContent.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { GameCardCatalogContext } from "../lib/gameCardCatalogContext";
import { CampaignSessionMessageContent } from "./CampaignSessionMessageContent";

const contextValue = {
  ...createGameCardCatalogContextValue({
    actors: [],
    counters: [
      {
        fragmentId: "counter-1",
        slug: "threat-clock",
        title: "Threat Clock",
        iconSlug: "threat",
        currentValue: 2,
        maxValue: 6,
        description: "The city is about to notice.",
      },
    ],
    assets: [],
    encounters: [],
    quests: [
      {
        fragmentId: "quest-1",
        questSlug: "recover-the-shard",
        title: "Recover the Shard",
        summary: "Get the relic back before dawn.",
        titleImageUrl: "",
        content: "Recover the relic.",
      },
    ],
  }),
};

test("CampaignSessionMessageContent renders prose and inline cards in source order", () => {
  const markup = renderToStaticMarkup(
    <GameCardCatalogContext.Provider value={contextValue}>
      <CampaignSessionMessageContent text="Push @counter/threat-clock and follow @quest/recover-the-shard." />
    </GameCardCatalogContext.Provider>,
  );

  assert.match(markup, /Push/);
  assert.match(markup, /Threat Clock/);
  assert.match(markup, /Recover the Shard/);
  assert.match(markup, /follow/);
});

test("CampaignSessionMessageContent leaves unresolved shortcodes visible as plain text", () => {
  const markup = renderToStaticMarkup(
    <GameCardCatalogContext.Provider value={contextValue}>
      <CampaignSessionMessageContent text="Ask @actor/missing-guide for help." />
    </GameCardCatalogContext.Provider>,
  );

  assert.match(markup, /@actor\/missing-guide/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec tsx --test apps/web/src/components/CampaignSessionMessageContent.test.tsx`

Expected: FAIL because `CampaignSessionMessageContent.tsx` and `createGameCardCatalogContextValue` do not exist yet.

- [ ] **Step 3: Write minimal implementation**

```tsx
import { GameCardView } from "./adventure-module/GameCardView";
import {
  parseCampaignSessionMessageSegments,
} from "../lib/campaignSessionMessageSegments";
import { useGameCardCatalogContext } from "../lib/gameCardCatalogContext";
import { resolveGameCard } from "../lib/markdownGameComponents";
import { resolveEncounterCard } from "../lib/markdownEncounterComponents";
import { resolveQuestCard } from "../lib/markdownQuestComponents";
import { EncounterCardView } from "./adventure-module/EncounterCardView";
import { QuestCardView } from "./adventure-module/QuestCardView";

export const CampaignSessionMessageContent = ({
  text,
}: {
  text: string;
}): JSX.Element => {
  const {
    actorsBySlug,
    countersBySlug,
    assetsBySlug,
    encountersBySlug,
    questsBySlug,
  } = useGameCardCatalogContext();
  const segments = parseCampaignSessionMessageSegments(text);

  return (
    <div className="whitespace-pre-wrap break-words text-inherit">
      {segments.map((segment, index) => {
        if (segment.kind === "text") {
          return <span key={`text-${index}`}>{segment.text}</span>;
        }

        if (segment.kind === "game_card") {
          const resolved = resolveGameCard(
            segment.type,
            segment.slug,
            actorsBySlug,
            countersBySlug,
            assetsBySlug,
            segment.modifierSlug,
          );
          return resolved ? (
            <div key={`card-${index}`} className="my-1 inline-block max-w-full align-middle">
              <GameCardView gameCard={resolved} />
            </div>
          ) : (
            <span key={`fallback-${index}`}>{segment.token}</span>
          );
        }

        if (segment.kind === "encounter_card") {
          const resolved = resolveEncounterCard(segment.slug, encountersBySlug);
          return resolved ? (
            <div key={`encounter-${index}`} className="my-1 inline-block max-w-full align-middle">
              <EncounterCardView encounter={resolved.encounter} />
            </div>
          ) : (
            <span key={`fallback-${index}`}>{segment.token}</span>
          );
        }

        const resolved = resolveQuestCard(segment.slug, questsBySlug);
        return resolved ? (
          <div key={`quest-${index}`} className="my-1 inline-block max-w-full align-middle">
            <QuestCardView quest={resolved.quest} />
          </div>
        ) : (
          <span key={`fallback-${index}`}>{segment.token}</span>
        );
      })}
    </div>
  );
};
```

```ts
export const createGameCardCatalogContextValue = ({
  actors = [],
  counters = [],
  assets = [],
  encounters = [],
  quests = [],
}: {
  actors?: readonly AdventureModuleResolvedActor[];
  counters?: readonly AdventureModuleResolvedCounter[];
  assets?: readonly AdventureModuleResolvedAsset[];
  encounters?: readonly AdventureModuleResolvedEncounter[];
  quests?: readonly AdventureModuleResolvedQuest[];
}): GameCardCatalogContextValue => ({
  actors,
  actorsBySlug: new Map(actors.map((actor) => [actor.actorSlug.toLocaleLowerCase(), actor])),
  counters,
  countersBySlug: new Map(counters.map((counter) => [counter.slug.toLocaleLowerCase(), counter])),
  assets,
  assetsBySlug: new Map(assets.map((asset) => [asset.assetSlug.toLocaleLowerCase(), asset])),
  encounters,
  encountersBySlug: new Map(
    encounters.map((encounter) => [encounter.encounterSlug.toLocaleLowerCase(), encounter]),
  ),
  quests,
  questsBySlug: new Map(quests.map((quest) => [quest.questSlug.toLocaleLowerCase(), quest])),
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec tsx --test apps/web/src/components/CampaignSessionMessageContent.test.tsx`

Expected: PASS, with prose and card titles present in the rendered markup and unresolved tokens preserved.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/gameCardCatalogContext.tsx apps/web/src/components/CampaignSessionMessageContent.tsx apps/web/src/components/CampaignSessionMessageContent.test.tsx
git commit -m "feat: render session chat shortcodes inline"
```

### Task 3: Wire Player And Storyteller Chat Surfaces

**Files:**
- Modify: `apps/web/src/routes/CampaignSessionPlayerPage.tsx`
- Modify: `apps/web/src/routes/CampaignAuthoringPage.tsx`
- Modify: `apps/web/src/routes/CampaignSessionPages.test.ts`
- Modify: `apps/web/src/routes/CampaignAuthoringPage.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("CampaignSessionPlayerPage uses the shared shortcode-aware transcript renderer", () => {
  const source = readFileSync(
    new URL("./CampaignSessionPlayerPage.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /CampaignSessionMessageContent/);
  assert.match(source, /GameCardCatalogContext\.Provider/);
});
```

```ts
test("CampaignAuthoringPage uses the shared shortcode-aware transcript renderer in storyteller chat", () => {
  const source = readFileSync(
    new URL("./CampaignAuthoringPage.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /CampaignSessionMessageContent/);
  assert.match(source, /GameCardCatalogContext\.Provider/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec tsx --test apps/web/src/routes/CampaignSessionPages.test.ts apps/web/src/routes/CampaignAuthoringPage.test.ts`

Expected: FAIL because the routes still render `entry.text` directly and do not provide card catalog context.

- [ ] **Step 3: Write minimal implementation**

```tsx
const gameCardCatalogValue = useMemo(
  () =>
    createGameCardCatalogContextValue({
      actors: campaign?.actors ?? [],
      counters: campaign?.counters ?? [],
      assets: campaign?.assets ?? [],
      encounters: campaign?.encounters ?? [],
      quests: campaign?.quests ?? [],
    }),
  [
    campaign?.actors,
    campaign?.assets,
    campaign?.counters,
    campaign?.encounters,
    campaign?.quests,
  ],
);
```

```tsx
<GameCardCatalogContext.Provider value={gameCardCatalogValue}>
  <div className="stack gap-3">
    {(session?.transcript ?? []).map((entry) => (
      <div key={entry.entryId} className="stack gap-1">
        <Text variant="note" color="steel-dark" className="text-xs">
          {entry.authorDisplayName
            ? `${entry.authorDisplayName} (${entry.authorRole})`
            : "System"}
        </Text>
        <CampaignSessionMessageContent text={entry.text} />
      </div>
    ))}
  </div>
</GameCardCatalogContext.Provider>
```

```tsx
<GameCardCatalogContext.Provider value={storytellerGameCardCatalogValue}>
  <div className="stack gap-3">
    {(storytellerSession?.transcript ?? []).map((entry) => (
      <Message
        key={entry.entryId}
        label={
          entry.authorDisplayName
            ? `${entry.authorDisplayName} (${entry.authorRole})`
            : "System"
        }
        color={
          entry.authorRole === "storyteller"
            ? "gold"
            : entry.authorRole === "player"
              ? "fire"
              : "cloth"
        }
        contentClassName="stack gap-1"
      >
        <CampaignSessionMessageContent text={entry.text} />
      </Message>
    ))}
  </div>
</GameCardCatalogContext.Provider>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec tsx --test apps/web/src/routes/CampaignSessionPages.test.ts apps/web/src/routes/CampaignAuthoringPage.test.ts`

Expected: PASS, with both route sources referencing the shared renderer and catalog provider.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/routes/CampaignSessionPlayerPage.tsx apps/web/src/routes/CampaignAuthoringPage.tsx apps/web/src/routes/CampaignSessionPages.test.ts apps/web/src/routes/CampaignAuthoringPage.test.ts
git commit -m "feat: use shortcode-aware rendering in campaign chat"
```

### Task 4: Verify And Document The Behavior Change

**Files:**
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Write the failing documentation check**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

test("CHANGELOG mentions inline campaign session chat shortcode rendering", () => {
  const source = readFileSync(new URL("../../CHANGELOG.md", import.meta.url), "utf8");
  assert.match(source, /session chat shortcodes/i);
});
```

- [ ] **Step 2: Run check to verify it fails**

Run: `pnpm exec tsx --test apps/web/src/routes/CampaignSessionPages.test.ts`

Expected: FAIL until the changelog entry is added or the assertion target file is created as a dedicated documentation test.

- [ ] **Step 3: Write minimal documentation update**

```md
## [Unreleased]

### Added

- render supported shortcode cards inline inside campaign session chat messages, including multiple shortcodes in one message
```

- [ ] **Step 4: Run focused verification**

Run: `pnpm exec tsx --test apps/web/src/lib/campaignSessionMessageSegments.test.ts apps/web/src/components/CampaignSessionMessageContent.test.tsx apps/web/src/routes/CampaignSessionPages.test.ts apps/web/src/routes/CampaignAuthoringPage.test.ts`

Expected: PASS

Run: `pnpm -C apps/web typecheck`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add CHANGELOG.md
git commit -m "docs: note session chat shortcode rendering"
```
