import { z } from "zod";

const titleCaseSlug = (value: string): string =>
  value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

export const actorBaseLayerSlugs = [
  "animal_blue",
  "animal_green",
  "animal_red",
  "animal_yellow",
  "aristocrat",
  "artillery_acid",
  "artillery_earth",
  "artillery_fire",
  "artillery_ice",
  "artillery_lightning",
  "assassin",
  "beast",
  "bruiser_blue",
  "bruiser_green",
  "bruiser_red",
  "bruiser_yellow",
  "civilian",
  "claw_blue",
  "claw_green",
  "claw_red",
  "claw_yellow",
  "cog",
  "commander",
  "construct",
  "guard_blue",
  "guard_green",
  "guard_red",
  "guard_yellow",
  "healer",
  "horror",
  "manipulator",
  "marksman_blue",
  "marksman_green",
  "marksman_red",
  "marksman_yellow",
  "merchant",
  "minion_blue",
  "minion_green",
  "minion_red",
  "minion_yellow",
  "sentry",
  "specialist",
  "swarm",
  "zealot",
] as const;
export type ActorBaseLayerSlug = (typeof actorBaseLayerSlugs)[number];
export const actorBaseLayerSlugSchema = z.enum(actorBaseLayerSlugs);

export const actorTacticalRoleSlugs = [
  "pawn",
  "minion",
  "thug",
  "brute",
  "tank",
  "champion",
  "assassin",
  "skirmisher",
  "ranger",
  "stalker",
  "commando",
  "marksman",
  "sniper",
  "grenadier",
  "bomber",
  "artillery",
] as const;
export type ActorTacticalRoleSlug = (typeof actorTacticalRoleSlugs)[number];
export const actorTacticalRoleSlugSchema = z.enum(actorTacticalRoleSlugs);

export const actorTacticalSpecialSlugs = [
  "tough",
  "shielded",
  "armoured",
  "alpha",
  "dangerous",
  "burning",
  "fiery",
  "freezing",
  "icy",
  "irritating",
  "corrupting",
  "fast",
  "harassing",
  "slowing",
  "elemental",
  "charging",
  "suicide",
  "grabbing",
  "webbing",
  "reaching",
  "healing",
  "restoring",
  "regenerating",
  "encouraging",
] as const;
export type ActorTacticalSpecialSlug =
  (typeof actorTacticalSpecialSlugs)[number];
export const actorTacticalSpecialSlugSchema = z.enum(actorTacticalSpecialSlugs);

export const defaultActorBaseLayerSlug: ActorBaseLayerSlug = "civilian";
export const defaultActorTacticalRoleSlug: ActorTacticalRoleSlug = "pawn";

export const actorBaseLayerCatalog = actorBaseLayerSlugs.map((slug) => ({
  slug,
  label: titleCaseSlug(slug),
}));

export const actorTacticalRoleCatalog = actorTacticalRoleSlugs.map((slug) => ({
  slug,
  label: titleCaseSlug(slug),
}));

export const actorTacticalSpecialCatalog = actorTacticalSpecialSlugs.map(
  (slug) => ({
    slug,
    label: titleCaseSlug(slug),
  }),
);
