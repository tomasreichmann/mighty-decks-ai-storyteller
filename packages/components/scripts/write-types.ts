import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const dist = resolve(import.meta.dirname, "../dist");
await mkdir(resolve(dist, "react"), { recursive: true });
await writeFile(resolve(dist, "index.d.ts"), "export * from '../src/catalog';\nexport declare const packageResourceBase: string;\n");
await writeFile(resolve(dist, "export.d.ts"), "export { cardCatalog, contentVersion, validateCardExportInput } from './index';\n");
await writeFile(resolve(dist, "react/index.d.ts"), `import type { CSSProperties, ReactNode } from 'react';
export type CardLayout = 'full' | 'compact';
export interface LayeredCardProps { className?: string; style?: CSSProperties; backgroundUri?: string; imageUri?: string; imageOverlayUri?: string; noun?: ReactNode; nounDeck?: ReactNode; adjective?: ReactNode; nounEffect?: ReactNode; adjectiveEffect?: ReactNode; layout?: CardLayout; }
export declare const CardStyleBoundary: ({ children }: { children: ReactNode }) => JSX.Element;
export declare const LayeredCard: (props: LayeredCardProps) => JSX.Element;
export interface GameCardProps { type: string; slug: string; locale?: 'en'; layout?: CardLayout; className?: string; }
export declare const GameCard: (props: GameCardProps) => JSX.Element;
export declare const OutcomeCard: (props: Omit<GameCardProps, 'type'>) => JSX.Element;
export declare const EffectCard: (props: Omit<GameCardProps, 'type'>) => JSX.Element;
export declare const StuntCard: (props: Omit<GameCardProps, 'type'>) => JSX.Element;
export interface ActorCardProps extends Omit<LayeredCardProps, 'noun'> { baseLayerSlug: string; tacticalRoleSlug: string; tacticalSpecialSlug?: string; }
export declare const ActorCard: (props: ActorCardProps) => JSX.Element;
export interface AssetCardProps extends Omit<LayeredCardProps, 'noun'> { baseAssetSlug: string; modifierSlug?: string; }
export declare const AssetCard: (props: AssetCardProps) => JSX.Element;
export interface CounterCardProps extends Omit<LayeredCardProps, 'noun' | 'adjective'> { iconSlug: string; title: string; currentValue: number; maxValue?: number; }
export declare const CounterCard: (props: CounterCardProps) => JSX.Element;
export declare const CompactCard: (props: LayeredCardProps) => JSX.Element;
`);
