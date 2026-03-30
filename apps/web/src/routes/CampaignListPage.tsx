import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { CampaignListItem } from "@mighty-decks/spec/campaign";
import { Button } from "../components/common/Button";
import { DepressedInput } from "../components/common/DepressedInput";
import { Heading } from "../components/common/Heading";
import { Message } from "../components/common/Message";
import { Panel } from "../components/common/Panel";
import { Text } from "../components/common/Text";
import { listCampaigns } from "../lib/campaignApi";

const PAGE_SIZE = 20;
const FALLBACK_IMAGE_URL = "/sample-scene-image.png";

const normalize = (value: string): string => value.trim().toLowerCase();

const formatDate = (value: string): string => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const matchesSearch = (
  campaign: CampaignListItem,
  searchTerm: string,
): boolean => {
  if (!searchTerm) {
    return true;
  }

  const haystack = [
    campaign.title,
    campaign.summary,
    campaign.sourceModuleTitle,
    campaign.slug,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(searchTerm);
};

const compareCampaigns = (
  left: CampaignListItem,
  right: CampaignListItem,
): number => {
  const activeCompare = right.activeSessionCount - left.activeSessionCount;
  if (activeCompare !== 0) {
    return activeCompare;
  }

  return right.updatedAtIso.localeCompare(left.updatedAtIso);
};

export const CampaignListPage = (): JSX.Element => {
  const [campaigns, setCampaigns] = useState<CampaignListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    void listCampaigns()
      .then((nextCampaigns) => {
        if (cancelled) {
          return;
        }
        setCampaigns(nextCampaigns);
      })
      .catch((loadError) => {
        if (cancelled) {
          return;
        }
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load campaigns.",
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

  const sortedAndFilteredCampaigns = useMemo(
    () =>
      campaigns
        .slice()
        .sort(compareCampaigns)
        .filter((campaign) => matchesSearch(campaign, normalizedSearchTerm)),
    [campaigns, normalizedSearchTerm],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [normalizedSearchTerm]);

  const pageCount = Math.max(1, Math.ceil(sortedAndFilteredCampaigns.length / PAGE_SIZE));

  useEffect(() => {
    setCurrentPage((current) => Math.min(current, pageCount));
  }, [pageCount]);

  const effectivePage = Math.min(currentPage, pageCount);
  const pageStart = (effectivePage - 1) * PAGE_SIZE;
  const visibleCampaigns = sortedAndFilteredCampaigns.slice(
    pageStart,
    pageStart + PAGE_SIZE,
  );

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
            Campaigns
          </Heading>
          <Text
            variant="body"
            color="iron-light"
            className="relative z-10 mt-3 text-sm"
          >
            A campaign is a playable fork of an adventure module where your
            group can open sessions, claim characters, and build an ongoing
            shared story.
          </Text>
        </div>
      </div>

      <div>
        <DepressedInput
          label="Search Campaigns"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search by title, summary, source module, or slug..."
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
            Loading campaigns...
          </Text>
        </Panel>
      ) : visibleCampaigns.length > 0 ? (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            {visibleCampaigns.map((campaign) => (
              <Panel
                key={campaign.campaignId}
                className="h-full"
                contentClassName="stack gap-3 h-full"
              >
                <div className="flex gap-4">
                  <img
                    src={campaign.coverImageUrl ?? FALLBACK_IMAGE_URL}
                    alt={`${campaign.title} cover`}
                    className="h-28 w-24 shrink-0 rounded-sm border-2 border-kac-iron object-cover shadow-[2px_2px_0_0_#121b23]"
                  />
                  <div className="stack gap-1">
                    <Text variant="h3" color="iron">
                      {campaign.title}
                    </Text>
                    <Text variant="body" color="iron-light" className="text-sm">
                      {campaign.summary}
                    </Text>
                    <Text variant="note" color="steel-dark" className="text-xs">
                      Source Module: {campaign.sourceModuleTitle}
                    </Text>
                    <Text variant="note" color="steel-dark" className="text-xs">
                      Active sessions: {campaign.activeSessionCount}
                    </Text>
                    <Text variant="note" color="steel-dark" className="text-xs">
                      Total sessions: {campaign.sessionCount}
                    </Text>
                    <Text variant="note" color="steel-dark" className="text-xs">
                      Updated: {formatDate(campaign.updatedAtIso)}
                    </Text>
                  </div>
                </div>
                <div className="mt-auto flex flex-wrap items-center gap-2">
                  <Link
                    to={`/campaign/${encodeURIComponent(campaign.slug)}/base`}
                    className="no-underline"
                  >
                    <Button color="gold">Open Campaign</Button>
                  </Link>
                  <Link
                    to={`/campaign/${encodeURIComponent(campaign.slug)}/sessions`}
                    className="no-underline"
                  >
                    <Button variant="ghost" color="cloth">
                      View Sessions
                    </Button>
                  </Link>
                </div>
              </Panel>
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
              Page {effectivePage} / {pageCount} ({sortedAndFilteredCampaigns.length} campaigns)
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
            {sortedAndFilteredCampaigns.length === 0 && campaigns.length > 0
              ? "No campaigns match your search."
              : "No campaigns created yet. Start from an adventure module to fork one."}
          </Text>
        </Panel>
      )}
    </div>
  );
};
