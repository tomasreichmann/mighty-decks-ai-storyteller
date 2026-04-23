import { useEffect, useMemo, useState } from "react";
import type { CampaignListItem } from "@mighty-decks/spec/campaign";
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
import { CampaignListCard } from "../components/campaign/CampaignListCard";
import { deleteCampaign, listCampaigns } from "../lib/campaignApi";
import { getAdventureModuleCreatorToken } from "../lib/adventureModuleIdentity";
import { useConfirmationDialog } from "../hooks/useConfirmationDialog";

const PAGE_SIZE = 20;

const normalize = (value: string): string => value.trim().toLowerCase();

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

export const CampaignListPage = (): JSX.Element => {
  const creatorToken = useMemo(() => getAdventureModuleCreatorToken(), []);
  const [campaigns, setCampaigns] = useState<CampaignListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const { confirmation, requestConfirmation } = useConfirmationDialog();

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

  const handleDeleteCampaign = (campaign: CampaignListItem): void => {
    requestConfirmation({
      title: `Delete "${campaign.title}"?`,
      description:
        "This removes the campaign and its saved authored content from the current UI. Existing sessions under this campaign will also be removed.",
      confirmLabel: "Delete Campaign",
      confirmColor: "blood",
      onConfirm: async () => {
        try {
          await deleteCampaign(campaign.campaignId, creatorToken);
          setCampaigns((current) =>
            current.filter((candidate) => candidate.campaignId !== campaign.campaignId),
          );
          setError(null);
        } catch (deleteError) {
          setError(
            deleteError instanceof Error
              ? deleteError.message
              : "Could not delete campaign.",
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
        <div className="flex flex-wrap items-center gap-2">
          <CTAButton color="gold" href="/adventure-module/list">
            Create Campaign
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
        label="Search Campaigns"
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
        placeholder="Search by title, summary, source module, or slug..."
      />

      {error ? (
        <Message label="Error" color="blood">
          {error}
        </Message>
      ) : null}

      {confirmation ? <ConfirmationDialog {...confirmation} /> : null}

      {loading ? (
        <Panel contentClassName="flex justify-center">
          <PendingIndicator label="Loading campaigns" color="cloth" />
        </Panel>
      ) : visibleCampaigns.length > 0 ? (
        <>
          <ResponsiveCardGrid>
            {visibleCampaigns.map((campaign) => (
              <div key={campaign.campaignId} className="relative h-full">
                <CampaignListCard campaign={campaign} />
                <Button
                  variant="circle"
                  color="blood"
                  size="sm"
                  aria-label={`Delete ${campaign.title}`}
                  title={`Delete ${campaign.title}`}
                  className="absolute bottom-4 right-4 z-20"
                  onClick={() => {
                    handleDeleteCampaign(campaign);
                  }}
                >
                  <TrashIcon />
                </Button>
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
