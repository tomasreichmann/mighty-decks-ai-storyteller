import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const dist = resolve(import.meta.dirname, "../dist");
await mkdir(resolve(dist, "react"), { recursive: true });
await writeFile(resolve(dist, "index.d.ts"), `export type CardFamily = 'outcome' | 'effect' | 'stunt' | 'actor-base' | 'actor-role' | 'actor-special' | 'asset-base' | 'asset-modifier' | 'counter';
export interface CatalogCard { id: string; family: CardFamily; slug: string; title: string; locale: 'en'; description?: string; body?: string; footer?: string; deck?: string; artworkPath?: string; }
export interface StaticCardEntry extends CatalogCard { layout: 'full' | 'compact'; width: number; height: number; }
export interface CardExportInput { locale: 'en'; cards: Array<{ family: CardFamily; id: string; title: string; artworkPath?: string }>; }
export declare const contentVersion: string;
export declare const supportedLocale: 'en';
export declare const cardCatalog: CatalogCard[];
export declare const getCard: (family: CardFamily, slug: string) => CatalogCard | undefined;
export declare const enumerateStaticCards: () => StaticCardEntry[];
export declare const validateCardExportInput: (input: unknown) => CardExportInput;
export declare const packageResourceBase: string;
`);
await writeFile(resolve(dist, "export.d.ts"), "export { cardCatalog, contentVersion, enumerateStaticCards, validateCardExportInput } from './index';\n");
await writeFile(resolve(dist, "react/index.d.ts"), `import type { CSSProperties, ReactNode } from 'react';
export type CardLayout = 'full' | 'compact';
export interface LayeredCardProps { className?: string; style?: CSSProperties; assetBaseUrl?: string; backgroundUri?: string; imageUri?: string; imageOverlayUri?: string; noun?: ReactNode; nounDeck?: ReactNode; nounCornerIcon?: string; adjective?: ReactNode; adjectiveDeck?: ReactNode; adjectiveCornerIcon?: string; nounEffect?: ReactNode; adjectiveEffect?: ReactNode; titleColor?: string; layout?: CardLayout; transparent?: boolean; showHeader?: boolean; }
export declare const CardStyleBoundary: ({ children }: { children: ReactNode }) => JSX.Element;
export declare const resolveAssetUrl: (assetBaseUrl: string, path: string) => string;
export declare const LayeredCard: (props: LayeredCardProps) => JSX.Element;
export interface GameCardProps { type: string; slug: string; locale?: 'en'; layout?: CardLayout; className?: string; assetBaseUrl?: string; }
export declare const GameCard: (props: GameCardProps) => JSX.Element;
export declare const OutcomeCard: (props: Omit<GameCardProps, 'type'>) => JSX.Element;
export declare const EffectCard: (props: Omit<GameCardProps, 'type'>) => JSX.Element;
export declare const StuntCard: (props: Omit<GameCardProps, 'type'>) => JSX.Element;
export declare const AssetModifierCard: (props: Omit<GameCardProps, 'type'>) => JSX.Element;
export interface ActorCardProps extends Omit<LayeredCardProps, 'noun'> { baseLayerSlug?: string; tacticalRoleSlug?: string; tacticalSpecialSlug?: string; custom?: { imageUrl: string; noun: string; adjective?: string; nounDescription?: string; adjectiveDescription?: string; deck?: string }; }
export declare const ActorCard: (props: ActorCardProps) => JSX.Element;
export interface AssetCardProps extends Omit<LayeredCardProps, 'noun'> { baseAssetSlug: string; modifierSlug?: string; }
export declare const AssetCard: (props: AssetCardProps) => JSX.Element;
export interface CounterCardProps extends Omit<LayeredCardProps, 'noun' | 'adjective'> { iconSlug: string; title: string; currentValue: number; maxValue?: number; }
export declare const CounterCard: (props: CounterCardProps) => JSX.Element;
export declare const CompactCard: (props: LayeredCardProps) => JSX.Element;
export declare const ActorCardTextWithIcons: ({ text }: { text: string }) => JSX.Element;
export interface SceneCardProps { title: string; description?: string; imageUrl?: string; imageAlt?: string; className?: string; }
export declare const SceneCardFrame: (props: SceneCardProps) => JSX.Element;
export declare const LocationCard: (props: SceneCardProps) => JSX.Element;
export declare const EncounterCard: (props: SceneCardProps) => JSX.Element;
export declare const QuestCard: (props: SceneCardProps) => JSX.Element;
`);
