import type { ReactNode } from "react";
import type { NavigateOptions } from "react-router-dom";
import type { AdventureModuleDetail } from "@mighty-decks/spec/adventureModuleAuthoring";
import type { CampaignDetail } from "@mighty-decks/spec/campaign";
import type { CounterAdjustTarget } from "../../gameCardCatalogContext";
import type {
  ActorFormState,
  AssetFormState,
  BaseFormState,
  CounterFormState,
  LocationFormState,
  EncounterFormState,
  PlayerInfoFormState,
  QuestFormState,
  StorytellerInfoFormState,
} from "../sharedAuthoring";
import type { AutosaveStatus } from "../../../components/adventure-module/AutosaveStatusBadge";

export type SharedAuthoringDetail = AdventureModuleDetail | CampaignDetail;
export type AuthoringDetailType = "module" | "campaign";

export interface AuthoringForms {
  base: BaseFormState;
  playerInfo: PlayerInfoFormState;
  storytellerInfo: StorytellerInfoFormState;
  actor: ActorFormState | null;
  location: LocationFormState | null;
  encounter: EncounterFormState | null;
  quest: QuestFormState | null;
  counter: CounterFormState | null;
  asset: AssetFormState | null;
}

export type AuthoringFormKey = keyof AuthoringForms;
export type EntityFormKey = Exclude<
  AuthoringFormKey,
  "base" | "playerInfo" | "storytellerInfo"
>;

export interface AuthoringAutosaveState {
  status: AutosaveStatus;
  message?: string;
}

export interface AuthoringPendingSave<TDetail extends SharedAuthoringDetail> {
  form: AuthoringFormKey;
  previousDetail: TDetail;
}

export interface AuthoringRouteState {
  activeTab: string;
  entityId?: string;
}

export type DirtyState = Record<AuthoringFormKey, boolean>;
export type ValidationState = Record<AuthoringFormKey, string | null>;
export type CreatingState = Record<EntityFormKey, boolean>;
export type CreateErrorState = Record<EntityFormKey, string | null>;

export interface AuthoringState<TDetail extends SharedAuthoringDetail = SharedAuthoringDetail> {
  detailType: AuthoringDetailType;
  detail: TDetail | null;
  loading: boolean;
  error: string | null;
  route: AuthoringRouteState;
  forms: AuthoringForms;
  dirty: DirtyState;
  validation: ValidationState;
  creating: CreatingState;
  createErrors: CreateErrorState;
  autosave: AuthoringAutosaveState;
  pendingSave: AuthoringPendingSave<TDetail> | null;
}

export interface AuthoringProviderValue<
  TDetail extends SharedAuthoringDetail = SharedAuthoringDetail,
> {
  state: AuthoringState<TDetail>;
  editable: boolean;
  creatorToken?: string;
  buildRoute: (slug: string, tab: string, entityId?: string) => string;
  navigateTo: (path: string, options?: NavigateOptions) => void;
  refresh: () => Promise<void>;
  flushActiveForm: () => Promise<void>;
  flushForm: (form: AuthoringFormKey) => Promise<void>;
  changeField: <
    TFormKey extends AuthoringFormKey,
    TField extends keyof NonNullable<AuthoringForms[TFormKey]>,
  >(
    form: TFormKey,
    field: TField,
    value: NonNullable<AuthoringForms[TFormKey]>[TField],
  ) => void;
  createEntity: (form: EntityFormKey) => Promise<void>;
  deleteEntity: (
    form: EntityFormKey,
    slug: string,
    title: string,
  ) => Promise<void>;
  adjustCounterValue: (
    counterSlug: string,
    delta: number,
    target?: CounterAdjustTarget,
  ) => Promise<void>;
  persistCoverImage: (coverImageUrl: string | null) => Promise<void>;
}

export interface AuthoringProviderProps<
  TDetail extends SharedAuthoringDetail = SharedAuthoringDetail,
> {
  adapter: AuthoringDomainAdapter<TDetail>;
  slug?: string;
  activeTab: string;
  entityId?: string;
  creatorToken?: string;
  buildRoute: (slug: string, tab: string, entityId?: string) => string;
  navigateTo: (path: string, options?: NavigateOptions) => void;
  children: ReactNode;
}

export interface AuthoringLoadOptions {
  slug: string;
  creatorToken?: string;
}

export interface AuthoringEntityUpdatePayload {
  title: string;
  summary?: string;
}

export interface AuthoringDomainAdapter<
  TDetail extends SharedAuthoringDetail = SharedAuthoringDetail,
> {
  detailType: AuthoringDetailType;
  detailLabel: "module" | "campaign";
  loadBySlug: (options: AuthoringLoadOptions) => Promise<TDetail>;
  updateIndex: (
    detailId: string,
    index: TDetail["index"],
    creatorToken?: string,
  ) => Promise<TDetail>;
  updateFragment: (
    detailId: string,
    fragmentId: string,
    content: string,
    creatorToken?: string,
  ) => Promise<TDetail>;
  updateActor: (
    detailId: string,
    actorSlug: string,
    payload: {
      title: string;
      summary: string;
      baseLayerSlug: TDetail["actors"][number]["baseLayerSlug"];
      tacticalRoleSlug: TDetail["actors"][number]["tacticalRoleSlug"];
      tacticalSpecialSlug?: TDetail["actors"][number]["tacticalSpecialSlug"] | null;
      isPlayerCharacter: boolean;
      content: string;
    },
    creatorToken?: string,
  ) => Promise<TDetail>;
  updateLocation: (
    detailId: string,
    locationSlug: string,
    payload: {
      title: string;
      summary: string;
      titleImageUrl?: string | null;
      introductionMarkdown: string;
      descriptionMarkdown: string;
      mapImageUrl?: string | null;
      mapPins: TDetail["locations"][number]["mapPins"];
    },
    creatorToken?: string,
  ) => Promise<TDetail>;
  updateEncounter: (
    detailId: string,
    encounterSlug: string,
    payload: {
      title: string;
      summary: string;
      prerequisites: string;
      titleImageUrl?: string | null;
      content: string;
    },
    creatorToken?: string,
  ) => Promise<TDetail>;
  updateQuest: (
    detailId: string,
    questSlug: string,
    payload: {
      title: string;
      summary: string;
      titleImageUrl?: string | null;
      content: string;
    },
    creatorToken?: string,
  ) => Promise<TDetail>;
  updateCounter: (
    detailId: string,
    counterSlug: string,
    payload: {
      title: string;
      iconSlug: string;
      currentValue: number;
      maxValue?: number | null;
      description: string;
    },
    creatorToken?: string,
  ) => Promise<TDetail>;
  updateAsset: (
    detailId: string,
    assetSlug: string,
    payload: {
      title: string;
      summary: string;
      modifier: string;
      noun: string;
      nounDescription: string;
      adjectiveDescription: string;
      iconUrl: string;
      overlayUrl: string;
      content: string;
    },
    creatorToken?: string,
  ) => Promise<TDetail>;
  updateCoverImage: (
    detailId: string,
    payload: { coverImageUrl?: string | null },
    creatorToken?: string,
  ) => Promise<TDetail>;
  createActor: (
    detailId: string,
    payload: { title: string; isPlayerCharacter: boolean },
    creatorToken?: string,
  ) => Promise<TDetail>;
  createLocation: (
    detailId: string,
    payload: { title: string },
    creatorToken?: string,
  ) => Promise<TDetail>;
  createEncounter: (
    detailId: string,
    payload: { title: string },
    creatorToken?: string,
  ) => Promise<TDetail>;
  createQuest: (
    detailId: string,
    payload: { title: string },
    creatorToken?: string,
  ) => Promise<TDetail>;
  createCounter: (
    detailId: string,
    payload: { title: string },
    creatorToken?: string,
  ) => Promise<TDetail>;
  createAsset: (
    detailId: string,
    payload: { title: string },
    creatorToken?: string,
  ) => Promise<TDetail>;
  deleteActor: (
    detailId: string,
    actorSlug: string,
    creatorToken?: string,
  ) => Promise<TDetail>;
  deleteLocation: (
    detailId: string,
    locationSlug: string,
    creatorToken?: string,
  ) => Promise<TDetail>;
  deleteEncounter: (
    detailId: string,
    encounterSlug: string,
    creatorToken?: string,
  ) => Promise<TDetail>;
  deleteQuest: (
    detailId: string,
    questSlug: string,
    creatorToken?: string,
  ) => Promise<TDetail>;
  deleteCounter: (
    detailId: string,
    counterSlug: string,
    creatorToken?: string,
  ) => Promise<TDetail>;
  deleteAsset: (
    detailId: string,
    assetSlug: string,
    creatorToken?: string,
  ) => Promise<TDetail>;
  getDetailId: (detail: TDetail) => string;
}

export interface AuthoringEditorConfig {
  form: AuthoringFormKey;
  entityTab?: string;
}

export type AuthoringAction<TDetail extends SharedAuthoringDetail = SharedAuthoringDetail> =
  | {
      type: "syncRoute";
      activeTab: string;
      entityId?: string;
    }
  | {
      type: "loadStarted";
    }
  | {
      type: "loadSucceeded";
      detail: TDetail;
    }
  | {
      type: "loadFailed";
      message: string;
    }
  | {
      type: "setDraftField";
      form: AuthoringFormKey;
      field: string;
      value: unknown;
    }
  | {
      type: "setValidationMessage";
      form: AuthoringFormKey;
      message: string | null;
    }
  | {
      type: "setCreateError";
      form: EntityFormKey;
      message: string | null;
    }
  | {
      type: "setCreating";
      form: EntityFormKey;
      creating: boolean;
    }
  | {
      type: "saveQueued";
    }
  | {
      type: "setAutosaveState";
      status: AutosaveStatus;
      message?: string;
    }
  | {
      type: "saveStarted";
      form: AuthoringFormKey;
      optimisticDetail?: TDetail;
    }
  | {
      type: "saveSucceeded";
      form: AuthoringFormKey;
      detail: TDetail;
      message?: string;
    }
  | {
      type: "saveFailed";
      form: AuthoringFormKey;
      message: string;
    }
  | {
      type: "createSucceeded";
      form: EntityFormKey;
      detail: TDetail;
      message?: string;
    }
  | {
      type: "deleteSucceeded";
      form: EntityFormKey;
      detail: TDetail;
      message?: string;
    }
  | {
      type: "setError";
      message: string | null;
    };
