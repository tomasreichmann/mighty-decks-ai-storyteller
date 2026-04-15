import { normalizeLegacyGameCardMarkdown } from "../gameCardMarkdown";
import { clampCounterValue } from "./sharedAuthoringHelpers";
import type {
  ActorFormState,
  AssetFormState,
  BaseFormState,
  CounterFormState,
  EncounterFormState,
  LocationFormState,
  PlayerInfoFormState,
  QuestFormState,
  StorytellerInfoFormState,
} from "./sharedAuthoringTypes";

const normalizeTagEntry = (value: string): string =>
  value.trim().replace(/\s+/g, " ");

const parseTagEntries = (
  values: string[],
  label: "Have" | "Avoid",
): { entries: string[]; error?: string } => {
  const entries: string[] = [];
  const seen = new Set<string>();

  for (const [index, rawEntry] of values.entries()) {
    const entry = normalizeTagEntry(rawEntry);
    if (!entry) {
      continue;
    }

    if (entry.length > 160) {
      return {
        entries,
        error: `${label} tag ${index + 1} exceeds 160 characters.`,
      };
    }

    const key = entry.toLocaleLowerCase();
    if (seen.has(key)) {
      return {
        entries,
        error: `${label} has duplicate tag "${entry}".`,
      };
    }
    seen.add(key);
    entries.push(entry);
  }

  if (entries.length > 12) {
    return {
      entries,
      error: `${label} can have at most 12 tags.`,
    };
  }

  return { entries };
};

export const validateBaseForm = (
  form: BaseFormState,
): {
  title: string;
  premise: string;
  dos: string[];
  donts: string[];
  error?: string;
} => {
  const title = form.title.trim();
  if (title.length === 0) {
    return {
      title,
      premise: form.premise.trim(),
      dos: [],
      donts: [],
      error: "Title is required.",
    };
  }
  if (title.length > 120) {
    return {
      title,
      premise: form.premise.trim(),
      dos: [],
      donts: [],
      error: "Title must be at most 120 characters.",
    };
  }

  const premise = form.premise.trim();
  if (premise.length === 0) {
    return {
      title,
      premise,
      dos: [],
      donts: [],
      error: "Premise is required.",
    };
  }
  if (premise.length > 500) {
    return {
      title,
      premise,
      dos: [],
      donts: [],
      error: "Premise must be at most 500 characters.",
    };
  }

  const parsedHave = parseTagEntries(form.haveTags, "Have");
  if (parsedHave.error) {
    return {
      title,
      premise,
      dos: parsedHave.entries,
      donts: [],
      error: parsedHave.error,
    };
  }

  const parsedAvoid = parseTagEntries(form.avoidTags, "Avoid");
  if (parsedAvoid.error) {
    return {
      title,
      premise,
      dos: parsedHave.entries,
      donts: parsedAvoid.entries,
      error: parsedAvoid.error,
    };
  }

  return {
    title,
    premise,
    dos: parsedHave.entries,
    donts: parsedAvoid.entries,
  };
};

export const validatePlayerInfoForm = (
  form: PlayerInfoFormState,
): {
  summary: string;
  infoText: string;
  error?: string;
} => {
  const normalizedSummary = normalizeLegacyGameCardMarkdown(form.summary);
  if (normalizedSummary.length > 200000) {
    return {
      summary: normalizedSummary,
      infoText: form.infoText,
      error: "Player summary markdown must be at most 200000 characters.",
    };
  }
  const normalizedInfoText = normalizeLegacyGameCardMarkdown(form.infoText);
  if (normalizedInfoText.length > 200000) {
    return {
      summary: normalizedSummary,
      infoText: normalizedInfoText,
      error: "Player info text must be at most 200000 characters.",
    };
  }
  return {
    summary: normalizedSummary,
    infoText: normalizedInfoText,
  };
};

export const validateStorytellerInfoForm = (
  form: StorytellerInfoFormState,
): {
  summary: string;
  infoText: string;
  error?: string;
} => {
  const normalizedSummary = normalizeLegacyGameCardMarkdown(form.summary);
  if (normalizedSummary.length > 200000) {
    return {
      summary: normalizedSummary,
      infoText: form.infoText,
      error: "Storyteller summary markdown must be at most 200000 characters.",
    };
  }
  const normalizedInfoText = normalizeLegacyGameCardMarkdown(form.infoText);
  if (normalizedInfoText.length > 200000) {
    return {
      summary: normalizedSummary,
      infoText: normalizedInfoText,
      error: "Storyteller info text must be at most 200000 characters.",
    };
  }
  return {
    summary: normalizedSummary,
    infoText: normalizedInfoText,
  };
};

export const validateActorForm = (
  form: ActorFormState,
): {
  title: string;
  summary: string;
  baseLayerSlug: ActorFormState["baseLayerSlug"];
  tacticalRoleSlug: ActorFormState["tacticalRoleSlug"];
  tacticalSpecialSlug?: ActorFormState["tacticalSpecialSlug"];
  isPlayerCharacter: boolean;
  content: string;
  error?: string;
} => {
  const title = form.title.trim();
  if (title.length === 0) {
    return {
      title,
      summary: form.summary.trim(),
      baseLayerSlug: form.baseLayerSlug,
      tacticalRoleSlug: form.tacticalRoleSlug,
      tacticalSpecialSlug: form.tacticalSpecialSlug,
      isPlayerCharacter: form.isPlayerCharacter,
      content: normalizeLegacyGameCardMarkdown(form.content),
      error: "Actor name is required.",
    };
  }
  if (title.length > 120) {
    return {
      title,
      summary: form.summary.trim(),
      baseLayerSlug: form.baseLayerSlug,
      tacticalRoleSlug: form.tacticalRoleSlug,
      tacticalSpecialSlug: form.tacticalSpecialSlug,
      isPlayerCharacter: form.isPlayerCharacter,
      content: normalizeLegacyGameCardMarkdown(form.content),
      error: "Actor name must be at most 120 characters.",
    };
  }

  const summary = form.summary.trim();
  if (summary.length > 500) {
    return {
      title,
      summary,
      baseLayerSlug: form.baseLayerSlug,
      tacticalRoleSlug: form.tacticalRoleSlug,
      tacticalSpecialSlug: form.tacticalSpecialSlug,
      isPlayerCharacter: form.isPlayerCharacter,
      content: normalizeLegacyGameCardMarkdown(form.content),
      error: "Actor summary must be at most 500 characters.",
    };
  }

  const content = normalizeLegacyGameCardMarkdown(form.content);
  if (content.length > 200_000) {
    return {
      title,
      summary,
      baseLayerSlug: form.baseLayerSlug,
      tacticalRoleSlug: form.tacticalRoleSlug,
      tacticalSpecialSlug: form.tacticalSpecialSlug,
      isPlayerCharacter: form.isPlayerCharacter,
      content,
      error: "Actor markdown must be at most 200000 characters.",
    };
  }

  return {
    title,
    summary,
    baseLayerSlug: form.baseLayerSlug,
    tacticalRoleSlug: form.tacticalRoleSlug,
    tacticalSpecialSlug: form.tacticalSpecialSlug,
    isPlayerCharacter: form.isPlayerCharacter,
    content,
  };
};

export const validateCounterForm = (
  form: CounterFormState,
): {
  title: string;
  iconSlug: CounterFormState["iconSlug"];
  currentValue: number;
  maxValue?: number;
  description: string;
  error?: string;
} => {
  const title = form.title.trim();
  if (title.length === 0) {
    return {
      title,
      iconSlug: form.iconSlug,
      currentValue: clampCounterValue(form.currentValue, form.maxValue),
      maxValue: form.maxValue,
      description: form.description.trim(),
      error: "Counter name is required.",
    };
  }
  if (title.length > 120) {
    return {
      title,
      iconSlug: form.iconSlug,
      currentValue: clampCounterValue(form.currentValue, form.maxValue),
      maxValue: form.maxValue,
      description: form.description.trim(),
      error: "Counter name must be at most 120 characters.",
    };
  }

  const description = form.description.trim();
  if (description.length > 500) {
    return {
      title,
      iconSlug: form.iconSlug,
      currentValue: clampCounterValue(form.currentValue, form.maxValue),
      maxValue: form.maxValue,
      description,
      error: "Counter description must be at most 500 characters.",
    };
  }

  const maxValue =
    typeof form.maxValue === "number"
      ? Math.max(0, Math.trunc(form.maxValue))
      : undefined;
  const currentValue = clampCounterValue(form.currentValue, maxValue);

  return {
    title,
    iconSlug: form.iconSlug,
    currentValue,
    maxValue,
    description,
  };
};

export const validateAssetForm = (
  form: AssetFormState,
): {
  title: string;
  summary: string;
  modifier: string;
  noun: string;
  nounDescription: string;
  adjectiveDescription: string;
  iconUrl: string;
  overlayUrl: string;
  content: string;
  error?: string;
} => {
  const title = form.title.trim();
  const summary = form.summary.trim();
  const modifier = form.modifier.trim();
  const noun = form.noun.trim();
  const nounDescription = form.nounDescription.trim();
  const adjectiveDescription = form.adjectiveDescription.trim();
  const iconUrl = form.iconUrl.trim();
  const overlayUrl = form.overlayUrl.trim();
  const content = normalizeLegacyGameCardMarkdown(form.content);

  if (title.length === 0) {
    return {
      title,
      summary,
      modifier,
      noun,
      nounDescription,
      adjectiveDescription,
      iconUrl,
      overlayUrl,
      content,
      error: "Asset name is required.",
    };
  }
  if (title.length > 120) {
    return {
      title,
      summary,
      modifier,
      noun,
      nounDescription,
      adjectiveDescription,
      iconUrl,
      overlayUrl,
      content,
      error: "Asset name must be at most 120 characters.",
    };
  }
  if (summary.length > 500) {
    return {
      title,
      summary,
      modifier,
      noun,
      nounDescription,
      adjectiveDescription,
      iconUrl,
      overlayUrl,
      content,
      error: "Asset summary must be at most 500 characters.",
    };
  }
  if (modifier.length > 120) {
    return {
      title,
      summary,
      modifier,
      noun,
      nounDescription,
      adjectiveDescription,
      iconUrl,
      overlayUrl,
      content,
      error: "Asset modifier must be at most 120 characters.",
    };
  }
  if (noun.length === 0) {
    return {
      title,
      summary,
      modifier,
      noun,
      nounDescription,
      adjectiveDescription,
      iconUrl,
      overlayUrl,
      content,
      error: "Asset noun is required.",
    };
  }
  if (noun.length > 120) {
    return {
      title,
      summary,
      modifier,
      noun,
      nounDescription,
      adjectiveDescription,
      iconUrl,
      overlayUrl,
      content,
      error: "Asset noun must be at most 120 characters.",
    };
  }
  if (nounDescription.length === 0) {
    return {
      title,
      summary,
      modifier,
      noun,
      nounDescription,
      adjectiveDescription,
      iconUrl,
      overlayUrl,
      content,
      error: "Asset noun description is required.",
    };
  }
  if (nounDescription.length > 500) {
    return {
      title,
      summary,
      modifier,
      noun,
      nounDescription,
      adjectiveDescription,
      iconUrl,
      overlayUrl,
      content,
      error: "Asset noun description must be at most 500 characters.",
    };
  }
  if (adjectiveDescription.length > 500) {
    return {
      title,
      summary,
      modifier,
      noun,
      nounDescription,
      adjectiveDescription,
      iconUrl,
      overlayUrl,
      content,
      error: "Asset adjective description must be at most 500 characters.",
    };
  }
  if (iconUrl.length === 0) {
    return {
      title,
      summary,
      modifier,
      noun,
      nounDescription,
      adjectiveDescription,
      iconUrl,
      overlayUrl,
      content,
      error: "Asset icon URL is required.",
    };
  }
  if (iconUrl.length > 500) {
    return {
      title,
      summary,
      modifier,
      noun,
      nounDescription,
      adjectiveDescription,
      iconUrl,
      overlayUrl,
      content,
      error: "Asset icon URL must be at most 500 characters.",
    };
  }
  if (overlayUrl.length > 500) {
    return {
      title,
      summary,
      modifier,
      noun,
      nounDescription,
      adjectiveDescription,
      iconUrl,
      overlayUrl,
      content,
      error: "Asset overlay URL must be at most 500 characters.",
    };
  }
  if (content.length > 200_000) {
    return {
      title,
      summary,
      modifier,
      noun,
      nounDescription,
      adjectiveDescription,
      iconUrl,
      overlayUrl,
      content,
      error: "Asset markdown must be at most 200000 characters.",
    };
  }

  return {
    title,
    summary,
    modifier,
    noun,
    nounDescription,
    adjectiveDescription,
    iconUrl,
    overlayUrl,
    content,
  };
};

export const validateLocationForm = (
  form: LocationFormState,
): {
  title: string;
  summary: string;
  titleImageUrl: string | null;
  introductionMarkdown: string;
  descriptionMarkdown: string;
  mapImageUrl: string | null;
  mapPins: LocationFormState["mapPins"];
  error?: string;
} => {
  const title = form.title.trim();
  if (title.length === 0) {
    return {
      title,
      summary: form.summary.trim(),
      titleImageUrl: form.titleImageUrl.trim() || null,
      introductionMarkdown: normalizeLegacyGameCardMarkdown(
        form.introductionMarkdown,
      ),
      descriptionMarkdown: normalizeLegacyGameCardMarkdown(
        form.descriptionMarkdown,
      ),
      mapImageUrl: form.mapImageUrl.trim() || null,
      mapPins: form.mapPins.map((pin) => ({ ...pin })),
      error: "Location name is required.",
    };
  }
  if (title.length > 120) {
    return {
      title,
      summary: form.summary.trim(),
      titleImageUrl: form.titleImageUrl.trim() || null,
      introductionMarkdown: normalizeLegacyGameCardMarkdown(
        form.introductionMarkdown,
      ),
      descriptionMarkdown: normalizeLegacyGameCardMarkdown(
        form.descriptionMarkdown,
      ),
      mapImageUrl: form.mapImageUrl.trim() || null,
      mapPins: form.mapPins.map((pin) => ({ ...pin })),
      error: "Location name must be at most 120 characters.",
    };
  }

  const summary = form.summary.trim();
  if (summary.length > 500) {
    return {
      title,
      summary,
      titleImageUrl: form.titleImageUrl.trim() || null,
      introductionMarkdown: normalizeLegacyGameCardMarkdown(
        form.introductionMarkdown,
      ),
      descriptionMarkdown: normalizeLegacyGameCardMarkdown(
        form.descriptionMarkdown,
      ),
      mapImageUrl: form.mapImageUrl.trim() || null,
      mapPins: form.mapPins.map((pin) => ({ ...pin })),
      error: "Location summary must be at most 500 characters.",
    };
  }

  const titleImageUrl = form.titleImageUrl.trim();
  if (titleImageUrl.length > 500) {
    return {
      title,
      summary,
      titleImageUrl: titleImageUrl.slice(0, 500),
      introductionMarkdown: normalizeLegacyGameCardMarkdown(
        form.introductionMarkdown,
      ),
      descriptionMarkdown: normalizeLegacyGameCardMarkdown(
        form.descriptionMarkdown,
      ),
      mapImageUrl: form.mapImageUrl.trim() || null,
      mapPins: form.mapPins.map((pin) => ({ ...pin })),
      error: "Title image URL must be at most 500 characters.",
    };
  }

  const introductionMarkdown = normalizeLegacyGameCardMarkdown(
    form.introductionMarkdown,
  );
  if (introductionMarkdown.length > 200_000) {
    return {
      title,
      summary,
      titleImageUrl: titleImageUrl || null,
      introductionMarkdown,
      descriptionMarkdown: normalizeLegacyGameCardMarkdown(
        form.descriptionMarkdown,
      ),
      mapImageUrl: form.mapImageUrl.trim() || null,
      mapPins: form.mapPins.map((pin) => ({ ...pin })),
      error: "Introduction markdown must be at most 200000 characters.",
    };
  }

  const descriptionMarkdown = normalizeLegacyGameCardMarkdown(
    form.descriptionMarkdown,
  );
  if (descriptionMarkdown.length > 200_000) {
    return {
      title,
      summary,
      titleImageUrl: titleImageUrl || null,
      introductionMarkdown,
      descriptionMarkdown,
      mapImageUrl: form.mapImageUrl.trim() || null,
      mapPins: form.mapPins.map((pin) => ({ ...pin })),
      error: "Description markdown must be at most 200000 characters.",
    };
  }

  const mapImageUrl = form.mapImageUrl.trim();
  if (mapImageUrl.length > 500) {
    return {
      title,
      summary,
      titleImageUrl: titleImageUrl || null,
      introductionMarkdown,
      descriptionMarkdown,
      mapImageUrl: mapImageUrl.slice(0, 500),
      mapPins: form.mapPins.map((pin) => ({ ...pin })),
      error: "Map image URL must be at most 500 characters.",
    };
  }

  return {
    title,
    summary,
    titleImageUrl: titleImageUrl || null,
    introductionMarkdown,
    descriptionMarkdown,
    mapImageUrl: mapImageUrl || null,
    mapPins: form.mapPins.map((pin) => ({ ...pin })),
  };
};

export const validateEncounterForm = (
  form: EncounterFormState,
): {
  title: string;
  summary: string;
  prerequisites: string;
  titleImageUrl: string | null;
  content: string;
  error?: string;
} => {
  const title = form.title.trim();
  if (title.length === 0) {
    return {
      title,
      summary: form.summary.trim(),
      prerequisites: form.prerequisites.trim(),
      titleImageUrl: form.titleImageUrl.trim() || null,
      content: normalizeLegacyGameCardMarkdown(form.content),
      error: "Encounter name is required.",
    };
  }
  if (title.length > 120) {
    return {
      title,
      summary: form.summary.trim(),
      prerequisites: form.prerequisites.trim(),
      titleImageUrl: form.titleImageUrl.trim() || null,
      content: normalizeLegacyGameCardMarkdown(form.content),
      error: "Encounter name must be at most 120 characters.",
    };
  }

  const summary = form.summary.trim();
  if (summary.length > 500) {
    return {
      title,
      summary,
      prerequisites: form.prerequisites.trim(),
      titleImageUrl: form.titleImageUrl.trim() || null,
      content: normalizeLegacyGameCardMarkdown(form.content),
      error: "Encounter summary must be at most 500 characters.",
    };
  }

  const prerequisites = form.prerequisites.trim();
  if (prerequisites.length > 240) {
    return {
      title,
      summary,
      prerequisites: prerequisites.slice(0, 240),
      titleImageUrl: form.titleImageUrl.trim() || null,
      content: normalizeLegacyGameCardMarkdown(form.content),
      error: "Encounter prerequisites must be at most 240 characters.",
    };
  }

  const titleImageUrl = form.titleImageUrl.trim();
  if (titleImageUrl.length > 500) {
    return {
      title,
      summary,
      prerequisites,
      titleImageUrl: titleImageUrl.slice(0, 500),
      content: normalizeLegacyGameCardMarkdown(form.content),
      error: "Title image URL must be at most 500 characters.",
    };
  }

  const content = normalizeLegacyGameCardMarkdown(form.content);
  if (content.length > 200_000) {
    return {
      title,
      summary,
      prerequisites,
      titleImageUrl: titleImageUrl || null,
      content,
      error: "Encounter markdown must be at most 200000 characters.",
    };
  }

  return {
    title,
    summary,
    prerequisites,
    titleImageUrl: titleImageUrl || null,
    content,
  };
};

export const validateQuestForm = (
  form: QuestFormState,
): {
  title: string;
  summary: string;
  titleImageUrl: string | null;
  content: string;
  error?: string;
} => {
  const title = form.title.trim();
  if (title.length === 0) {
    return {
      title,
      summary: form.summary.trim(),
      titleImageUrl: form.titleImageUrl.trim() || null,
      content: normalizeLegacyGameCardMarkdown(form.content),
      error: "Quest name is required.",
    };
  }
  if (title.length > 120) {
    return {
      title,
      summary: form.summary.trim(),
      titleImageUrl: form.titleImageUrl.trim() || null,
      content: normalizeLegacyGameCardMarkdown(form.content),
      error: "Quest name must be at most 120 characters.",
    };
  }

  const summary = form.summary.trim();
  if (summary.length > 500) {
    return {
      title,
      summary,
      titleImageUrl: form.titleImageUrl.trim() || null,
      content: normalizeLegacyGameCardMarkdown(form.content),
      error: "Quest summary must be at most 500 characters.",
    };
  }

  const titleImageUrl = form.titleImageUrl.trim();
  if (titleImageUrl.length > 500) {
    return {
      title,
      summary,
      titleImageUrl: titleImageUrl.slice(0, 500),
      content: normalizeLegacyGameCardMarkdown(form.content),
      error: "Title image URL must be at most 500 characters.",
    };
  }

  const content = normalizeLegacyGameCardMarkdown(form.content);
  if (content.length > 200_000) {
    return {
      title,
      summary,
      titleImageUrl: titleImageUrl || null,
      content,
      error: "Quest markdown must be at most 200000 characters.",
    };
  }

  return {
    title,
    summary,
    titleImageUrl: titleImageUrl || null,
    content,
  };
};
