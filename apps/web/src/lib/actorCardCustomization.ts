import type {
  ActorBaseLayerSlug,
  ActorTacticalRoleSlug,
  ActorTacticalSpecialSlug,
} from "@mighty-decks/spec/actorCards";
import {
  actorTacticalRoleMap,
  actorTacticalSpecialMap,
  getActorBaseImageUri,
  type ActorCardAction,
} from "../data/actorCards";

export interface CustomActorCardDraft {
  imageUrl: string;
  adjective: string;
  noun: string;
  nounDescription: string;
  adjectiveDescription: string;
}

export interface GenericActorCardSeedSource {
  baseLayerSlug: ActorBaseLayerSlug;
  tacticalRoleSlug: ActorTacticalRoleSlug;
  tacticalSpecialSlug?: ActorTacticalSpecialSlug;
}

const actionToTokenText = (action: ActorCardAction): string => {
  if (typeof action === "string") {
    return action;
  }

  const parts: string[] = [];
  if (action.count && action.count > 1) {
    parts.push(`${action.count}x`);
  }
  parts.push(`[${action.type}]`);
  for (const effectOrJoin of action.effect) {
    if (typeof effectOrJoin === "string") {
      parts.push(effectOrJoin);
      continue;
    }
    parts.push(
      `[${effectOrJoin.effectType}${effectOrJoin.amount > 1 ? effectOrJoin.amount : ""}]`,
    );
  }
  if (action.splash) {
    parts.push("[splash]");
  }
  if (action.range) {
    parts.push(`[range]${action.range}`);
  }

  return parts.join("");
};

export const buildGenericActorNounDescription = ({
  tacticalRoleSlug,
  tacticalSpecialSlug,
}: Pick<
  GenericActorCardSeedSource,
  "tacticalRoleSlug" | "tacticalSpecialSlug"
>): string => {
  const role = actorTacticalRoleMap[tacticalRoleSlug];
  const special = tacticalSpecialSlug
    ? actorTacticalSpecialMap[tacticalSpecialSlug]
    : undefined;
  const roleRows = [
    role.toughness ?? "",
    ...(role.actions ?? []).map((action) => actionToTokenText(action)),
  ];
  const specialRows = special
    ? [
        "toughnessBonus" in special ? special.toughnessBonus ?? "" : "",
        ...("actionBonuses" in special ? special.actionBonuses ?? [] : []),
      ]
    : [];
  const rows: string[] = [];

  for (let index = 0; index < roleRows.length; index += 1) {
    const roleText = roleRows[index] ?? "";
    const specialText = specialRows[index] ?? "";
    const row = [roleText, specialText]
      .map((value) => value.trim())
      .filter((value) => value.length > 0)
      .join(" ");
    if (row.length > 0) {
      rows.push(row);
    }
  }

  return rows.join("\n");
};

export const buildCustomActorCardDraft = ({
  baseLayerSlug,
  tacticalRoleSlug,
  tacticalSpecialSlug,
}: GenericActorCardSeedSource): CustomActorCardDraft => {
  const role = actorTacticalRoleMap[tacticalRoleSlug];
  const special = tacticalSpecialSlug
    ? actorTacticalSpecialMap[tacticalSpecialSlug]
    : undefined;

  return {
    imageUrl: getActorBaseImageUri(baseLayerSlug),
    adjective: special?.name ?? "",
    noun: role.name,
    nounDescription: buildGenericActorNounDescription({
      tacticalRoleSlug,
      tacticalSpecialSlug,
    }),
    adjectiveDescription:
      special && "special" in special ? special.special ?? "" : "",
  };
};

export const isEmptyCustomActorCardDraft = (
  custom: CustomActorCardDraft,
): boolean =>
  custom.imageUrl.trim().length === 0 &&
  custom.adjective.trim().length === 0 &&
  custom.noun.trim().length === 0 &&
  custom.nounDescription.trim().length === 0 &&
  custom.adjectiveDescription.trim().length === 0;
