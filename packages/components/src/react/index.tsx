import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { getCard, type CardFamily } from "../catalog";
import styles from "./cards.module.css";

export type CardLayout = "full" | "compact";
export interface LayeredCardProps { className?: string; style?: CSSProperties; assetBaseUrl?: string; backgroundUri?: string; imageUri?: string; imageOverlayUri?: string; noun?: ReactNode; nounDeck?: ReactNode; nounCornerIcon?: string; adjective?: ReactNode; adjectiveDeck?: ReactNode; adjectiveCornerIcon?: string; adjectiveEffect?: ReactNode; nounEffect?: ReactNode; titleColor?: string; layout?: CardLayout; transparent?: boolean; showHeader?: boolean; }
export const CardStyleBoundary = ({ children }: { children: ReactNode }): JSX.Element => <div className={styles.boundary}>{children}</div>;
export const resolveAssetUrl = (assetBaseUrl: string, path: string): string => `${assetBaseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
const asLabel = (value: ReactNode): string => typeof value === "string" || typeof value === "number" ? String(value) : "Card";
const SvgText = ({ x, y, width, height, children, fontSize, minFontSize = fontSize, color = "#121b23", fontFamily = "MightyDecksKalam", weight = 700 }: { x: number; y: number; width: number; height: number; children?: ReactNode; fontSize: number; minFontSize?: number; color?: string; fontFamily?: string; weight?: number }): JSX.Element => {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [fittedFontSize, setFittedFontSize] = useState(fontSize);
  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;
    const fit = (): void => {
      let next = fontSize;
      inner.style.fontSize = `${next}px`;
      while (next > minFontSize && (inner.scrollWidth > outer.clientWidth || inner.scrollHeight > outer.clientHeight)) {
        next -= 0.5;
        inner.style.fontSize = `${next}px`;
      }
      setFittedFontSize(next);
    };
    void document.fonts?.ready.then(fit);
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(outer);
    return () => observer.disconnect();
  }, [children, fontSize, minFontSize]);
  return <foreignObject x={x} y={y} width={width} height={height}><div ref={outerRef} style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", color, fontFamily, fontWeight: weight, overflow: "hidden" }}><div ref={innerRef} style={{ maxWidth: "100%", overflowWrap: "break-word", fontSize: fittedFontSize, lineHeight: 1.08 }}>{children}</div></div></foreignObject>;
};
export const LayeredCard = ({ className, style, assetBaseUrl = "/mighty-decks/assets", backgroundUri = "/backgrounds/paper-with-image-shadow.png", imageUri, imageOverlayUri, noun = "Card", nounDeck, nounCornerIcon, adjective, adjectiveDeck, adjectiveCornerIcon, nounEffect, adjectiveEffect, titleColor = "#121b23", layout = "full", transparent = false, showHeader = true }: LayeredCardProps): JSX.Element => {
  const compact = layout === "compact";
  const background = resolveAssetUrl(assetBaseUrl, backgroundUri);
  const image = imageUri ? resolveAssetUrl(assetBaseUrl, imageUri) : undefined;
  const overlay = imageOverlayUri ? resolveAssetUrl(assetBaseUrl, imageOverlayUri) : undefined;
  const cornerIcon = nounCornerIcon ? resolveAssetUrl(assetBaseUrl, nounCornerIcon) : undefined;
  const adjectiveCorner = adjectiveCornerIcon ? resolveAssetUrl(assetBaseUrl, adjectiveCornerIcon) : undefined;
  const uniqueId = useId().replace(/:/g, "");
  const paperId = `${uniqueId}-paper`;
  const artId = `${uniqueId}-art`;
  return <CardStyleBoundary><article className={[styles.card, className].filter(Boolean).join(" ")} style={style} aria-label={asLabel(noun)} data-card-layer={transparent ? "overlay" : "base"}><svg viewBox="0 0 204 332" width="100%" height="100%" role="img" aria-label={asLabel(noun)}><defs><pattern id={paperId} width="1" height="1" patternUnits="objectBoundingBox"><image href={background} width="204" height="332" preserveAspectRatio="xMidYMid slice" /></pattern><clipPath id={artId}><rect x={compact ? 57 : 24} y={compact ? 30 : 44} width={compact ? 90 : 156} height={compact ? 90 : 98} rx="6" /></clipPath></defs>{!transparent ? <><rect x="1" y="1" width="202" height="330" rx="11" fill={`url(#${paperId})`} /><rect x="1" y="1" width="202" height="330" rx="11" fill="none" stroke="#6d5435" strokeWidth="2" /></> : null}{!compact && !transparent && showHeader ? <><text x="168" y="25" textAnchor="end" fill="#856a4c" style={{ fontFamily: "MightyDecksShantell", fontSize: 9, fontWeight: 700 }}>{asLabel(nounDeck)}</text>{cornerIcon ? <image href={cornerIcon} x="173" y="11" width="18" height="18" preserveAspectRatio="xMidYMid meet" /> : null}</> : null}{image ? <g clipPath={`url(#${artId})`}><image href={image} x={compact ? 57 : 24} y={compact ? 30 : 44} width={compact ? 90 : 156} height={compact ? 90 : 98} preserveAspectRatio="xMidYMid meet" />{overlay ? <image href={overlay} x={compact ? 57 : 24} y={compact ? 30 : 44} width={compact ? 90 : 156} height={compact ? 90 : 98} preserveAspectRatio="xMidYMid meet" opacity="0.8" /> : null}</g> : null}{!compact && !transparent && (adjectiveDeck || adjectiveCorner) ? <g transform="translate(185 90) rotate(90)">{adjectiveCorner ? <image href={adjectiveCorner} x="-58" y="-10" width="18" height="18" preserveAspectRatio="xMidYMid meet" /> : null}<text x="-36" y="3" fill="#856a4c" style={{ fontFamily: "MightyDecksShantell", fontSize: 9, fontWeight: 700 }}>{asLabel(adjectiveDeck)}</text></g> : null}{compact ? <SvgText x={12} y={137} width={180} height={142} fontSize={30} minFontSize={24} color={titleColor}>{noun}</SvgText> : <><SvgText x={16} y={148} width={172} height={20} fontSize={16} minFontSize={11} color="#121b23">{adjective}</SvgText><SvgText x={16} y={167} width={172} height={24} fontSize={20} minFontSize={12} color={titleColor}>{noun}</SvgText>{!transparent ? <><SvgText x={16} y={194} width={172} height={84} fontSize={11} color="#23303d" fontFamily="MightyDecksShantell" weight={400}>{nounEffect}</SvgText><SvgText x={16} y={280} width={172} height={38} fontSize={11} color="#121b23" fontFamily="MightyDecksShantell">{adjectiveEffect}</SvgText></> : null}</>}</svg></article></CardStyleBoundary>;
};
export interface GameCardProps { type: CardFamily; slug: string; locale?: "en"; layout?: CardLayout; className?: string; assetBaseUrl?: string; }
const titleToneBySlug: Record<string, string> = { "special-action": "#d99600", success: "#1aa62b", "partial-success": "#65738b", chaos: "#f20170", fumble: "#090f15" };
const cornerIconByFamily: Record<CardFamily, string> = { outcome: "/types/outcome.png", effect: "/types/effect.png", stunt: "/types/stunt.png", "actor-base": "/types/actor.png", "actor-role": "/types/actor.png", "actor-special": "/types/actor.png", "asset-base": "/types/asset.png", "asset-modifier": "/types/asset.png", counter: "/types/counter.png" };
export const GameCard = ({ type, slug, locale = "en", layout, className, assetBaseUrl }: GameCardProps): JSX.Element => { const card = getCard(type, slug); if (!card || locale !== "en") throw new Error(`Unknown ${type} card '${slug}' for locale '${locale}'.`); const isRole = type === "actor-role"; const isSpecial = type === "actor-special"; const isModifier = type === "asset-modifier"; const isOverlay = isRole || isSpecial || isModifier; return <LayeredCard assetBaseUrl={assetBaseUrl} className={className} layout={layout} transparent={isOverlay} showHeader={type !== "actor-base"} imageUri={isRole ? undefined : card.artworkPath} noun={isSpecial || isModifier || type === "actor-base" ? "" : card.title} adjective={isSpecial || isModifier ? card.title : undefined} nounDeck={card.deck ?? type} nounCornerIcon={cornerIconByFamily[type]} nounEffect={card.body ?? card.description} adjectiveEffect={card.footer} titleColor={titleToneBySlug[slug]} />; };
export const OutcomeCard = (props: Omit<GameCardProps, "type">): JSX.Element => <GameCard type="outcome" {...props} />;
export const EffectCard = (props: Omit<GameCardProps, "type">): JSX.Element => <GameCard type="effect" {...props} />;
export const StuntCard = (props: Omit<GameCardProps, "type">): JSX.Element => <GameCard type="stunt" {...props} />;
export const AssetModifierCard = (props: Omit<GameCardProps, "type">): JSX.Element => <GameCard type="asset-modifier" {...props} />;
export interface ActorCardProps extends Omit<LayeredCardProps, "noun"> { baseLayerSlug?: string; tacticalRoleSlug?: string; tacticalSpecialSlug?: string; custom?: { imageUrl: string; noun: string; adjective?: string; nounDescription?: string; adjectiveDescription?: string; deck?: string }; }
const actorImageUri = (slug: string): string => `/actors/base/${slug.replaceAll("_", "-")}.png`;
export const ActorCard = ({ baseLayerSlug, tacticalRoleSlug, tacticalSpecialSlug, custom, ...props }: ActorCardProps): JSX.Element => custom ? <LayeredCard {...props} imageUri={custom.imageUrl} noun={custom.noun} adjective={custom.adjective} nounEffect={custom.nounDescription} adjectiveEffect={custom.adjectiveDescription} nounDeck={custom.deck ?? "custom"} /> : <LayeredCard {...props} noun={tacticalRoleSlug ? getCard("actor-role", tacticalRoleSlug)?.title ?? "" : ""} adjective={tacticalSpecialSlug ? getCard("actor-special", tacticalSpecialSlug)?.title : undefined} nounDeck="actor" adjectiveDeck={tacticalSpecialSlug ? "base mod" : undefined} nounCornerIcon="/types/actor.png" adjectiveCornerIcon={tacticalSpecialSlug ? "/types/actor.png" : undefined} imageUri={baseLayerSlug ? actorImageUri(baseLayerSlug) : undefined} imageOverlayUri={tacticalSpecialSlug ? actorImageUri(tacticalSpecialSlug) : undefined} />;
export interface AssetCardProps extends Omit<LayeredCardProps, "noun"> { baseAssetSlug: string; modifierSlug?: string; }
const assetImageUri = (slug: string): string => `/assets/${slug.startsWith("medieval_") ? "medieval" : "base"}/${slug.replace(/^medieval_|^base_/, "")}.png`;
export const AssetCard = ({ baseAssetSlug, modifierSlug, ...props }: AssetCardProps): JSX.Element => { const base = getCard("asset-base", baseAssetSlug); const modifier = modifierSlug ? getCard("asset-modifier", modifierSlug) : undefined; return <LayeredCard {...props} noun={base?.title ?? "Unknown Asset"} adjective={modifier?.title} nounDeck={base?.deck ?? (baseAssetSlug.startsWith("medieval_") ? "medieval" : "base")} adjectiveDeck={modifier?.deck} nounCornerIcon="/types/asset.png" adjectiveCornerIcon={modifier ? "/types/asset.png" : undefined} nounEffect={base?.body} adjectiveEffect={modifier?.body} imageUri={base?.artworkPath ?? assetImageUri(baseAssetSlug)} imageOverlayUri={modifier?.artworkPath ?? (modifierSlug ? assetImageUri(modifierSlug) : undefined)} />; };
export interface CounterCardProps extends Omit<LayeredCardProps, "noun" | "adjective"> { iconSlug: string; title: string; currentValue: number; maxValue?: number; }
export const CounterCard = ({ iconSlug, title, currentValue, maxValue, ...props }: CounterCardProps): JSX.Element => <LayeredCard {...props} imageUri={`/counters/${iconSlug}.png`} noun={title} adjective={maxValue === undefined ? currentValue : `${currentValue} / ${maxValue}`} nounDeck="counter" />;
export const CompactCard = (props: LayeredCardProps): JSX.Element => <LayeredCard {...props} layout="compact" />;
export const ActorCardTextWithIcons = ({ text }: { text: string }): JSX.Element => <>{text}</>;
export interface SceneCardProps { title: string; description?: string; imageUrl?: string; imageAlt?: string; className?: string; }
export const SceneCardFrame = ({ title, description, imageUrl, imageAlt = "", className }: SceneCardProps): JSX.Element => <article className={[styles.scene, className].filter(Boolean).join(" ")}>{imageUrl ? <img src={imageUrl} alt={imageAlt} /> : null}<h2>{title}</h2>{description ? <p>{description}</p> : null}</article>;
export const LocationCard = (props: SceneCardProps): JSX.Element => <SceneCardFrame {...props} />;
export const EncounterCard = (props: SceneCardProps): JSX.Element => <SceneCardFrame {...props} />;
export const QuestCard = (props: SceneCardProps): JSX.Element => <SceneCardFrame {...props} />;
