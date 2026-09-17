import {
  cardCatalog,
  type CardFamily,
  type CatalogCard,
} from "@mighty-decks/components";

type ActorFamily = Extract<
  CardFamily,
  "actor-base" | "actor-role" | "actor-special"
>;

export interface RulesActorGroup {
  id: string;
  family: ActorFamily;
  heading: string;
  description: string;
  cards: CatalogCard[];
}

const actorGroups: Omit<RulesActorGroup, "cards">[] = [
  {
    id: "core-base",
    family: "actor-base",
    heading: "Core — Base",
    description: "Illustration and background layers for an Actor.",
  },
  {
    id: "core-tactical-role",
    family: "actor-role",
    heading: "Core — Tactical Role",
    description: "Role titles and the Actor's tactical mechanics.",
  },
  {
    id: "core-tactical-special",
    family: "actor-special",
    heading: "Core — Tactical Special",
    description: "Optional modifiers that add a distinct tactical rule.",
  },
];

export const rulesActorGroups: RulesActorGroup[] = actorGroups.map((group) => ({
  ...group,
  cards: cardCatalog.filter((card) => card.family === group.family),
}));
