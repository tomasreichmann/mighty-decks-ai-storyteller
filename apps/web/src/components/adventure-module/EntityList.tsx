import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "../common/Button";
import { DepressedInput } from "../common/DepressedInput";
import { ImageCard } from "../common/ImageCard";
import { Message } from "../common/Message";
import { Panel } from "../common/Panel";
import { Text } from "../common/Text";
import { ShortcodeField } from "./ShortcodeField";

export type EntityListTab =
  | "actors"
  | "locations"
  | "encounters"
  | "quests";

export interface EntityListItem {
  slug: string;
  title: string;
  description: string;
  imageUrl: string;
}

interface EntityListProps {
  tab: EntityListTab;
  tabLabel: string;
  createLabel: string;
  items: EntityListItem[];
  editable: boolean;
  onCreate: () => void;
}

const PAGE_SIZE = 6;

const normalize = (value: string): string => value.trim().toLowerCase();

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

export const EntityList = ({
  tab,
  tabLabel,
  createLabel,
  items,
  editable,
  onCreate,
}: EntityListProps): JSX.Element => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteNotice, setDeleteNotice] = useState<string | null>(null);

  const normalizedSearchTerm = normalize(searchTerm);

  const filteredItems = useMemo(() => {
    if (!normalizedSearchTerm) {
      return items;
    }

    return items.filter((item) => {
      const haystack = `${item.title} ${item.description} ${item.slug}`.toLowerCase();
      return haystack.includes(normalizedSearchTerm);
    });
  }, [items, normalizedSearchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [normalizedSearchTerm]);

  const pageCount = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));

  useEffect(() => {
    setCurrentPage((current) => Math.min(current, pageCount));
  }, [pageCount]);

  const effectivePage = Math.min(currentPage, pageCount);
  const pageStart = (effectivePage - 1) * PAGE_SIZE;
  const visibleItems = filteredItems.slice(pageStart, pageStart + PAGE_SIZE);
  const handleDeleteRequest = useCallback((title: string): void => {
    if (!window.confirm(`Delete "${title}"?`)) {
      return;
    }
    setDeleteNotice(
      `Delete for "${title}" is a placeholder action and is not connected yet.`,
    );
  }, []);

  return (
    <div className="stack gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Text variant="h3" color="iron">
            {tabLabel}
          </Text>
          <Text variant="body" color="iron-light" className="text-sm">
            Use placeholders while entity authoring pages are under construction.
          </Text>
        </div>
        <Button color="gold" onClick={onCreate} disabled={!editable}>
          {createLabel}
        </Button>
      </div>

      <DepressedInput
        label={`Search ${tabLabel}`}
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
        placeholder={`Search ${tabLabel.toLowerCase()} by title, description, or slug...`}
      />

      {deleteNotice ? (
        <Message label="Delete placeholder" color="bone">
          {deleteNotice}
        </Message>
      ) : null}

      {items.length === 0 ? (
        <Panel>
          <Text variant="body" color="iron-light">
            {`No ${tab} placeholders available.`}
          </Text>
        </Panel>
      ) : filteredItems.length === 0 ? (
        <Panel>
          <Text variant="body" color="iron-light">
            {`No ${tab} match your search.`}
          </Text>
        </Panel>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visibleItems.map((item) => {
              const referenceCode = `@${tab}/${item.slug}`;
              return (
                <Panel
                  key={item.slug}
                  className="h-full"
                  contentClassName="stack h-full gap-3"
                >
                  <ImageCard
                    imageUrl={item.imageUrl}
                    imageAlt={`${item.title} placeholder`}
                    label={item.title}
                    className="h-[180px] w-full"
                  />
                  <div className="stack gap-1">
                    <Text variant="emphasised" color="iron">
                      {item.title}
                    </Text>
                    <Text variant="body" color="iron-light" className="text-sm">
                      {item.description}
                    </Text>
                  </div>
                  <div className="mt-auto flex items-center justify-between gap-2">
                    <ShortcodeField shortcode={referenceCode} />
                    <Button
                      variant="circle"
                      color="blood"
                      size="sm"
                      aria-label={`Delete ${item.title}`}
                      title={`Delete ${item.title}`}
                      disabled={!editable}
                      onClick={() => {
                        handleDeleteRequest(item.title);
                      }}
                    >
                      <TrashIcon />
                    </Button>
                  </div>
                </Panel>
              );
            })}
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
              Page {effectivePage} / {pageCount} ({filteredItems.length} results)
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
      )}
    </div>
  );
};
