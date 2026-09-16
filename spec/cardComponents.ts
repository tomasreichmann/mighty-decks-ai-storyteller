import { z } from "zod";

export const cardFamilies = [
  "outcome",
  "effect",
  "stunt",
  "actor-base",
  "actor-role",
  "actor-special",
  "asset-base",
  "asset-modifier",
  "counter",
  "location",
  "encounter",
  "quest",
] as const;

export type CardFamily = (typeof cardFamilies)[number];
export const cardFamilySchema = z.enum(cardFamilies);

export const supportedCardLocales = ["en"] as const;
export type CardLocale = (typeof supportedCardLocales)[number];
export const cardLocaleSchema = z.enum(supportedCardLocales);

export const customCardSchema = z.object({
  family: cardFamilySchema,
  id: z.string().min(1),
  title: z.string().min(1),
  artworkPath: z.string().min(1).optional(),
  body: z.string().optional(),
  footer: z.string().optional(),
  deck: z.string().optional(),
});

export type CustomCard = z.infer<typeof customCardSchema>;

export const cardExportInputSchema = z.object({
  locale: cardLocaleSchema,
  cards: z.array(customCardSchema),
});

export type CardExportInput = z.infer<typeof cardExportInputSchema>;

export const validateCardExportInput = (input: unknown): CardExportInput =>
  cardExportInputSchema.parse(input);
