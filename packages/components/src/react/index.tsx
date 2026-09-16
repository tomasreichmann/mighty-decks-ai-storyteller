import type { CSSProperties, ReactNode } from "react";
import { getCard, type CardFamily } from "../catalog";
import styles from "./cards.module.css";

export type CardLayout = "full" | "compact";
export interface LayeredCardProps { className?: string; style?: CSSProperties; backgroundUri?: string; imageUri?: string; imageOverlayUri?: string; noun?: ReactNode; nounDeck?: ReactNode; adjective?: ReactNode; nounEffect?: ReactNode; adjectiveEffect?: ReactNode; layout?: CardLayout; }
export const CardStyleBoundary = ({ children }: { children: ReactNode }): JSX.Element => <div className={styles.boundary}>{children}</div>;
export const LayeredCard = ({ className, style, imageUri, imageOverlayUri, noun = "Card", nounDeck, adjective, nounEffect, adjectiveEffect, layout = "full" }: LayeredCardProps): JSX.Element => <CardStyleBoundary><article className={[styles.card, layout === "compact" ? styles.compact : "", className].filter(Boolean).join(" ")} style={style} aria-label={typeof noun === "string" ? noun : "Card"}><span className={styles.deck}>{nounDeck}</span>{imageUri ? <img className={styles.image} src={imageUri} alt="" /> : null}{imageOverlayUri ? <img className={styles.overlay} src={imageOverlayUri} alt="" /> : null}{adjective ? <div className={styles.adjective}>{adjective}</div> : null}<div className={styles.title}>{noun}</div><div className={styles.body}>{nounEffect}</div><div className={styles.footer}>{adjectiveEffect}</div></article></CardStyleBoundary>;
export interface GameCardProps { type: CardFamily; slug: string; locale?: "en"; layout?: CardLayout; className?: string; }
export const GameCard = ({ type, slug, locale = "en", layout, className }: GameCardProps): JSX.Element => { const card = getCard(type, slug); if (!card || locale !== "en") throw new Error(`Unknown ${type} card '${slug}' for locale '${locale}'.`); return <LayeredCard className={className} layout={layout} imageUri={card.artworkPath} noun={card.title} nounDeck={type} nounEffect={card.description} />; };
export const OutcomeCard = (props: Omit<GameCardProps, "type">): JSX.Element => <GameCard type="outcome" {...props} />;
export const EffectCard = (props: Omit<GameCardProps, "type">): JSX.Element => <GameCard type="effect" {...props} />;
export const StuntCard = (props: Omit<GameCardProps, "type">): JSX.Element => <GameCard type="stunt" {...props} />;
export interface ActorCardProps extends Omit<LayeredCardProps, "noun"> { baseLayerSlug: string; tacticalRoleSlug: string; tacticalSpecialSlug?: string; }
const actorImageUri = (slug: string): string => `/actors/base/${slug.replaceAll("_", "-")}.png`;
export const ActorCard = ({ baseLayerSlug, tacticalRoleSlug, tacticalSpecialSlug, ...props }: ActorCardProps): JSX.Element => <LayeredCard {...props} noun={[tacticalSpecialSlug, getCard("actor-role", tacticalRoleSlug)?.title].filter(Boolean).join(" ")} nounDeck="actor" imageUri={actorImageUri(baseLayerSlug)} imageOverlayUri={tacticalSpecialSlug ? actorImageUri(tacticalSpecialSlug) : undefined} />;
export interface AssetCardProps extends Omit<LayeredCardProps, "noun"> { baseAssetSlug: string; modifierSlug?: string; }
const assetImageUri = (slug: string): string => `/assets/${slug.startsWith("medieval_") ? "medieval" : "base"}/${slug.replace(/^medieval_|^base_/, "")}.png`;
export const AssetCard = ({ baseAssetSlug, modifierSlug, ...props }: AssetCardProps): JSX.Element => <LayeredCard {...props} noun={getCard("asset-base", baseAssetSlug)?.title ?? "Unknown Asset"} adjective={modifierSlug ? getCard("asset-modifier", modifierSlug)?.title : undefined} nounDeck="asset" imageUri={assetImageUri(baseAssetSlug)} imageOverlayUri={modifierSlug ? assetImageUri(modifierSlug) : undefined} />;
export interface CounterCardProps extends Omit<LayeredCardProps, "noun" | "adjective"> { iconSlug: string; title: string; currentValue: number; maxValue?: number; }
export const CounterCard = ({ iconSlug, title, currentValue, maxValue, ...props }: CounterCardProps): JSX.Element => <LayeredCard {...props} imageUri={`/counters/${iconSlug}.png`} noun={title} adjective={maxValue === undefined ? currentValue : `${currentValue} / ${maxValue}`} nounDeck="counter" />;
export const CompactCard = (props: LayeredCardProps): JSX.Element => <LayeredCard {...props} layout="compact" />;
