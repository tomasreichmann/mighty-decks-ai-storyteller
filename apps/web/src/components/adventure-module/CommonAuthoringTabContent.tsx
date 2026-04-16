import { useMemo } from "react";
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
import type { AdventureModuleLocationPinTarget } from "./AdventureModuleLocationMapEditor";
import { AdventureModuleLocationsTabPanel } from "./AdventureModuleLocationsTabPanel";
import { AdventureModulePlayerInfoTabPanel } from "./AdventureModulePlayerInfoTabPanel";
import { AdventureModuleQuestEditor } from "./AdventureModuleQuestEditor";
import { AdventureModuleQuestsTabPanel } from "./AdventureModuleQuestsTabPanel";
import { AdventureModuleStorytellerInfoTabPanel } from "./AdventureModuleStorytellerInfoTabPanel";
import { AdventureModuleTabPlaceholder } from "./AdventureModuleTabPlaceholder";
import {
  AUTHORING_TABS,
  type AuthoringTab,
} from "../../lib/authoring/sharedAuthoring";
import { useAuthoringContext } from "../../lib/authoring/store/AuthoringProvider";
import type { SmartInputDocumentContext } from "../../lib/smartInputContext";

interface CommonAuthoringTabContentProps {
  onAddActorCardToSelection?: (actorSlug: string) => void;
  onAddLocationCardToSelection?: (locationSlug: string) => void;
  onAddEncounterCardToSelection?: (encounterSlug: string) => void;
  onAddQuestCardToSelection?: (questSlug: string) => void;
  onAddCounterCardToSelection?: (counterSlug: string) => void;
  onAddAssetCardToSelection?: (assetSlug: string) => void;
}

const COMMON_TABS = new Set<AuthoringTab>(AUTHORING_TABS);

const buildMissingEntityDescription = (
  activeTab: string,
  entityId: string | undefined,
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
  return `${entityLabel} "${entityId}" could not be found in this ${detailLabel}.`;
};

export const CommonAuthoringTabContent = ({
  onAddActorCardToSelection,
  onAddLocationCardToSelection,
  onAddEncounterCardToSelection,
  onAddQuestCardToSelection,
  onAddCounterCardToSelection,
  onAddAssetCardToSelection,
}: CommonAuthoringTabContentProps): JSX.Element | null => {
  const {
    state,
    editable,
    creatorToken,
    buildRoute,
    navigateTo,
    changeField,
    flushForm,
    createEntity,
    deleteEntity,
    adjustCounterValue,
    persistCoverImage,
  } = useAuthoringContext();
  const detail = state.detail;
  const activeTab = state.route.activeTab;
  const entityId = state.route.entityId;

  const smartContextDocument = useMemo<SmartInputDocumentContext>(
    () => ({
      moduleTitle: state.forms.base.title,
      moduleSummary: detail?.index.summary ?? "",
      moduleIntent: detail?.index.intent ?? "",
      premise: state.forms.base.premise,
      haveTags: state.forms.base.haveTags,
      avoidTags: state.forms.base.avoidTags,
      playerSummary: state.forms.playerInfo.summary,
      playerInfo: state.forms.playerInfo.infoText,
      storytellerSummary: state.forms.storytellerInfo.summary,
      storytellerInfo: state.forms.storytellerInfo.infoText,
    }),
    [detail?.index.intent, detail?.index.summary, state.forms],
  );

  const locationPinTargetOptions = useMemo<AdventureModuleLocationPinTarget[]>(
    () => {
      if (!detail) {
        return [];
      }
      const currentLocationFragmentId = state.forms.location?.fragmentId;
      const locationTargets: AdventureModuleLocationPinTarget[] =
        detail.locations
          .filter((location) => location.fragmentId !== currentLocationFragmentId)
          .map((location) => ({
            fragmentId: location.fragmentId,
            kind: "location",
            slug: location.locationSlug,
            title: location.title,
            summary: location.summary,
            titleImageUrl: location.titleImageUrl,
            routePath: buildRoute(
              detail.index.slug,
              "locations",
              location.locationSlug,
            ),
          }));
      const actorTargets: AdventureModuleLocationPinTarget[] = detail.actors.map(
        (actor) => ({
          fragmentId: actor.fragmentId,
          kind: "actor",
          slug: actor.actorSlug,
          title: actor.title,
          summary: actor.summary,
          actorCard: {
            baseLayerSlug: actor.baseLayerSlug,
            tacticalRoleSlug: actor.tacticalRoleSlug,
            tacticalSpecialSlug: actor.tacticalSpecialSlug,
          },
          routePath: buildRoute(detail.index.slug, "actors", actor.actorSlug),
        }),
      );
      const encounterTargets: AdventureModuleLocationPinTarget[] =
        detail.encounters.map((encounter) => ({
          fragmentId: encounter.fragmentId,
          kind: "encounter",
          slug: encounter.encounterSlug,
          title: encounter.title,
          summary: encounter.summary,
          titleImageUrl: encounter.titleImageUrl,
          routePath: buildRoute(
            detail.index.slug,
            "encounters",
            encounter.encounterSlug,
          ),
        }));
      const questTargets: AdventureModuleLocationPinTarget[] = detail.quests.map(
        (quest) => ({
          fragmentId: quest.fragmentId,
          kind: "quest",
          slug: quest.questSlug,
          title: quest.title,
          summary: quest.summary,
          titleImageUrl: quest.titleImageUrl,
          routePath: buildRoute(detail.index.slug, "quests", quest.questSlug),
        }),
      );

      return [
        ...locationTargets,
        ...actorTargets,
        ...encounterTargets,
        ...questTargets,
      ];
    },
    [buildRoute, detail, state.forms.location?.fragmentId],
  );

  if (!detail || !COMMON_TABS.has(activeTab as AuthoringTab)) {
    return null;
  }

  const detailLabel = state.detailType === "campaign" ? "campaign" : "module";
  const activeActor =
    activeTab === "actors" && entityId
      ? detail.actors.find((actor) => actor.actorSlug === entityId) ?? null
      : null;
  const activeLocation =
    activeTab === "locations" && entityId
      ? detail.locations.find((location) => location.locationSlug === entityId) ??
        null
      : null;
  const activeEncounter =
    activeTab === "encounters" && entityId
      ? detail.encounters.find(
          (encounter) => encounter.encounterSlug === entityId,
        ) ?? null
      : null;
  const activeQuest =
    activeTab === "quests" && entityId
      ? detail.quests.find((quest) => quest.questSlug === entityId) ?? null
      : null;
  const activeCounter =
    activeTab === "counters" && entityId
      ? detail.counters.find((counter) => counter.slug === entityId) ?? null
      : null;
  const activeAsset =
    activeTab === "assets" && entityId
      ? detail.assets.find((asset) => asset.assetSlug === entityId) ?? null
      : null;

  if (entityId) {
    if (activeTab === "actors") {
      return activeActor && state.forms.actor ? (
        <AdventureModuleActorEditor
          actor={{
            ...activeActor,
            title: state.forms.actor.title,
            summary: state.forms.actor.summary,
            baseLayerSlug: state.forms.actor.baseLayerSlug,
            tacticalRoleSlug: state.forms.actor.tacticalRoleSlug,
            tacticalSpecialSlug: state.forms.actor.tacticalSpecialSlug,
            isPlayerCharacter: state.forms.actor.isPlayerCharacter,
            content: state.forms.actor.content,
          }}
          actors={detail.actors}
          counters={detail.counters}
          assets={detail.assets}
          encounters={detail.encounters}
          quests={detail.quests}
          smartContextDocument={smartContextDocument}
          editable={editable}
          validationMessage={state.validation.actor}
          onTitleChange={(nextValue) => changeField("actor", "title", nextValue)}
          onSummaryChange={(nextValue) =>
            changeField("actor", "summary", nextValue)
          }
          onBaseLayerChange={(nextValue) =>
            changeField("actor", "baseLayerSlug", nextValue)
          }
          onTacticalRoleChange={(nextValue) =>
            changeField("actor", "tacticalRoleSlug", nextValue)
          }
          onTacticalSpecialChange={(nextValue) =>
            changeField("actor", "tacticalSpecialSlug", nextValue)
          }
          onIsPlayerCharacterChange={(nextValue) =>
            changeField("actor", "isPlayerCharacter", nextValue)
          }
          onContentChange={(nextValue) =>
            changeField("actor", "content", nextValue)
          }
          onFieldBlur={() => {
            void flushForm("actor");
          }}
          onAdjustCounterValue={(counterSlug, delta, target) => {
            void adjustCounterValue(counterSlug, delta, target);
          }}
          onDelete={() => {
            void deleteEntity("actor", activeActor.actorSlug, activeActor.title);
          }}
          onAddActorCardToSelection={
            onAddActorCardToSelection
              ? () => onAddActorCardToSelection(activeActor.actorSlug)
              : undefined
          }
        />
      ) : (
        <AdventureModuleTabPlaceholder
          description={buildMissingEntityDescription(
            activeTab,
            entityId,
            detailLabel,
          )}
        />
      );
    }

    if (activeTab === "locations") {
      return activeLocation && state.forms.location ? (
        <AdventureModuleLocationEditor
          location={{
            ...activeLocation,
            title: state.forms.location.title,
            summary: state.forms.location.summary,
            titleImageUrl: state.forms.location.titleImageUrl || undefined,
            introductionMarkdown: state.forms.location.introductionMarkdown,
            descriptionMarkdown: state.forms.location.descriptionMarkdown,
            mapImageUrl: state.forms.location.mapImageUrl || undefined,
            mapPins: state.forms.location.mapPins,
          }}
          actors={detail.actors}
          counters={detail.counters}
          assets={detail.assets}
          encounters={detail.encounters}
          quests={detail.quests}
          smartContextDocument={smartContextDocument}
          editable={editable}
          validationMessage={state.validation.location}
          pinTargets={locationPinTargetOptions}
          onTitleChange={(nextValue) =>
            changeField("location", "title", nextValue)
          }
          onSummaryChange={(nextValue) =>
            changeField("location", "summary", nextValue)
          }
          onTitleImageUrlChange={(nextValue) =>
            changeField("location", "titleImageUrl", nextValue)
          }
          onIntroductionChange={(nextValue) =>
            changeField("location", "introductionMarkdown", nextValue)
          }
          onDescriptionChange={(nextValue) =>
            changeField("location", "descriptionMarkdown", nextValue)
          }
          onMapImageUrlChange={(nextValue) =>
            changeField("location", "mapImageUrl", nextValue)
          }
          onMapPinsChange={(nextPins) =>
            changeField("location", "mapPins", nextPins)
          }
          onFieldBlur={() => {
            void flushForm("location");
          }}
          onOpenPinTarget={(target) => {
            navigateTo(target.routePath);
          }}
          onAdjustCounterValue={(counterSlug, delta, target) => {
            void adjustCounterValue(counterSlug, delta, target);
          }}
          onDelete={() => {
            void deleteEntity(
              "location",
              activeLocation.locationSlug,
              activeLocation.title,
            );
          }}
          onAddLocationCardToSelection={
            onAddLocationCardToSelection
              ? () => onAddLocationCardToSelection(activeLocation.locationSlug)
              : undefined
          }
        />
      ) : (
        <AdventureModuleTabPlaceholder
          description={buildMissingEntityDescription(
            activeTab,
            entityId,
            detailLabel,
          )}
        />
      );
    }

    if (activeTab === "encounters") {
      return activeEncounter && state.forms.encounter ? (
        <AdventureModuleEncounterEditor
          encounter={{
            ...activeEncounter,
            title: state.forms.encounter.title,
            summary: state.forms.encounter.summary,
            prerequisites: state.forms.encounter.prerequisites,
            titleImageUrl: state.forms.encounter.titleImageUrl || undefined,
            content: state.forms.encounter.content,
          }}
          actors={detail.actors}
          counters={detail.counters}
          assets={detail.assets}
          encounters={detail.encounters}
          quests={detail.quests}
          smartContextDocument={smartContextDocument}
          editable={editable}
          validationMessage={state.validation.encounter}
          onTitleChange={(nextValue) =>
            changeField("encounter", "title", nextValue)
          }
          onSummaryChange={(nextValue) =>
            changeField("encounter", "summary", nextValue)
          }
          onPrerequisitesChange={(nextValue) =>
            changeField("encounter", "prerequisites", nextValue)
          }
          onTitleImageUrlChange={(nextValue) =>
            changeField("encounter", "titleImageUrl", nextValue)
          }
          onContentChange={(nextValue) =>
            changeField("encounter", "content", nextValue)
          }
          onFieldBlur={() => {
            void flushForm("encounter");
          }}
          onAdjustCounterValue={(counterSlug, delta, target) => {
            void adjustCounterValue(counterSlug, delta, target);
          }}
          onDelete={() => {
            void deleteEntity(
              "encounter",
              activeEncounter.encounterSlug,
              activeEncounter.title,
            );
          }}
          onAddEncounterCardToSelection={
            onAddEncounterCardToSelection
              ? () => onAddEncounterCardToSelection(activeEncounter.encounterSlug)
              : undefined
          }
        />
      ) : (
        <AdventureModuleTabPlaceholder
          description={buildMissingEntityDescription(
            activeTab,
            entityId,
            detailLabel,
          )}
        />
      );
    }

    if (activeTab === "quests") {
      return activeQuest && state.forms.quest ? (
        <AdventureModuleQuestEditor
          quest={{
            ...activeQuest,
            title: state.forms.quest.title,
            summary: state.forms.quest.summary,
            titleImageUrl: state.forms.quest.titleImageUrl || undefined,
            content: state.forms.quest.content,
          }}
          actors={detail.actors}
          counters={detail.counters}
          assets={detail.assets}
          encounters={detail.encounters}
          quests={detail.quests}
          smartContextDocument={smartContextDocument}
          editable={editable}
          validationMessage={state.validation.quest}
          onTitleChange={(nextValue) => changeField("quest", "title", nextValue)}
          onSummaryChange={(nextValue) =>
            changeField("quest", "summary", nextValue)
          }
          onTitleImageUrlChange={(nextValue) =>
            changeField("quest", "titleImageUrl", nextValue)
          }
          onContentChange={(nextValue) =>
            changeField("quest", "content", nextValue)
          }
          onFieldBlur={() => {
            void flushForm("quest");
          }}
          onAdjustCounterValue={(counterSlug, delta, target) => {
            void adjustCounterValue(counterSlug, delta, target);
          }}
          onDelete={() => {
            void deleteEntity("quest", activeQuest.questSlug, activeQuest.title);
          }}
          onAddQuestCardToSelection={
            onAddQuestCardToSelection
              ? () => onAddQuestCardToSelection(activeQuest.questSlug)
              : undefined
          }
        />
      ) : (
        <AdventureModuleTabPlaceholder
          description={buildMissingEntityDescription(
            activeTab,
            entityId,
            detailLabel,
          )}
        />
      );
    }

    if (activeTab === "counters") {
      return activeCounter && state.forms.counter ? (
        <AdventureModuleCounterEditor
          counter={{
            ...activeCounter,
            title: state.forms.counter.title,
            iconSlug: state.forms.counter.iconSlug,
            currentValue: state.forms.counter.currentValue,
            maxValue: state.forms.counter.maxValue,
            description: state.forms.counter.description,
          }}
          editable={editable}
          validationMessage={state.validation.counter}
          onTitleChange={(nextValue) =>
            changeField("counter", "title", nextValue)
          }
          onIconSlugChange={(nextValue) =>
            changeField("counter", "iconSlug", nextValue)
          }
          onCurrentValueChange={(nextValue) => {
            const parsed = Number.parseInt(nextValue, 10);
            changeField(
              "counter",
              "currentValue",
              Number.isFinite(parsed) && parsed >= 0 ? parsed : 0,
            );
          }}
          onMaxValueChange={(nextValue) => {
            const trimmed = nextValue.trim();
            const parsed = Number.parseInt(trimmed, 10);
            changeField(
              "counter",
              "maxValue",
              trimmed.length === 0
                ? undefined
                : Number.isFinite(parsed) && parsed >= 0
                  ? parsed
                  : state.forms.counter?.maxValue,
            );
          }}
          onDescriptionChange={(nextValue) =>
            changeField("counter", "description", nextValue)
          }
          onFieldBlur={() => {
            void flushForm("counter");
          }}
          onAdjustCounterValue={(counterSlug, delta, target) => {
            void adjustCounterValue(counterSlug, delta, target);
          }}
          onDelete={() => {
            void deleteEntity(
              "counter",
              activeCounter.slug,
              activeCounter.title,
            );
          }}
          onAddCounterCardToSelection={
            onAddCounterCardToSelection
              ? () => onAddCounterCardToSelection(activeCounter.slug)
              : undefined
          }
        />
      ) : (
        <AdventureModuleTabPlaceholder
          description={buildMissingEntityDescription(
            activeTab,
            entityId,
            detailLabel,
          )}
        />
      );
    }

    if (activeTab === "assets") {
      return activeAsset && state.forms.asset ? (
        <AdventureModuleAssetEditor
          asset={{
            fragmentId: activeAsset.fragmentId,
            assetSlug: activeAsset.assetSlug,
            title: state.forms.asset.title,
            summary: state.forms.asset.summary,
            modifier: state.forms.asset.modifier,
            noun: state.forms.asset.noun,
            nounDescription: state.forms.asset.nounDescription,
            adjectiveDescription: state.forms.asset.adjectiveDescription,
            iconUrl: state.forms.asset.iconUrl,
            overlayUrl: state.forms.asset.overlayUrl,
            content: state.forms.asset.content,
          }}
          actors={detail.actors}
          counters={detail.counters}
          assets={detail.assets}
          encounters={detail.encounters}
          quests={detail.quests}
          smartContextDocument={smartContextDocument}
          editable={editable}
          reauthorRequired={state.forms.asset.reauthorRequired}
          validationMessage={state.validation.asset}
          onTitleChange={(nextValue) => changeField("asset", "title", nextValue)}
          onSummaryChange={(nextValue) =>
            changeField("asset", "summary", nextValue)
          }
          onModifierChange={(nextValue) =>
            changeField("asset", "modifier", nextValue)
          }
          onNounChange={(nextValue) => changeField("asset", "noun", nextValue)}
          onNounDescriptionChange={(nextValue) =>
            changeField("asset", "nounDescription", nextValue)
          }
          onAdjectiveDescriptionChange={(nextValue) =>
            changeField("asset", "adjectiveDescription", nextValue)
          }
          onIconUrlChange={(nextValue) =>
            changeField("asset", "iconUrl", nextValue)
          }
          onOverlayUrlChange={(nextValue) =>
            changeField("asset", "overlayUrl", nextValue)
          }
          onContentChange={(nextValue) =>
            changeField("asset", "content", nextValue)
          }
          onFieldBlur={() => {
            void flushForm("asset");
          }}
          onDelete={() => {
            void deleteEntity("asset", activeAsset.assetSlug, activeAsset.title);
          }}
          onAddAssetCardToSelection={
            onAddAssetCardToSelection
              ? () => onAddAssetCardToSelection(activeAsset.assetSlug)
              : undefined
          }
        />
      ) : (
        <AdventureModuleTabPlaceholder
          description={buildMissingEntityDescription(
            activeTab,
            entityId,
            detailLabel,
          )}
        />
      );
    }
  }

  switch (activeTab) {
    case "base":
      return (
        <AdventureModuleBaseTabPanel
          moduleId={detail.index.moduleId}
          creatorToken={creatorToken}
          coverImageUrl={detail.coverImageUrl}
          premise={state.forms.base.premise}
          haveTags={state.forms.base.haveTags}
          avoidTags={state.forms.base.avoidTags}
          moduleTitle={state.forms.base.title}
          moduleSummary={detail.index.summary}
          moduleIntent={detail.index.intent ?? ""}
          playerSummary={state.forms.playerInfo.summary}
          playerInfo={state.forms.playerInfo.infoText}
          storytellerSummary={state.forms.storytellerInfo.summary}
          storytellerInfo={state.forms.storytellerInfo.infoText}
          editable={editable}
          validationMessage={state.validation.base}
          persistCoverImage={persistCoverImage}
          onPremiseChange={(nextValue) =>
            changeField("base", "premise", nextValue)
          }
          onHaveChange={(nextValue) =>
            changeField("base", "haveTags", nextValue)
          }
          onAvoidChange={(nextValue) =>
            changeField("base", "avoidTags", nextValue)
          }
          onFieldBlur={() => {
            void flushForm("base");
          }}
        />
      );
    case "player-info":
      return (
        <AdventureModulePlayerInfoTabPanel
          summary={state.forms.playerInfo.summary}
          infoText={state.forms.playerInfo.infoText}
          smartContextDocument={smartContextDocument}
          actors={detail.actors}
          counters={detail.counters}
          assets={detail.assets}
          encounters={detail.encounters}
          quests={detail.quests}
          editable={editable}
          validationMessage={state.validation.playerInfo}
          onSummaryChange={(nextValue) =>
            changeField("playerInfo", "summary", nextValue)
          }
          onInfoTextChange={(nextValue) =>
            changeField("playerInfo", "infoText", nextValue)
          }
          onFieldBlur={() => {
            void flushForm("playerInfo");
          }}
          onAdjustCounterValue={(counterSlug, delta, target) => {
            void adjustCounterValue(counterSlug, delta, target);
          }}
        />
      );
    case "storyteller-info":
      return (
        <AdventureModuleStorytellerInfoTabPanel
          summary={state.forms.storytellerInfo.summary}
          infoText={state.forms.storytellerInfo.infoText}
          smartContextDocument={smartContextDocument}
          actors={detail.actors}
          counters={detail.counters}
          assets={detail.assets}
          encounters={detail.encounters}
          quests={detail.quests}
          editable={editable}
          validationMessage={state.validation.storytellerInfo}
          onSummaryChange={(nextValue) =>
            changeField("storytellerInfo", "summary", nextValue)
          }
          onInfoTextChange={(nextValue) =>
            changeField("storytellerInfo", "infoText", nextValue)
          }
          onFieldBlur={() => {
            void flushForm("storytellerInfo");
          }}
          onAdjustCounterValue={(counterSlug, delta, target) => {
            void adjustCounterValue(counterSlug, delta, target);
          }}
        />
      );
    case "actors":
      return (
        <AdventureModuleActorsTabPanel
          actors={detail.actors}
          editable={editable}
          creating={state.creating.actor}
          createError={state.createErrors.actor}
          onCreate={() => {
            void createEntity("actor");
          }}
          onOpenActor={(actorSlug) => {
            navigateTo(buildRoute(detail.index.slug, "actors", actorSlug));
          }}
          onDeleteActor={(actorSlug, title) => {
            void deleteEntity("actor", actorSlug, title);
          }}
          onAddActorCardToSelection={onAddActorCardToSelection}
        />
      );
    case "locations":
      return (
        <AdventureModuleLocationsTabPanel
          locations={detail.locations}
          editable={editable}
          creating={state.creating.location}
          createError={state.createErrors.location}
          onCreate={() => {
            void createEntity("location");
          }}
          onOpenLocation={(locationSlug) => {
            navigateTo(buildRoute(detail.index.slug, "locations", locationSlug));
          }}
          onDeleteLocation={(locationSlug, title) => {
            void deleteEntity("location", locationSlug, title);
          }}
          onAddLocationCardToSelection={onAddLocationCardToSelection}
        />
      );
    case "encounters":
      return (
        <AdventureModuleEncountersTabPanel
          encounters={detail.encounters}
          editable={editable}
          creating={state.creating.encounter}
          createError={state.createErrors.encounter}
          onCreate={() => {
            void createEntity("encounter");
          }}
          onOpenEncounter={(encounterSlug) => {
            navigateTo(buildRoute(detail.index.slug, "encounters", encounterSlug));
          }}
          onDeleteEncounter={(encounterSlug, title) => {
            void deleteEntity("encounter", encounterSlug, title);
          }}
          onAddEncounterCardToSelection={onAddEncounterCardToSelection}
        />
      );
    case "quests":
      return (
        <AdventureModuleQuestsTabPanel
          quests={detail.quests}
          editable={editable}
          creating={state.creating.quest}
          createError={state.createErrors.quest}
          onCreate={() => {
            void createEntity("quest");
          }}
          onOpenQuest={(questSlug) => {
            navigateTo(buildRoute(detail.index.slug, "quests", questSlug));
          }}
          onDeleteQuest={(questSlug, title) => {
            void deleteEntity("quest", questSlug, title);
          }}
          onAddQuestCardToSelection={onAddQuestCardToSelection}
        />
      );
    case "counters":
      return (
        <AdventureModuleCountersTabPanel
          counters={detail.counters}
          editable={editable}
          creating={state.creating.counter}
          createError={state.createErrors.counter}
          onCreate={() => {
            void createEntity("counter");
          }}
          onOpenCounter={(counterSlug) => {
            navigateTo(buildRoute(detail.index.slug, "counters", counterSlug));
          }}
          onDeleteCounter={(counterSlug, title) => {
            void deleteEntity("counter", counterSlug, title);
          }}
          onAddCounterCardToSelection={onAddCounterCardToSelection}
          onAdjustCounterValue={(counterSlug, delta, target) => {
            void adjustCounterValue(counterSlug, delta, target);
          }}
        />
      );
    case "assets":
      return (
        <AdventureModuleAssetsTabPanel
          assets={detail.assets}
          editable={editable}
          creating={state.creating.asset}
          createError={state.createErrors.asset}
          onCreate={() => {
            void createEntity("asset");
          }}
          onOpenAsset={(assetSlug) => {
            navigateTo(buildRoute(detail.index.slug, "assets", assetSlug));
          }}
          onDeleteAsset={(assetSlug, title) => {
            void deleteEntity("asset", assetSlug, title);
          }}
          onAddAssetCardToSelection={onAddAssetCardToSelection}
        />
      );
    default:
      return null;
  }
};
