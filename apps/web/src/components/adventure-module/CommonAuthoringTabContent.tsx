import type { ComponentProps } from "react";
import { AdventureModuleActorEditor } from "./AdventureModuleActorEditor";
import { AdventureModuleActorsTabPanel } from "./AdventureModuleActorsTabPanel";
import { AdventureModuleAssetEditor } from "./AdventureModuleAssetEditor";
import { AdventureModuleAssetsTabPanel } from "./AdventureModuleAssetsTabPanel";
import { AdventureModuleBaseTabPanel } from "./AdventureModuleBaseTabPanel";
import { AdventureModuleCounterEditor } from "./AdventureModuleCounterEditor";
import { AdventureModuleCountersTabPanel } from "./AdventureModuleCountersTabPanel";
import { AdventureModuleEncounterEditor } from "./AdventureModuleEncounterEditor";
import { AdventureModuleEncountersTabPanel } from "./AdventureModuleEncountersTabPanel";
import { AdventureModuleLocationEditor } from "./AdventureModuleLocationEditor";
import { AdventureModuleLocationsTabPanel } from "./AdventureModuleLocationsTabPanel";
import { AdventureModulePlayerInfoTabPanel } from "./AdventureModulePlayerInfoTabPanel";
import { AdventureModuleQuestEditor } from "./AdventureModuleQuestEditor";
import { AdventureModuleQuestsTabPanel } from "./AdventureModuleQuestsTabPanel";
import { AdventureModuleStorytellerInfoTabPanel } from "./AdventureModuleStorytellerInfoTabPanel";
import { AdventureModuleTabPlaceholder } from "./AdventureModuleTabPlaceholder";
import type { AuthoringTab } from "../../lib/authoring/sharedAuthoring";

interface CommonAuthoringTabContentProps {
  activeTab: string;
  entityId?: string;
  normalizedEntityId?: string;
  detailLabel: "module" | "campaign";
  baseTabPanelProps: ComponentProps<typeof AdventureModuleBaseTabPanel>;
  playerInfoTabPanelProps: ComponentProps<typeof AdventureModulePlayerInfoTabPanel>;
  storytellerInfoTabPanelProps: ComponentProps<typeof AdventureModuleStorytellerInfoTabPanel>;
  actorsTabPanelProps: ComponentProps<typeof AdventureModuleActorsTabPanel>;
  locationsTabPanelProps: ComponentProps<typeof AdventureModuleLocationsTabPanel>;
  encountersTabPanelProps: ComponentProps<typeof AdventureModuleEncountersTabPanel>;
  questsTabPanelProps: ComponentProps<typeof AdventureModuleQuestsTabPanel>;
  countersTabPanelProps: ComponentProps<typeof AdventureModuleCountersTabPanel>;
  assetsTabPanelProps: ComponentProps<typeof AdventureModuleAssetsTabPanel>;
  actorEditorProps: ComponentProps<typeof AdventureModuleActorEditor> | null;
  locationEditorProps: ComponentProps<typeof AdventureModuleLocationEditor> | null;
  encounterEditorProps: ComponentProps<typeof AdventureModuleEncounterEditor> | null;
  questEditorProps: ComponentProps<typeof AdventureModuleQuestEditor> | null;
  counterEditorProps: ComponentProps<typeof AdventureModuleCounterEditor> | null;
  assetEditorProps: ComponentProps<typeof AdventureModuleAssetEditor> | null;
}

const COMMON_TABS = new Set<AuthoringTab>([
  "base",
  "player-info",
  "storyteller-info",
  "actors",
  "locations",
  "encounters",
  "quests",
  "counters",
  "assets",
]);

const buildMissingEntityDescription = (
  activeTab: string,
  entityId: string | undefined,
  normalizedEntityId: string | undefined,
  detailLabel: "module" | "campaign",
): string => {
  const entityLabel =
    activeTab === "actors"
      ? "Actor"
      : activeTab === "locations"
        ? "Location"
        : activeTab === "encounters"
          ? "Encounter"
          : activeTab === "quests"
            ? "Quest"
            : activeTab === "counters"
              ? "Counter"
              : "Asset";
  return `${entityLabel} "${normalizedEntityId ?? entityId}" could not be found in this ${detailLabel}.`;
};

export const CommonAuthoringTabContent = ({
  activeTab,
  entityId,
  normalizedEntityId,
  detailLabel,
  baseTabPanelProps,
  playerInfoTabPanelProps,
  storytellerInfoTabPanelProps,
  actorsTabPanelProps,
  locationsTabPanelProps,
  encountersTabPanelProps,
  questsTabPanelProps,
  countersTabPanelProps,
  assetsTabPanelProps,
  actorEditorProps,
  locationEditorProps,
  encounterEditorProps,
  questEditorProps,
  counterEditorProps,
  assetEditorProps,
}: CommonAuthoringTabContentProps): JSX.Element | null => {
  if (!COMMON_TABS.has(activeTab as AuthoringTab)) {
    return null;
  }

  if (entityId) {
    if (activeTab === "actors") {
      return actorEditorProps ? (
        <AdventureModuleActorEditor {...actorEditorProps} />
      ) : (
        <AdventureModuleTabPlaceholder
          description={buildMissingEntityDescription(
            activeTab,
            entityId,
            normalizedEntityId,
            detailLabel,
          )}
        />
      );
    }
    if (activeTab === "locations") {
      return locationEditorProps ? (
        <AdventureModuleLocationEditor {...locationEditorProps} />
      ) : (
        <AdventureModuleTabPlaceholder
          description={buildMissingEntityDescription(
            activeTab,
            entityId,
            normalizedEntityId,
            detailLabel,
          )}
        />
      );
    }
    if (activeTab === "encounters") {
      return encounterEditorProps ? (
        <AdventureModuleEncounterEditor {...encounterEditorProps} />
      ) : (
        <AdventureModuleTabPlaceholder
          description={buildMissingEntityDescription(
            activeTab,
            entityId,
            normalizedEntityId,
            detailLabel,
          )}
        />
      );
    }
    if (activeTab === "quests") {
      return questEditorProps ? (
        <AdventureModuleQuestEditor {...questEditorProps} />
      ) : (
        <AdventureModuleTabPlaceholder
          description={buildMissingEntityDescription(
            activeTab,
            entityId,
            normalizedEntityId,
            detailLabel,
          )}
        />
      );
    }
    if (activeTab === "counters") {
      return counterEditorProps ? (
        <AdventureModuleCounterEditor {...counterEditorProps} />
      ) : (
        <AdventureModuleTabPlaceholder
          description={buildMissingEntityDescription(
            activeTab,
            entityId,
            normalizedEntityId,
            detailLabel,
          )}
        />
      );
    }
    if (activeTab === "assets") {
      return assetEditorProps ? (
        <AdventureModuleAssetEditor {...assetEditorProps} />
      ) : (
        <AdventureModuleTabPlaceholder
          description={buildMissingEntityDescription(
            activeTab,
            entityId,
            normalizedEntityId,
            detailLabel,
          )}
        />
      );
    }
  }

  switch (activeTab) {
    case "base":
      return <AdventureModuleBaseTabPanel {...baseTabPanelProps} />;
    case "player-info":
      return <AdventureModulePlayerInfoTabPanel {...playerInfoTabPanelProps} />;
    case "storyteller-info":
      return (
        <AdventureModuleStorytellerInfoTabPanel
          {...storytellerInfoTabPanelProps}
        />
      );
    case "actors":
      return <AdventureModuleActorsTabPanel {...actorsTabPanelProps} />;
    case "locations":
      return <AdventureModuleLocationsTabPanel {...locationsTabPanelProps} />;
    case "encounters":
      return <AdventureModuleEncountersTabPanel {...encountersTabPanelProps} />;
    case "quests":
      return <AdventureModuleQuestsTabPanel {...questsTabPanelProps} />;
    case "counters":
      return <AdventureModuleCountersTabPanel {...countersTabPanelProps} />;
    case "assets":
      return <AdventureModuleAssetsTabPanel {...assetsTabPanelProps} />;
    default:
      return null;
  }
};
