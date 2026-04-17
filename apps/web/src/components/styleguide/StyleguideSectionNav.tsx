import { Link, useLocation } from "react-router-dom";
import { cn } from "../../utils/cn";

const styleguideSectionItems = [
  {
    to: "/styleguide",
    label: "Overview",
    activePaths: ["/styleguide"],
  },
  {
    to: "/styleguide/typography",
    label: "Typography",
    activePaths: ["/styleguide/typography"],
  },
  {
    to: "/styleguide/inputs",
    label: "Inputs",
    activePaths: ["/styleguide/inputs"],
  },
  {
    to: "/styleguide/loading",
    label: "Loading",
    activePaths: ["/styleguide/loading"],
  },
  {
    to: "/styleguide/buttons",
    label: "Buttons",
    activePaths: ["/styleguide/buttons"],
  },
  {
    to: "/styleguide/panel",
    label: "Panel",
    activePaths: ["/styleguide/panel"],
  },
  {
    to: "/styleguide/cards",
    label: "Cards",
    activePaths: ["/styleguide/cards"],
  },
  {
    to: "/styleguide/tags",
    label: "Tags",
    activePaths: ["/styleguide/tags"],
  },
  {
    to: "/styleguide/controls",
    label: "Controls",
    activePaths: ["/styleguide/controls"],
  },
  {
    to: "/styleguide/session-chat",
    label: "Session Chat",
    activePaths: [
      "/styleguide/session-chat",
      "/styleguide/session-chat-player",
      "/styleguide/session-chat-storyteller",
    ],
  },
] as const;

export const StyleguideSectionNav = (): JSX.Element => {
  const { pathname } = useLocation();

  return (
    <nav
      className="styleguide-section-nav flex flex-wrap gap-2"
      aria-label="Styleguide sections"
    >
      {styleguideSectionItems.map((item) => {
        const isActive =
          item.to === "/styleguide"
            ? pathname === "/styleguide"
            : item.activePaths.some(
                (activePath) =>
                  pathname === activePath ||
                  pathname.startsWith(`${activePath}/`),
              );

        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "styleguide-section-nav__link inline-flex items-center rounded-sm border-2 border-kac-iron px-3 py-1.5 font-ui text-xs font-bold uppercase tracking-[0.08em] transition duration-100",
              isActive
                ? "styleguide-section-nav__link--active bg-kac-gold text-kac-iron shadow-[3px_3px_0_0_#121b23]"
                : "bg-kac-bone-light text-kac-iron shadow-[2px_2px_0_0_#121b23] hover:brightness-[1.03]",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
};
