import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { AdventureModuleListItem } from "@mighty-decks/spec/adventureModuleAuthoring";
import { AdventureModuleCard } from "../components/adventure-module/AdventureModuleCard";
import { Button } from "../components/common/Button";
import { DepressedInput } from "../components/common/DepressedInput";
import { Message } from "../components/common/Message";
import { Panel } from "../components/common/Panel";
import { Text } from "../components/common/Text";
import { listAdventureModules } from "../lib/adventureModuleApi";
import { getAdventureModuleCreatorToken } from "../lib/adventureModuleIdentity";
import { createCampaign } from "../lib/campaignApi";

const PAGE_SIZE = 20;
const FALLBACK_IMAGE_URL = "/sample-scene-image.png";

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
  const [modules, setModules] = useState<AdventureModuleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [campaignError, setCampaignError] = useState<string | null>(null);
  const [creatingCampaignModuleId, setCreatingCampaignModuleId] = useState<
    string | null
  >(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const creatorToken = getAdventureModuleCreatorToken();
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
  }, []);

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

  const handleCreateCampaign = async (
    module: AdventureModuleListItem,
  ): Promise<void> => {
    setCampaignError(null);
    setCreatingCampaignModuleId(module.moduleId);

    try {
      const campaign = await createCampaign({
        sourceModuleId: module.moduleId,
        title: module.title,
        slug: module.slug,
      });
      navigate(`/campaign/${encodeURIComponent(campaign.index.slug)}/base`);
    } catch (createError) {
      setCampaignError(
        createError instanceof Error
          ? createError.message
          : "Could not create campaign.",
      );
    } finally {
      setCreatingCampaignModuleId(null);
    }
  };

  return (
    <div className="app-shell stack py-8 gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Text variant="h2" color="iron">
            Adventure Modules
          </Text>
          <Text variant="body" color="iron-light" className="text-sm">
            Browse and start authored adventures.
          </Text>
        </div>
        <Button color="gold" onClick={() => navigate("/adventure-module/new")}>
          Create Module
        </Button>
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
      {campaignError ? (
        <Message label="Campaign Error" color="blood">
          {campaignError}
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
          <div className="flex flex-wrap gap-4">
            {visibleModules.map((module) => (
              <div key={module.moduleId} className="stack gap-2">
                <Link
                  to={`/adventure-module/${encodeURIComponent(module.slug)}/player-info`}
                  className="block rounded-sm no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kac-gold-dark/60"
                >
                  <AdventureModuleCard
                    moduleId={module.moduleId}
                    name={module.title}
                    imageUrl={module.coverImageUrl ?? FALLBACK_IMAGE_URL}
                    author={module.authorLabel}
                    createdAtIso={module.createdAtIso}
                    tags={module.tags}
                  />
                </Link>
                <Button
                  variant="ghost"
                  color="gold"
                  disabled={creatingCampaignModuleId === module.moduleId}
                  onClick={() => {
                    void handleCreateCampaign(module);
                  }}
                >
                  {creatingCampaignModuleId === module.moduleId
                    ? "Creating Campaign..."
                    : "Create Campaign"}
                </Button>
              </div>
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
