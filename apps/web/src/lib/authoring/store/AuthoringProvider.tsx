import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import {
  makeUniqueAssetSlug,
  makeUniqueCounterSlug,
  resolvePlayerSummaryState,
  resolveStorytellerSummaryState,
  toCounterFormState,
  validateActorForm,
  validateAssetForm,
  validateBaseForm,
  validateCounterForm,
  validateEncounterForm,
  validateLocationForm,
  validatePlayerInfoForm,
  validateQuestForm,
  validateStorytellerInfoForm,
} from "../sharedAuthoring";
import { authoringReducer, createInitialAuthoringState } from "./authoringReducer";
import {
  buildAdjustedCounterPayload,
  buildOptimisticDetail,
  buildSavedMessage,
  resolveActiveEditorForm,
} from "./authoringStoreHelpers";
import type {
  AuthoringFormKey,
  AuthoringProviderProps,
  AuthoringProviderValue,
  EntityFormKey,
  SharedAuthoringDetail,
} from "./authoringStoreTypes";

const AuthoringContext = createContext<AuthoringProviderValue | null>(null);

const entityFormToTab = (form: EntityFormKey): string => {
  switch (form) {
    case "actor":
      return "actors";
    case "location":
      return "locations";
    case "encounter":
      return "encounters";
    case "quest":
      return "quests";
    case "counter":
      return "counters";
    case "asset":
      return "assets";
  }
};

export const AuthoringProvider = <
  TDetail extends SharedAuthoringDetail = SharedAuthoringDetail,
>({
  adapter,
  slug,
  activeTab,
  entityId,
  creatorToken,
  buildRoute,
  navigateTo,
  children,
}: AuthoringProviderProps<TDetail>): JSX.Element => {
  const [state, dispatch] = useReducer(
    authoringReducer<TDetail>,
    createInitialAuthoringState({
      detailType: adapter.detailType,
      activeTab,
      entityId,
    }) as never,
  );
  const saveTimerRef = useRef<number | null>(null);
  const savingRef = useRef(false);

  useEffect(() => {
    dispatch({
      type: "syncRoute",
      activeTab,
      entityId,
    });
  }, [activeTab, entityId]);

  const refresh = useCallback(async (): Promise<void> => {
    if (!slug) {
      dispatch({
        type: "loadFailed",
        message: `${adapter.detailLabel} slug is required.`,
      });
      return;
    }
    dispatch({ type: "loadStarted" });
    try {
      const detail = await adapter.loadBySlug({ slug, creatorToken });
      dispatch({
        type: "loadSucceeded",
        detail,
      });
    } catch (loadError) {
      dispatch({
        type: "loadFailed",
        message:
          loadError instanceof Error
            ? loadError.message
            : `Could not load ${adapter.detailLabel}.`,
      });
    }
  }, [adapter, creatorToken, slug]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const editable = Boolean(state.detail?.ownedByRequester);
  const activeEditorForm = resolveActiveEditorForm(
    state.route.activeTab,
    state.route.entityId,
  );

  const changeField = useCallback<AuthoringProviderValue["changeField"]>(
    (form, field, value) => {
      dispatch({
        type: "setDraftField",
        form,
        field: String(field),
        value,
      });
    },
    [],
  );

  const persistForm = useCallback(
    async (form: AuthoringFormKey): Promise<void> => {
      if (!state.detail || !editable || savingRef.current) {
        return;
      }
      const detailId = adapter.getDetailId(state.detail);
      const optimisticDetail = buildOptimisticDetail(
        state.detail,
        form,
        state.forms,
      ) as TDetail | undefined;

      if (form === "base") {
        const validated = validateBaseForm(state.forms.base);
        if (validated.error) {
          dispatch({ type: "setValidationMessage", form, message: validated.error });
          dispatch({
            type: "setAutosaveState",
            status: "error",
            message: validated.error,
          });
          return;
        }
        dispatch({ type: "saveStarted", form, optimisticDetail });
        savingRef.current = true;
        try {
          const detail = await adapter.updateIndex(
            detailId,
            {
              ...state.detail.index,
              title: validated.title,
              premise: validated.premise,
              dos: validated.dos,
              donts: validated.donts,
            } as TDetail["index"],
            creatorToken,
          );
          dispatch({
            type: "saveSucceeded",
            form,
            detail,
            message: buildSavedMessage(),
          });
        } catch (saveError) {
          dispatch({
            type: "saveFailed",
            form,
            message:
              saveError instanceof Error ? saveError.message : "Autosave failed.",
          });
        } finally {
          savingRef.current = false;
        }
        return;
      }

      if (form === "playerInfo") {
        const validated = validatePlayerInfoForm(state.forms.playerInfo);
        if (validated.error) {
          dispatch({ type: "setValidationMessage", form, message: validated.error });
          dispatch({
            type: "setAutosaveState",
            status: "error",
            message: validated.error,
          });
          return;
        }
        const playerSummaryState = resolvePlayerSummaryState(state.detail);
        if (!playerSummaryState) {
          dispatch({
            type: "saveFailed",
            form,
            message: "Player summary fragment is missing from this entry.",
          });
          return;
        }
        const summaryChanged =
          validated.summary !== playerSummaryState.summaryMarkdown ||
          validated.summary !== state.detail.index.playerSummaryMarkdown;
        const infoTextChanged = validated.infoText !== playerSummaryState.infoText;
        if (!summaryChanged && !infoTextChanged) {
          dispatch({
            type: "saveSucceeded",
            form,
            detail: state.detail,
            message: buildSavedMessage(),
          });
          return;
        }
        dispatch({ type: "saveStarted", form, optimisticDetail });
        savingRef.current = true;
        try {
          let nextDetail = state.detail;
          if (summaryChanged && optimisticDetail) {
            nextDetail = await adapter.updateIndex(
              detailId,
              optimisticDetail.index as TDetail["index"],
              creatorToken,
            );
          }
          if (infoTextChanged) {
            nextDetail = await adapter.updateFragment(
              adapter.getDetailId(nextDetail),
              playerSummaryState.fragmentId,
              validated.infoText,
              creatorToken,
            );
          }
          dispatch({
            type: "saveSucceeded",
            form,
            detail: nextDetail,
            message: buildSavedMessage(),
          });
        } catch (saveError) {
          dispatch({
            type: "saveFailed",
            form,
            message:
              saveError instanceof Error ? saveError.message : "Autosave failed.",
          });
        } finally {
          savingRef.current = false;
        }
        return;
      }

      if (form === "storytellerInfo") {
        const validated = validateStorytellerInfoForm(state.forms.storytellerInfo);
        if (validated.error) {
          dispatch({ type: "setValidationMessage", form, message: validated.error });
          dispatch({
            type: "setAutosaveState",
            status: "error",
            message: validated.error,
          });
          return;
        }
        const storytellerSummaryState = resolveStorytellerSummaryState(state.detail);
        if (!storytellerSummaryState) {
          dispatch({
            type: "saveFailed",
            form,
            message: "Storyteller summary fragment is missing from this entry.",
          });
          return;
        }
        const summaryChanged =
          validated.summary !== storytellerSummaryState.summaryMarkdown ||
          validated.summary !== state.detail.index.storytellerSummaryMarkdown;
        const infoTextChanged =
          validated.infoText !== storytellerSummaryState.infoText;
        if (!summaryChanged && !infoTextChanged) {
          dispatch({
            type: "saveSucceeded",
            form,
            detail: state.detail,
            message: buildSavedMessage(),
          });
          return;
        }
        dispatch({ type: "saveStarted", form, optimisticDetail });
        savingRef.current = true;
        try {
          let nextDetail = state.detail;
          if (summaryChanged && optimisticDetail) {
            nextDetail = await adapter.updateIndex(
              detailId,
              optimisticDetail.index as TDetail["index"],
              creatorToken,
            );
          }
          if (infoTextChanged) {
            nextDetail = await adapter.updateFragment(
              adapter.getDetailId(nextDetail),
              storytellerSummaryState.fragmentId,
              validated.infoText,
              creatorToken,
            );
          }
          dispatch({
            type: "saveSucceeded",
            form,
            detail: nextDetail,
            message: buildSavedMessage(),
          });
        } catch (saveError) {
          dispatch({
            type: "saveFailed",
            form,
            message:
              saveError instanceof Error ? saveError.message : "Autosave failed.",
          });
        } finally {
          savingRef.current = false;
        }
        return;
      }

      if (form === "actor" && state.forms.actor) {
        const validated = validateActorForm(state.forms.actor);
        if (validated.error) {
          dispatch({ type: "setValidationMessage", form, message: validated.error });
          dispatch({
            type: "setAutosaveState",
            status: "error",
            message: validated.error,
          });
          return;
        }
        dispatch({ type: "saveStarted", form, optimisticDetail });
        savingRef.current = true;
        try {
          const detail = await adapter.updateActor(
            detailId,
            state.forms.actor.actorSlug,
            {
              title: validated.title,
              summary: validated.summary,
              baseLayerSlug: validated.baseLayerSlug,
              tacticalRoleSlug: validated.tacticalRoleSlug,
              tacticalSpecialSlug: validated.tacticalSpecialSlug ?? null,
              isPlayerCharacter: validated.isPlayerCharacter,
              content: validated.content,
            },
            creatorToken,
          );
          dispatch({
            type: "saveSucceeded",
            form,
            detail,
            message: buildSavedMessage(),
          });
        } catch (saveError) {
          dispatch({
            type: "saveFailed",
            form,
            message:
              saveError instanceof Error ? saveError.message : "Autosave failed.",
          });
        } finally {
          savingRef.current = false;
        }
        return;
      }

      if (form === "location" && state.forms.location) {
        const validated = validateLocationForm(state.forms.location);
        if (validated.error) {
          dispatch({ type: "setValidationMessage", form, message: validated.error });
          dispatch({
            type: "setAutosaveState",
            status: "error",
            message: validated.error,
          });
          return;
        }
        dispatch({ type: "saveStarted", form, optimisticDetail });
        savingRef.current = true;
        try {
          const detail = await adapter.updateLocation(
            detailId,
            state.forms.location.locationSlug,
            {
              title: validated.title,
              summary: validated.summary,
              titleImageUrl: validated.titleImageUrl,
              introductionMarkdown: validated.introductionMarkdown,
              descriptionMarkdown: validated.descriptionMarkdown,
              mapImageUrl: validated.mapImageUrl,
              mapPins: validated.mapPins,
            },
            creatorToken,
          );
          dispatch({
            type: "saveSucceeded",
            form,
            detail,
            message: buildSavedMessage(),
          });
        } catch (saveError) {
          dispatch({
            type: "saveFailed",
            form,
            message:
              saveError instanceof Error ? saveError.message : "Autosave failed.",
          });
        } finally {
          savingRef.current = false;
        }
        return;
      }

      if (form === "encounter" && state.forms.encounter) {
        const validated = validateEncounterForm(state.forms.encounter);
        if (validated.error) {
          dispatch({ type: "setValidationMessage", form, message: validated.error });
          dispatch({
            type: "setAutosaveState",
            status: "error",
            message: validated.error,
          });
          return;
        }
        dispatch({ type: "saveStarted", form, optimisticDetail });
        savingRef.current = true;
        try {
          const detail = await adapter.updateEncounter(
            detailId,
            state.forms.encounter.encounterSlug,
            {
              title: validated.title,
              summary: validated.summary,
              prerequisites: validated.prerequisites,
              titleImageUrl: validated.titleImageUrl,
              content: validated.content,
            },
            creatorToken,
          );
          dispatch({
            type: "saveSucceeded",
            form,
            detail,
            message: buildSavedMessage(),
          });
        } catch (saveError) {
          dispatch({
            type: "saveFailed",
            form,
            message:
              saveError instanceof Error ? saveError.message : "Autosave failed.",
          });
        } finally {
          savingRef.current = false;
        }
        return;
      }

      if (form === "quest" && state.forms.quest) {
        const validated = validateQuestForm(state.forms.quest);
        if (validated.error) {
          dispatch({ type: "setValidationMessage", form, message: validated.error });
          dispatch({
            type: "setAutosaveState",
            status: "error",
            message: validated.error,
          });
          return;
        }
        dispatch({ type: "saveStarted", form, optimisticDetail });
        savingRef.current = true;
        try {
          const detail = await adapter.updateQuest(
            detailId,
            state.forms.quest.questSlug,
            {
              title: validated.title,
              summary: validated.summary,
              titleImageUrl: validated.titleImageUrl,
              content: validated.content,
            },
            creatorToken,
          );
          dispatch({
            type: "saveSucceeded",
            form,
            detail,
            message: buildSavedMessage(),
          });
        } catch (saveError) {
          dispatch({
            type: "saveFailed",
            form,
            message:
              saveError instanceof Error ? saveError.message : "Autosave failed.",
          });
        } finally {
          savingRef.current = false;
        }
        return;
      }

      if (form === "counter" && state.forms.counter) {
        const validated = validateCounterForm(state.forms.counter);
        if (validated.error) {
          dispatch({ type: "setValidationMessage", form, message: validated.error });
          dispatch({
            type: "setAutosaveState",
            status: "error",
            message: validated.error,
          });
          return;
        }
        dispatch({ type: "saveStarted", form, optimisticDetail });
        savingRef.current = true;
        try {
          const detail = await adapter.updateCounter(
            detailId,
            state.forms.counter.slug,
            {
              title: validated.title,
              iconSlug: validated.iconSlug,
              currentValue: validated.currentValue,
              maxValue: validated.maxValue ?? null,
              description: validated.description,
            },
            creatorToken,
          );
          const nextCounterSlug = makeUniqueCounterSlug(
            validated.title,
            state.detail,
            state.forms.counter.slug,
          );
          if (nextCounterSlug !== state.forms.counter.slug) {
            navigateTo(buildRoute(detail.index.slug, "counters", nextCounterSlug), {
              replace: true,
            });
          }
          dispatch({
            type: "saveSucceeded",
            form,
            detail,
            message: buildSavedMessage(),
          });
        } catch (saveError) {
          dispatch({
            type: "saveFailed",
            form,
            message:
              saveError instanceof Error ? saveError.message : "Autosave failed.",
          });
        } finally {
          savingRef.current = false;
        }
        return;
      }

      if (form === "asset" && state.forms.asset) {
        const validated = validateAssetForm(state.forms.asset);
        if (validated.error) {
          dispatch({ type: "setValidationMessage", form, message: validated.error });
          dispatch({
            type: "setAutosaveState",
            status: "error",
            message: validated.error,
          });
          return;
        }
        dispatch({ type: "saveStarted", form, optimisticDetail });
        savingRef.current = true;
        try {
          const detail = await adapter.updateAsset(
            detailId,
            state.forms.asset.assetSlug,
            {
              title: validated.title,
              summary: validated.summary,
              modifier: validated.modifier,
              noun: validated.noun,
              nounDescription: validated.nounDescription,
              adjectiveDescription: validated.adjectiveDescription,
              iconUrl: validated.iconUrl,
              overlayUrl: validated.overlayUrl,
              content: validated.content,
            },
            creatorToken,
          );
          const nextAssetSlug = makeUniqueAssetSlug(
            validated.title,
            state.detail,
            state.forms.asset.assetSlug,
          );
          if (nextAssetSlug !== state.forms.asset.assetSlug) {
            navigateTo(buildRoute(detail.index.slug, "assets", nextAssetSlug), {
              replace: true,
            });
          }
          dispatch({
            type: "saveSucceeded",
            form,
            detail,
            message: buildSavedMessage(),
          });
        } catch (saveError) {
          dispatch({
            type: "saveFailed",
            form,
            message:
              saveError instanceof Error ? saveError.message : "Autosave failed.",
          });
        } finally {
          savingRef.current = false;
        }
      }
    },
    [
      adapter,
      buildRoute,
      creatorToken,
      editable,
      navigateTo,
      state.detail,
      state.forms,
    ],
  );

  useEffect(() => {
    if (!activeEditorForm || !state.dirty[activeEditorForm] || !editable) {
      return;
    }
    dispatch({ type: "saveQueued" });
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = window.setTimeout(() => {
      void persistForm(activeEditorForm);
    }, 1000);
    return () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, [activeEditorForm, editable, persistForm, state.dirty]);

  const flushActiveForm = useCallback(async (): Promise<void> => {
    if (!activeEditorForm || !state.dirty[activeEditorForm] || !editable) {
      return;
    }
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    await persistForm(activeEditorForm);
  }, [activeEditorForm, editable, persistForm, state.dirty]);

  const flushForm = useCallback(
    async (form: AuthoringFormKey): Promise<void> => {
      if (!state.dirty[form] || !editable) {
        return;
      }
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      await persistForm(form);
    },
    [editable, persistForm, state.dirty],
  );

  const createEntity = useCallback(
    async (form: EntityFormKey): Promise<void> => {
      if (!state.detail || !editable || state.creating[form]) {
        return;
      }
      dispatch({ type: "setCreating", form, creating: true });
      dispatch({ type: "setCreateError", form, message: null });
      try {
        const detailId = adapter.getDetailId(state.detail);
        const detail =
          form === "actor"
            ? await adapter.createActor(detailId, { title: "New Actor", isPlayerCharacter: false }, creatorToken)
            : form === "location"
              ? await adapter.createLocation(detailId, { title: "New Location" }, creatorToken)
              : form === "encounter"
                ? await adapter.createEncounter(detailId, { title: "New Encounter" }, creatorToken)
                : form === "quest"
                  ? await adapter.createQuest(detailId, { title: "New Quest" }, creatorToken)
                  : form === "counter"
                    ? await adapter.createCounter(detailId, { title: "New Counter" }, creatorToken)
                    : await adapter.createAsset(detailId, { title: "New Asset" }, creatorToken);
        dispatch({ type: "createSucceeded", form, detail, message: buildSavedMessage() });
        const tab = entityFormToTab(form);
        const createdSlug =
          form === "actor"
            ? detail.actors[detail.actors.length - 1]?.actorSlug
            : form === "location"
              ? detail.locations[detail.locations.length - 1]?.locationSlug
              : form === "encounter"
                ? detail.encounters[detail.encounters.length - 1]?.encounterSlug
                : form === "quest"
                  ? detail.quests[detail.quests.length - 1]?.questSlug
                  : form === "counter"
                    ? detail.counters[detail.counters.length - 1]?.slug
                    : detail.assets[detail.assets.length - 1]?.assetSlug;
        if (createdSlug) {
          navigateTo(buildRoute(detail.index.slug, tab, createdSlug));
        }
      } catch (createError) {
        const message =
          createError instanceof Error ? createError.message : `Could not create ${form}.`;
        dispatch({ type: "setCreateError", form, message });
        dispatch({ type: "setCreating", form, creating: false });
        dispatch({ type: "setAutosaveState", status: "error", message });
      }
    },
    [adapter, buildRoute, creatorToken, editable, navigateTo, state.creating, state.detail],
  );

  const deleteEntity = useCallback(
    async (form: EntityFormKey, slugToDelete: string, title: string): Promise<void> => {
      if (!state.detail || !editable || !window.confirm(`Delete "${title}"?`)) {
        return;
      }
      dispatch({ type: "setAutosaveState", status: "saving" });
      try {
        const detailId = adapter.getDetailId(state.detail);
        const detail =
          form === "actor"
            ? await adapter.deleteActor(detailId, slugToDelete, creatorToken)
            : form === "location"
              ? await adapter.deleteLocation(detailId, slugToDelete, creatorToken)
              : form === "encounter"
                ? await adapter.deleteEncounter(detailId, slugToDelete, creatorToken)
                : form === "quest"
                  ? await adapter.deleteQuest(detailId, slugToDelete, creatorToken)
                  : form === "counter"
                    ? await adapter.deleteCounter(detailId, slugToDelete, creatorToken)
                    : await adapter.deleteAsset(detailId, slugToDelete, creatorToken);
        dispatch({ type: "deleteSucceeded", form, detail, message: buildSavedMessage() });
        if (state.route.entityId === slugToDelete) {
          navigateTo(buildRoute(detail.index.slug, entityFormToTab(form)));
        }
      } catch (deleteError) {
        dispatch({
          type: "setAutosaveState",
          status: "error",
          message:
            deleteError instanceof Error ? deleteError.message : `Could not delete ${form}.`,
        });
      }
    },
    [adapter, buildRoute, creatorToken, editable, navigateTo, state.detail, state.route.entityId],
  );

  const adjustCounterValue = useCallback(
    async (
      counterSlug: string,
      delta: number,
      target: "current" | "max" = "current",
    ): Promise<void> => {
      if (!state.detail || !editable || savingRef.current) {
        return;
      }
      const persistedCounter =
        state.detail.counters.find((counter) => counter.slug === counterSlug) ?? null;
      if (!persistedCounter) {
        return;
      }
      const nextPayload = buildAdjustedCounterPayload(
        {
          title: persistedCounter.title,
          iconSlug: persistedCounter.iconSlug,
          currentValue: persistedCounter.currentValue,
          maxValue: persistedCounter.maxValue,
          description: persistedCounter.description ?? "",
        },
        delta,
        target,
      );
      dispatch({
        type: "saveStarted",
        form: "counter",
        optimisticDetail: buildOptimisticDetail(state.detail, "counter", {
          ...state.forms,
          counter: {
            ...(state.forms.counter
              ? toCounterFormState(
                  state.detail.counters.find((entry) => entry.slug === counterSlug) ??
                    persistedCounter,
                )
              : {
                  slug: counterSlug,
                  title: nextPayload.title,
                  iconSlug: nextPayload.iconSlug,
                  currentValue: nextPayload.currentValue,
                  maxValue: nextPayload.maxValue,
                  description: nextPayload.description,
                }),
            ...nextPayload,
            slug: counterSlug,
          },
        }) as TDetail,
      });
      savingRef.current = true;
      try {
        const detail = await adapter.updateCounter(
          adapter.getDetailId(state.detail),
          counterSlug,
          {
            title: nextPayload.title,
            iconSlug: nextPayload.iconSlug,
            currentValue: nextPayload.currentValue,
            maxValue: nextPayload.maxValue ?? null,
            description: nextPayload.description,
          },
          creatorToken,
        );
        dispatch({ type: "saveSucceeded", form: "counter", detail, message: buildSavedMessage() });
      } catch (saveError) {
        dispatch({
          type: "saveFailed",
          form: "counter",
          message:
            saveError instanceof Error ? saveError.message : "Could not update counter.",
        });
      } finally {
        savingRef.current = false;
      }
    },
    [adapter, creatorToken, editable, state.detail, state.forms],
  );

  const persistCoverImage = useCallback(
    async (coverImageUrl: string | null): Promise<void> => {
      if (!state.detail || !editable || savingRef.current) {
        return;
      }
      dispatch({
        type: "saveStarted",
        form: "base",
        optimisticDetail: {
          ...state.detail,
          coverImageUrl: coverImageUrl ?? undefined,
        } as TDetail,
      });
      savingRef.current = true;
      try {
        const detail = await adapter.updateCoverImage(
          adapter.getDetailId(state.detail),
          { coverImageUrl },
          creatorToken,
        );
        dispatch({ type: "saveSucceeded", form: "base", detail, message: buildSavedMessage() });
      } catch (saveError) {
        dispatch({
          type: "saveFailed",
          form: "base",
          message:
            saveError instanceof Error ? saveError.message : "Could not update cover image.",
        });
      } finally {
        savingRef.current = false;
      }
    },
    [adapter, creatorToken, editable, state.detail],
  );

  const value = useMemo<AuthoringProviderValue<TDetail>>(
    () => ({
      state,
      editable,
      creatorToken,
      buildRoute,
      navigateTo,
      refresh,
      flushActiveForm,
      flushForm,
      changeField,
      createEntity,
      deleteEntity,
      adjustCounterValue,
      persistCoverImage,
    }),
    [
      adjustCounterValue,
      buildRoute,
      changeField,
      createEntity,
      creatorToken,
      deleteEntity,
      editable,
      flushActiveForm,
      flushForm,
      navigateTo,
      persistCoverImage,
      refresh,
      state,
    ],
  );

  return <AuthoringContext.Provider value={value}>{children}</AuthoringContext.Provider>;
};

export const useAuthoringContext = <
  TDetail extends SharedAuthoringDetail = SharedAuthoringDetail,
>(): AuthoringProviderValue<TDetail> => {
  const context = useContext(AuthoringContext);
  if (!context) {
    throw new Error("useAuthoringContext must be used within AuthoringProvider.");
  }
  return context as AuthoringProviderValue<TDetail>;
};
