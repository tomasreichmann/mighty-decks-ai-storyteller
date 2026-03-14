import test from "node:test";
import assert from "node:assert/strict";

import { getInlineGameCardFlowPlacement } from "./gameCardFlowImport";

test("getInlineGameCardFlowPlacement joins consecutive GameCards on the same source line", () => {
  const siblings = [
    {
      type: "mdxJsxFlowElement",
      name: "GameCard",
      position: {
        end: {
          line: 3,
          offset: 64,
        },
      },
    },
    {
      type: "mdxJsxFlowElement",
      name: "GameCard",
      position: {
        start: {
          line: 3,
          offset: 65,
        },
      },
    },
  ];

  assert.deepEqual(getInlineGameCardFlowPlacement(siblings, 1), {
    joinPreviousParagraph: true,
    separatorText: " ",
  });
});

test("getInlineGameCardFlowPlacement keeps same-card lines separate when the previous sibling is on another line", () => {
  const siblings = [
    {
      type: "mdxJsxFlowElement",
      name: "GameCard",
      position: {
        end: {
          line: 3,
          offset: 64,
        },
      },
    },
    {
      type: "mdxJsxFlowElement",
      name: "GameCard",
      position: {
        start: {
          line: 4,
          offset: 65,
        },
      },
    },
  ];

  assert.deepEqual(getInlineGameCardFlowPlacement(siblings, 1), {
    joinPreviousParagraph: false,
    separatorText: "",
  });
});

test("getInlineGameCardFlowPlacement ignores non-GameCard siblings", () => {
  const siblings = [
    {
      type: "paragraph",
      position: {
        end: {
          line: 3,
          offset: 64,
        },
      },
    },
    {
      type: "mdxJsxFlowElement",
      name: "GameCard",
      position: {
        start: {
          line: 3,
          offset: 65,
        },
      },
    },
  ];

  assert.deepEqual(getInlineGameCardFlowPlacement(siblings, 1), {
    joinPreviousParagraph: false,
    separatorText: "",
  });
});
