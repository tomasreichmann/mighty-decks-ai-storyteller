import {
  toActorFormState,
  toAssetFormState,
  toBaseFormState,
  toCounterFormState,
  toEncounterFormState,
  toLocationFormState,
  toPlayerInfoFormState,
  toQuestFormState,
  toStorytellerInfoFormState,
} from "../sharedAuthoring";
import type {
  AuthoringAction,
  AuthoringDetailType,
  AuthoringForms,
  AuthoringState,
  CreateErrorState,
  CreatingState,
  DirtyState,
  EntityFormKey,
  SharedAuthoringDetail as StoreSharedAuthoringDetail,
  ValidationState,
} from "./authoringStoreTypes";

const createDefaultForms = (): AuthoringForms => ({
  base: {
    title: "",
    premise: "",
    haveTags: [],
    avoidTags: [],
  },
  playerInfo: {
    summary: "",
    infoText: "",
  },
  storytellerInfo: {
    summary: "",
    infoText: "",
  },
  actor: null,
  location: null,
  encounter: null,
  quest: null,
  counter: null,
  asset: null,
});

const createDirtyState = (): DirtyState => ({
  base: false,
  playerInfo: false,
  storytellerInfo: false,
  actor: false,
  location: false,
  encounter: false,
  quest: false,
  counter: false,
  asset: false,
});

const createValidationState = (): ValidationState => ({
  base: null,
  playerInfo: null,
  storytellerInfo: null,
  actor: null,
  location: null,
  encounter: null,
  quest: null,
  counter: null,
  asset: null,
});

const createCreatingState = (): CreatingState => ({
  actor: false,
  location: false,
  encounter: false,
  quest: false,
  counter: false,
  asset: false,
});

const createCreateErrorState = (): CreateErrorState => ({
  actor: null,
  location: null,
  encounter: null,
  quest: null,
  counter: null,
  asset: null,
});

const resolveActorForm = (
  detail: StoreSharedAuthoringDetail,
  entityId: string | undefined,
): AuthoringForms["actor"] => {
  if (!entityId) {
    return null;
  }
  const actor = detail.actors.find((entry) => entry.actorSlug === entityId);
  return actor ? toActorFormState(actor) : null;
};

const resolveLocationForm = (
  detail: StoreSharedAuthoringDetail,
  entityId: string | undefined,
): AuthoringForms["location"] => {
  if (!entityId) {
    return null;
  }
  const location = detail.locations.find(
    (entry) => entry.locationSlug === entityId,
  );
  return location ? toLocationFormState(location) : null;
};

const resolveEncounterForm = (
  detail: StoreSharedAuthoringDetail,
  entityId: string | undefined,
): AuthoringForms["encounter"] => {
  if (!entityId) {
    return null;
  }
  const encounter = detail.encounters.find(
    (entry) => entry.encounterSlug === entityId,
  );
  return encounter ? toEncounterFormState(encounter) : null;
};

const resolveQuestForm = (
  detail: StoreSharedAuthoringDetail,
  entityId: string | undefined,
): AuthoringForms["quest"] => {
  if (!entityId) {
    return null;
  }
  const quest = detail.quests.find((entry) => entry.questSlug === entityId);
  return quest ? toQuestFormState(quest) : null;
};

const resolveCounterForm = (
  detail: StoreSharedAuthoringDetail,
  entityId: string | undefined,
): AuthoringForms["counter"] => {
  if (!entityId) {
    return null;
  }
  const counter = detail.counters.find((entry) => entry.slug === entityId);
  return counter ? toCounterFormState(counter) : null;
};

const resolveAssetForm = (
  detail: StoreSharedAuthoringDetail,
  entityId: string | undefined,
): AuthoringForms["asset"] => {
  if (!entityId) {
    return null;
  }
  const asset = detail.assets.find((entry) => entry.assetSlug === entityId);
  return asset ? toAssetFormState(asset) : null;
};

const hydrateForms = (
  detail: StoreSharedAuthoringDetail,
  activeTab: string,
  entityId?: string,
): AuthoringForms => ({
  base: toBaseFormState(detail.index),
  playerInfo: toPlayerInfoFormState(detail),
  storytellerInfo: toStorytellerInfoFormState(detail),
  actor: activeTab === "actors" ? resolveActorForm(detail, entityId) : null,
  location:
    activeTab === "locations" ? resolveLocationForm(detail, entityId) : null,
  encounter:
    activeTab === "encounters" ? resolveEncounterForm(detail, entityId) : null,
  quest: activeTab === "quests" ? resolveQuestForm(detail, entityId) : null,
  counter:
    activeTab === "counters" ? resolveCounterForm(detail, entityId) : null,
  asset: activeTab === "assets" ? resolveAssetForm(detail, entityId) : null,
});

const updateFormField = <TForm extends object | null>(
  form: TForm,
  field: string,
  value: unknown,
): TForm => {
  if (!form) {
    return form;
  }
  return {
    ...form,
    [field]: value,
  };
};

const resetEntityFormErrors = (
  validation: ValidationState,
  createErrors: CreateErrorState,
  form: EntityFormKey,
): {
  nextValidation: ValidationState;
  nextCreateErrors: CreateErrorState;
} => ({
  nextValidation: {
    ...validation,
    [form]: null,
  },
  nextCreateErrors: {
    ...createErrors,
    [form]: null,
  },
});

export const createInitialAuthoringState = ({
  detailType,
  activeTab,
  entityId,
}: {
  detailType: AuthoringDetailType;
  activeTab: string;
  entityId?: string;
}): AuthoringState => ({
  detailType,
  detail: null,
  loading: true,
  error: null,
  route: {
    activeTab,
    entityId,
  },
  forms: createDefaultForms(),
  dirty: createDirtyState(),
  validation: createValidationState(),
  creating: createCreatingState(),
  createErrors: createCreateErrorState(),
  autosave: {
    status: "idle",
  },
  pendingSave: null,
});

export const authoringReducer = <
  TDetail extends StoreSharedAuthoringDetail = StoreSharedAuthoringDetail,
>(
  state: AuthoringState<TDetail>,
  action: AuthoringAction<TDetail>,
): AuthoringState<TDetail> => {
  switch (action.type) {
    case "syncRoute": {
      return state.detail
        ? {
            ...state,
            route: {
              activeTab: action.activeTab,
              entityId: action.entityId,
            },
            forms: hydrateForms(state.detail, action.activeTab, action.entityId),
            dirty: createDirtyState(),
            validation: createValidationState(),
            pendingSave: null,
          }
        : {
            ...state,
            route: {
              activeTab: action.activeTab,
              entityId: action.entityId,
            },
          };
    }
    case "loadStarted":
      return {
        ...state,
        loading: true,
        error: null,
      };
    case "loadSucceeded":
      return {
        ...state,
        detail: action.detail,
        loading: false,
        error: null,
        forms: hydrateForms(
          action.detail,
          state.route.activeTab,
          state.route.entityId,
        ),
        dirty: createDirtyState(),
        validation: createValidationState(),
        createErrors: createCreateErrorState(),
        autosave: {
          status: "idle",
        },
        pendingSave: null,
      };
    case "loadFailed":
      return {
        ...state,
        loading: false,
        error: action.message,
        autosave: {
          status: "error",
          message: action.message,
        },
      };
    case "setDraftField": {
      const nextForms: AuthoringForms = {
        ...state.forms,
        [action.form]: updateFormField(
          state.forms[action.form],
          action.field,
          action.value,
        ),
      };
      const nextDirty: DirtyState = {
        ...state.dirty,
        [action.form]: true,
      };
      const nextValidation: ValidationState = {
        ...state.validation,
        [action.form]: null,
      };
      const nextState: AuthoringState<TDetail> = {
        ...state,
        forms: nextForms,
        dirty: nextDirty,
        validation: nextValidation,
      };
      if (
        action.form === "actor" ||
        action.form === "location" ||
        action.form === "encounter" ||
        action.form === "quest" ||
        action.form === "counter" ||
        action.form === "asset"
      ) {
        const { nextCreateErrors } = resetEntityFormErrors(
          nextValidation,
          state.createErrors,
          action.form,
        );
        return {
          ...nextState,
          createErrors: nextCreateErrors,
        };
      }
      return nextState;
    }
    case "setValidationMessage":
      return {
        ...state,
        validation: {
          ...state.validation,
          [action.form]: action.message,
        },
      };
    case "setCreateError":
      return {
        ...state,
        createErrors: {
          ...state.createErrors,
          [action.form]: action.message,
        },
      };
    case "setCreating":
      return {
        ...state,
        creating: {
          ...state.creating,
          [action.form]: action.creating,
        },
      };
    case "saveQueued":
      return {
        ...state,
        autosave: {
          status: "queued",
          message: "pending",
        },
      };
    case "setAutosaveState":
      return {
        ...state,
        autosave: {
          status: action.status,
          message: action.message,
        },
      };
    case "saveStarted":
      return {
        ...state,
        detail: action.optimisticDetail ?? state.detail,
        error: null,
        autosave: {
          status: "saving",
        },
        pendingSave:
          action.optimisticDetail && state.detail
            ? {
                form: action.form,
                previousDetail: state.detail,
              }
            : null,
      };
    case "saveSucceeded":
      return {
        ...state,
        detail: action.detail,
        forms: hydrateForms(
          action.detail,
          state.route.activeTab,
          state.route.entityId,
        ),
        dirty: {
          ...state.dirty,
          [action.form]: false,
        },
        validation: {
          ...state.validation,
          [action.form]: null,
        },
        autosave: {
          status: "saved",
          message:
            action.message ?? `at ${new Date().toLocaleTimeString()}`,
        },
        error: null,
        pendingSave: null,
      };
    case "saveFailed":
      return {
        ...state,
        detail: state.pendingSave?.previousDetail ?? state.detail,
        error: action.message,
        autosave: {
          status: "error",
          message: action.message,
        },
        pendingSave: null,
      };
    case "createSucceeded":
    case "deleteSucceeded":
      return {
        ...state,
        detail: action.detail,
        forms: hydrateForms(
          action.detail,
          state.route.activeTab,
          state.route.entityId,
        ),
        dirty: createDirtyState(),
        validation: createValidationState(),
        createErrors: createCreateErrorState(),
        creating: createCreatingState(),
        error: null,
        autosave: {
          status: "saved",
          message:
            action.message ?? `at ${new Date().toLocaleTimeString()}`,
        },
        pendingSave: null,
      };
    case "setError":
      return {
        ...state,
        error: action.message,
      };
    default:
      return state;
  }
};
