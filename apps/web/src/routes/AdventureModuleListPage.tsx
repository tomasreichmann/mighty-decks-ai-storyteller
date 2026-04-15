import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { AdventureModuleListItem } from "@mighty-decks/spec/adventureModuleAuthoring";
import { AdventureModuleCard } from "../components/adventure-module/AdventureModuleCard";
import { ShortcodeField } from "../components/adventure-module/ShortcodeField";
import { Button } from "../components/common/Button";
import { CTAButton } from "../components/common/CTAButton";
import { DepressedInput } from "../components/common/DepressedInput";
import { Heading } from "../components/common/Heading";
import { Message } from "../components/common/Message";
import { Panel } from "../components/common/Panel";
import { Text } from "../components/common/Text";
import { listAdventureModules } from "../lib/adventureModuleApi";
import { getAdventureModuleCreatorToken } from "../lib/adventureModuleIdentity";

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

export const AdventureModuleListPage = (): JSX.Element => {
  const navigate = useNavigate();
  const creatorToken = useMemo(() => getAdventureModuleCreatorToken(), []);
  const [modules, setModules] = useState<AdventureModuleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

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

  return (
    <div className="app-shell stack py-8 gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Heading
            variant="h1"
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

      <div>
        <DepressedInput
          label="Search Modules"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search by title, summary, author, or tag..."
        />
      </div>

      {error ? (
        <Message label="Error" color="blood">
          {error}
        </Message>
      ) : null}

      {loading ? (
        <Panel>
          <Text variant="body" color="iron-light">
            Loading modules...
          </Text>
        </Panel>
      ) : visibleModules.length > 0 ? (
        <>
          <div className="grid gap-4 lg:[grid-template-columns:repeat(auto-fit,minmax(20rem,30rem))]">
            {visibleModules.map((module) => (
              <AdventureModuleCard key={module.moduleId} module={module} />
            ))}
          </div>

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
