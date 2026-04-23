import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { AdventureModuleListItem } from "@mighty-decks/spec/adventureModuleAuthoring";
import { AdventureModuleCard } from "../components/adventure-module/AdventureModuleCard";
import { ShortcodeField } from "../components/adventure-module/ShortcodeField";
import { Button } from "../components/common/Button";
import { ConfirmationDialog } from "../components/common/ConfirmationDialog";
import { CTAButton } from "../components/common/CTAButton";
import { Heading } from "../components/common/Heading";
import { Message } from "../components/common/Message";
import { Panel } from "../components/common/Panel";
import { PendingIndicator } from "../components/PendingIndicator";
import { ResponsiveCardGrid } from "../components/common/ResponsiveCardGrid";
import { SearchField } from "../components/common/SearchField";
import { Text } from "../components/common/Text";
import {
  deleteAdventureModule,
  listAdventureModules,
} from "../lib/adventureModuleApi";
import { getAdventureModuleCreatorToken } from "../lib/adventureModuleIdentity";
import { useConfirmationDialog } from "../hooks/useConfirmationDialog";

const PAGE_SIZE = 20;
const normalize = (value: string): string => value.trim().toLowerCase();

const matchesSearch = (module: AdventureModuleListItem, searchTerm: string): boolean => {
  if (!searchTerm) {
    return true;
  }

  const haystack = [
    module.title,
    module.summary,
    module.authorLabel,
    ...module.tags,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(searchTerm);
};

const compareModules = (left: AdventureModuleListItem, right: AdventureModuleListItem): number => {
  if (left.ownedByRequester !== right.ownedByRequester) {
    return left.ownedByRequester ? -1 : 1;
  }

  const createdCompare = right.createdAtIso.localeCompare(left.createdAtIso);
  if (createdCompare !== 0) {
    return createdCompare;
  }

  return right.updatedAtIso.localeCompare(left.updatedAtIso);
};

const TrashIcon = (): JSX.Element => (
  <svg
    viewBox="0 0 24 24"
    className="h-3.5 w-3.5 fill-none stroke-current"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M3 6h18" />
    <path d="M8 6V4h8v2" />
    <path d="M6 6l1 14h10l1-14" />
    <path d="M10 10v7" />
    <path d="M14 10v7" />
  </svg>
);

export const AdventureModuleListPage = (): JSX.Element => {
  const navigate = useNavigate();
  const creatorToken = useMemo(() => getAdventureModuleCreatorToken(), []);
  const [modules, setModules] = useState<AdventureModuleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const { confirmation, requestConfirmation } = useConfirmationDialog();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    void listAdventureModules(creatorToken)
      .then((nextModules) => {
        if (cancelled) {
          return;
        }
        setModules(nextModules);
      })
      .catch((loadError) => {
        if (cancelled) {
          return;
        }
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load adventure modules.",
        );
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [creatorToken]);

  const normalizedSearchTerm = normalize(searchTerm);

  const sortedAndFilteredModules = useMemo(
    () =>
      modules
        .slice()
        .sort(compareModules)
        .filter((module) => matchesSearch(module, normalizedSearchTerm)),
    [modules, normalizedSearchTerm],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [normalizedSearchTerm]);

  const pageCount = Math.max(1, Math.ceil(sortedAndFilteredModules.length / PAGE_SIZE));

  useEffect(() => {
    setCurrentPage((current) => Math.min(current, pageCount));
  }, [pageCount]);

  const effectivePage = Math.min(currentPage, pageCount);
  const pageStart = (effectivePage - 1) * PAGE_SIZE;
  const visibleModules = sortedAndFilteredModules.slice(pageStart, pageStart + PAGE_SIZE);

  const handleDeleteModule = (module: AdventureModuleListItem): void => {
    requestConfirmation({
      title: `Delete "${module.title}"?`,
      description:
        "This removes the module from your list immediately. Archived or draft content tied to this module will no longer be available from the current UI.",
      confirmLabel: "Delete Module",
      confirmColor: "blood",
      onConfirm: async () => {
        try {
          await deleteAdventureModule(module.moduleId, creatorToken);
          setModules((current) =>
            current.filter((candidate) => candidate.moduleId !== module.moduleId),
          );
          setError(null);
        } catch (deleteError) {
          setError(
            deleteError instanceof Error
              ? deleteError.message
              : "Could not delete adventure module.",
          );
          throw deleteError;
        }
      },
    });
  };

  return (
    <div className="app-shell stack py-8 gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Heading
            level="h1"
            color="iron"
            className="relative z-0 text-[2.4rem] leading-none sm:text-[3.4rem] sm:leading-none"
            highlightProps={{
              color: "gold",
              lineHeight: 8,
              brushHeight: 6,
              lineOffsets: [0, 8, 14, 20],
              className:
                "left-1/2 bottom-[0.08em] h-[0.5em] w-[calc(100%+0.22em)] -translate-x-1/2",
            }}
          >
            Adventure Modules
          </Heading>
          <Text
            variant="body"
            color="iron-light"
            className="relative z-10 mt-3 text-sm"
          >
            Browse and start authored adventures.
          </Text>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CTAButton
            color="gold"
            onClick={() => navigate("/adventure-module/new")}
          >
            Create Module
          </CTAButton>
          <ShortcodeField
            shortcode={creatorToken}
            showShortcode={false}
            copyLabel="Copy author token"
            copiedLabel="Copied author token"
            copyButtonText="Copy Author Token"
            copiedButtonText="Author Token Copied"
            copyButtonVariant="ghost"
            copyButtonColor="cloth"
          />
        </div>
      </div>

      <SearchField
        label="Search Modules"
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
        placeholder="Search by title, summary, author, or tag..."
      />

      {error ? (
        <Message label="Error" color="blood">
          {error}
        </Message>
      ) : null}

      {confirmation ? <ConfirmationDialog {...confirmation} /> : null}

      {loading ? (
        <Panel contentClassName="flex justify-center">
          <PendingIndicator label="Loading modules" color="cloth" />
        </Panel>
      ) : visibleModules.length > 0 ? (
        <>
          <ResponsiveCardGrid>
            {visibleModules.map((module) => (
              <div key={module.moduleId} className="relative h-full">
                <AdventureModuleCard module={module} />
                {module.ownedByRequester ? (
                  <Button
                    variant="circle"
                    color="blood"
                    size="sm"
                    aria-label={`Delete ${module.title}`}
                    title={`Delete ${module.title}`}
                    className="absolute bottom-4 right-4 z-20"
                    onClick={() => {
                      handleDeleteModule(module);
                    }}
                  >
                    <TrashIcon />
                  </Button>
                ) : null}
              </div>
            ))}
          </ResponsiveCardGrid>

          <div className="flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              color="cloth"
              disabled={effectivePage <= 1}
              onClick={() => setCurrentPage((current) => Math.max(1, current - 1))}
            >
              Prev
            </Button>
            <Text variant="body" color="iron-light" className="text-sm">
              Page {effectivePage} / {pageCount} ({sortedAndFilteredModules.length} modules)
            </Text>
            <Button
              variant="ghost"
              color="cloth"
              disabled={effectivePage >= pageCount}
              onClick={() =>
                setCurrentPage((current) => Math.min(pageCount, current + 1))
              }
            >
              Next
            </Button>
          </div>
        </>
      ) : (
        <Panel>
          <Text variant="body" color="iron-light">
            {sortedAndFilteredModules.length === 0 && modules.length > 0
              ? "No modules match your search."
              : "No modules found yet."}
          </Text>
        </Panel>
      )}
    </div>
  );
};
