import { useEffect, useMemo } from "react";
import type {
  WorldbuildingProposal,
  WorldbuildingResult,
} from "@mighty-decks/spec/campaign";
import { Board } from "../board/Board";
import { BoardFrame } from "../board/BoardFrame";
import { BoardProvider, useBoard } from "../board/BoardProvider";
import type { BoardItemInput, BoardItemRecord } from "../../lib/board/boardController";
import { flexLayout, stackLayout } from "../../lib/board/boardLayout";
import { cn } from "../../utils/cn";

const boardSize = {
  width: 1800,
  height: 1200,
};

const cardSize = {
  width: 260,
  height: 150,
};

const proposalColors: Record<WorldbuildingProposal["kind"], string> = {
  theme: "border-kac-gold-dark bg-kac-bone-light text-kac-iron",
  motif: "border-kac-cloth-dark bg-kac-cloth-light/80 text-kac-iron",
  location: "border-kac-steel bg-kac-bone-light text-kac-iron",
  actor: "border-kac-blood bg-kac-bone-light text-kac-iron",
  asset: "border-kac-gold bg-kac-bone-light text-kac-iron",
  encounter: "border-kac-fire bg-kac-bone-light text-kac-iron",
  quest: "border-kac-curse bg-kac-bone-light text-kac-iron",
  relationship: "border-kac-iron/40 bg-kac-bone-light text-kac-iron",
};

const proposalLabel: Record<WorldbuildingProposal["kind"], string> = {
  theme: "Theme",
  motif: "Motif",
  location: "Location",
  actor: "Actor",
  asset: "Asset",
  encounter: "Encounter",
  quest: "Quest",
  relationship: "Link",
};

const createItemId = (proposal: WorldbuildingProposal): string =>
  `worldbuilding-${proposal.proposalId}`;

const ThemeCard = ({ proposal }: { proposal: WorldbuildingProposal }): JSX.Element => (
  <article className="h-full rounded-sm border-2 border-kac-gold-dark bg-kac-gold-light p-3 text-kac-iron shadow-[0_8px_0_rgba(48,36,23,0.16)]">
    <div className="text-xs font-bold uppercase tracking-[0.08em]">Main Theme</div>
    <h3 className="mt-2 text-lg font-bold leading-tight">{proposal.title}</h3>
    <p className="mt-2 line-clamp-3 text-sm leading-snug">{proposal.summary}</p>
  </article>
);

const MotifCard = ({ proposal }: { proposal: WorldbuildingProposal }): JSX.Element => (
  <article
    className={cn(
      "h-full rounded-sm border-2 p-3 shadow-[0_6px_0_rgba(48,36,23,0.12)]",
      proposal.stance === "avoid"
        ? "border-kac-blood bg-kac-blood-light/15"
        : "border-kac-cloth-dark bg-kac-cloth-light/80",
    )}
  >
    <div className="text-xs font-bold uppercase tracking-[0.08em]">
      {proposal.stance === "avoid" ? "Avoid" : "Must Have"}
    </div>
    <h3 className="mt-2 text-base font-bold leading-tight">{proposal.title}</h3>
    <p className="mt-2 line-clamp-3 text-sm leading-snug">{proposal.summary}</p>
  </article>
);

const WorldbuildingProposalCard = ({
  proposal,
}: {
  proposal: WorldbuildingProposal;
}): JSX.Element => (
  <article
    className={cn(
      "h-full rounded-sm border-2 p-3 shadow-[0_8px_0_rgba(48,36,23,0.12)]",
      proposalColors[proposal.kind],
      proposal.status === "rejected" ? "opacity-55 grayscale" : "",
    )}
  >
    <div className="flex items-center justify-between gap-2 text-xs font-bold uppercase tracking-[0.08em]">
      <span>{proposalLabel[proposal.kind]}</span>
      <span>{proposal.status}</span>
    </div>
    <h3 className="mt-2 text-base font-bold leading-tight">{proposal.title}</h3>
    <p className="mt-2 line-clamp-3 text-sm leading-snug">{proposal.summary}</p>
  </article>
);

const createWorldbuildingItems = (
  result: WorldbuildingResult | null | undefined,
): BoardItemInput[] =>
  (result?.proposals ?? []).map((proposal) => ({
    id: createItemId(proposal),
    kind: "card",
    x: 0,
    y: 0,
    width: cardSize.width,
    height: proposal.kind === "theme" ? 170 : cardSize.height,
    title: proposal.title,
    body: proposal.summary,
    zIndex: proposal.kind === "theme" ? 20 : 10,
  }));

const createWorldbuildingLayout = (result: WorldbuildingResult) => {
  const theme = result.proposals.find((proposal) => proposal.kind === "theme");
  const mustHave = result.proposals.filter(
    (proposal) => proposal.kind === "motif" && proposal.stance !== "avoid",
  );
  const avoid = result.proposals.filter(
    (proposal) => proposal.kind === "motif" && proposal.stance === "avoid",
  );
  const locations = result.proposals.filter((proposal) => proposal.kind === "location");
  const pressure = result.proposals.filter(
    (proposal) => proposal.kind === "quest" || proposal.kind === "encounter",
  );
  const peopleAndAssets = result.proposals.filter(
    (proposal) =>
      proposal.kind === "actor" ||
      proposal.kind === "asset" ||
      proposal.kind === "relationship",
  );

  const stackFor = (
    proposals: readonly WorldbuildingProposal[],
    x: number,
    y: number,
  ) =>
    stackLayout(
      proposals.map((proposal) => ({
        id: createItemId(proposal),
        width: cardSize.width,
        height: cardSize.height,
      })),
      {
        x,
        y,
        offset: { x: 0, y: 42 },
        zIndexStart: 10,
        zIndexStep: 3,
      },
    );

  const layouts = [
    ...(theme
      ? [
          stackLayout(
            [
              {
                id: createItemId(theme),
                width: 360,
                height: 170,
                zIndex: 40,
              },
            ],
            { x: 720, y: 80, zIndexStart: 40 },
          ),
        ]
      : []),
    stackFor(mustHave, 330, 120),
    stackFor(avoid, 1210, 120),
    flexLayout(
      locations.map((proposal) => ({
        id: createItemId(proposal),
        width: cardSize.width,
        height: cardSize.height,
      })),
      { direction: "column", x: 250, y: 430, rowGap: 24 },
    ),
    flexLayout(
      pressure.map((proposal) => ({
        id: createItemId(proposal),
        width: 300,
        height: cardSize.height,
      })),
      { direction: "column", x: 750, y: 390, rowGap: 24 },
    ),
    flexLayout(
      peopleAndAssets.map((proposal) => ({
        id: createItemId(proposal),
        width: cardSize.width,
        height: cardSize.height,
      })),
      { direction: "column", x: 1230, y: 430, rowGap: 24 },
    ),
  ];

  return {
    placements: layouts.flatMap((layout) => layout.placements),
    bounds: {
      x: 180,
      y: 40,
      width: 1450,
      height: 980,
    },
  };
};

const WorldbuildingBoardCanvas = ({
  result,
}: {
  result: WorldbuildingResult;
}): JSX.Element => {
  const controller = useBoard();
  const proposalsByItemId = useMemo(
    () =>
      new Map(
        result.proposals.map((proposal) => [createItemId(proposal), proposal] as const),
      ),
    [result.proposals],
  );

  useEffect(() => {
    for (const item of createWorldbuildingItems(result)) {
      controller.upsertItem(item);
    }
    const layout = createWorldbuildingLayout(result);
    controller.applyLayout(layout, { smooth: true, durationMs: 220 });
    window.requestAnimationFrame(() => {
      controller.fitItems(undefined, { smooth: true, durationMs: 240 });
    });
  }, [controller, result]);

  return (
    <Board
      renderItem={(item: BoardItemRecord) => {
        const proposal = proposalsByItemId.get(item.id);
        if (!proposal) {
          return null;
        }
        if (proposal.kind === "theme") {
          return <ThemeCard proposal={proposal} />;
        }
        if (proposal.kind === "motif") {
          return <MotifCard proposal={proposal} />;
        }
        return <WorldbuildingProposalCard proposal={proposal} />;
      }}
    />
  );
};

export const WorldbuildingBoard = ({
  result,
  className,
}: {
  result: WorldbuildingResult | null | undefined;
  className?: string;
}): JSX.Element => {
  const initialItems = useMemo(() => createWorldbuildingItems(result), [result]);

  if (!result || result.proposals.length === 0) {
    return (
      <div
        className={cn(
          "grid min-h-[24rem] place-items-center rounded-sm border-2 border-dashed border-kac-iron/25 bg-kac-bone-light/70 p-6 text-center text-kac-iron",
          className,
        )}
      >
        Worldbuilding cards will appear here after the table commits a theme,
        motifs, and proposals.
      </div>
    );
  }

  return (
    <div className={cn("min-h-[28rem] overflow-hidden rounded-sm border-2 border-kac-iron/20", className)}>
      <BoardProvider boardSize={boardSize} initialItems={initialItems}>
        <BoardFrame className="min-h-[28rem] border-0 bg-kac-iron/90">
          <WorldbuildingBoardCanvas result={result} />
        </BoardFrame>
      </BoardProvider>
    </div>
  );
};
