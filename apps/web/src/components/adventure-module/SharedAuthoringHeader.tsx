import type { ComponentProps, ReactNode } from "react";
import { Heading } from "../common/Heading";
import {
  AdventureModuleTabNav,
  type AdventureModuleTabItem,
} from "./AdventureModuleTabNav";

interface SharedAuthoringHeaderProps {
  title: string;
  titleAriaLabel: string;
  emptyTitle: string;
  editable: boolean;
  detailLoaded: boolean;
  titleInputSize: number;
  onTitleChange: (nextValue: string) => void;
  onTitleBlur: () => void;
  titleRowTrailingContent?: ReactNode;
  titleSupportingContent?: ReactNode;
  navLeadingContent?: ReactNode;
  navTabs: AdventureModuleTabItem[];
  moduleSlug?: string;
  showMobileMenu?: boolean;
  buildTabPath?: ComponentProps<typeof AdventureModuleTabNav>["buildTabPath"];
}

const titleInputClassName =
  "m-0 max-w-full appearance-none border-0 bg-transparent p-0 font-heading text-[1.75rem] font-bold leading-none tracking-tight text-kac-iron shadow-none outline-none ring-0 transition sm:text-[2.2rem] sm:leading-none focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kac-gold-dark/40";

export const SharedAuthoringHeader = ({
  title,
  titleAriaLabel,
  emptyTitle,
  editable,
  detailLoaded,
  titleInputSize,
  onTitleChange,
  onTitleBlur,
  titleRowTrailingContent,
  titleSupportingContent,
  navLeadingContent,
  navTabs,
  moduleSlug,
  showMobileMenu = false,
  buildTabPath,
}: SharedAuthoringHeaderProps): JSX.Element => {
  return (
    <header className="flex flex-row flex-wrap gap-3">
      <div className="flex-1 flex flex-col">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex items-baseline gap-x-2">
            {editable ? (
              <input
                type="text"
                aria-label={titleAriaLabel}
                maxLength={120}
                size={titleInputSize}
                value={title}
                onChange={(event) => {
                  onTitleChange(event.target.value);
                }}
                onBlur={onTitleBlur}
                onKeyDown={(event) => {
                  if (event.key !== "Enter") {
                    return;
                  }
                  event.currentTarget.blur();
                }}
                className={titleInputClassName}
              />
            ) : (
              <Heading
                level="h1"
                color="iron"
                className="relative z-0 text-[1.75rem] leading-none sm:text-[2.2rem] sm:leading-none"
                highlightProps={{
                  color: "gold",
                  lineHeight: 8,
                  brushHeight: 6,
                  lineOffsets: [0, 8, 14, 20],
                  className:
                    "left-1/2 bottom-[0.08em] h-[0.5em] w-[calc(100%+0.22em)] -translate-x-1/2",
                }}
              >
                {detailLoaded ? title : emptyTitle}
              </Heading>
            )}
          </div>
          {detailLoaded ? titleRowTrailingContent : null}
        </div>
        {titleSupportingContent ? (
          <div className="flex flex-wrap items-center gap-2">
            {titleSupportingContent}
          </div>
        ) : null}
      </div>
      {detailLoaded && moduleSlug ? (
        <AdventureModuleTabNav
          moduleSlug={moduleSlug}
          tabs={navTabs}
          buildTabPath={buildTabPath}
          showMobileMenu={showMobileMenu}
          leadingContent={navLeadingContent}
        />
      ) : null}
    </header>
  );
};
