import { resolveGameCard, type GameCardType } from "../../lib/markdownGameComponents";

interface RulebookDiagramCardProps {
  type: Extract<GameCardType, "OutcomeCard" | "EffectCard" | "StuntCard">;
  slug: string;
  badge: string;
  title?: string;
  imageUrl?: string;
  className?: string;
}

const typeImage: Record<RulebookDiagramCardProps["type"], string> = {
  OutcomeCard: "/types/outcome.png", EffectCard: "/types/effect.png", StuntCard: "/types/stunt.png",
};

export const RulebookDiagramCard = ({ type, slug, badge, title, imageUrl, className }: RulebookDiagramCardProps): JSX.Element => {
  const resolved = resolveGameCard(type, slug);
  const cardTitle = title ?? (resolved && "card" in resolved ? resolved.card.title : undefined);
  if (!cardTitle) return <span className="rounded border border-dashed border-kac-blood-dark px-2 py-1 font-ui text-xs text-kac-blood-dark">Missing diagram card</span>;
  return <div aria-label={`${type.replace("Card", "")} diagram: ${cardTitle}, ${badge}`} className={`flex w-28 shrink-0 flex-col overflow-hidden rounded border-2 border-kac-iron bg-kac-bone-light text-center shadow-[2px_2px_0_0_#121b23] ${className ?? ""}`}>
    <img aria-hidden="true" alt="" className="h-14 w-full bg-kac-cloth-light object-contain p-2" src={imageUrl ?? typeImage[type]} />
    <span className="px-1 pt-1 font-ui text-[0.62rem] font-bold uppercase tracking-wide text-kac-iron-light">{type.replace("Card", "")}</span>
    <span className="px-1 font-heading text-sm font-bold leading-tight text-kac-iron">{cardTitle}</span>
    <strong className="m-1 rounded bg-kac-gold px-1 py-0.5 font-ui text-sm text-kac-iron">{badge}</strong>
  </div>;
};
