import { useEffect, useState, type CSSProperties, type PropsWithChildren, type ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "../../utils/cn";
import { Text } from "../common/Text";
import styles from "./Page.module.css";

interface PageProps extends PropsWithChildren {
  mode?: "fit-content" | "fit-screen";
  footerContent?: ReactNode;
}

interface NavItem {
  to: string;
  label: string;
  end?: boolean;
  buttonBackgroundImage: string;
  linkClassName?: string;
  hideInProduction?: boolean;
}

interface ComicNavStyle extends CSSProperties {
  "--button-background-image": string;
}

const navItems: NavItem[] = [
  {
    to: "/",
    label: "Home",
    end: true,
    buttonBackgroundImage: "/button-background-monster.png",
  },
  {
    to: "/adventure-module/list",
    label: "Modules",
    buttonBackgroundImage: "/button-background-gold.png",
  },
  {
    to: "/campaign/list",
    label: "Campaigns",
    buttonBackgroundImage: "/button-background-fire.png",
  },
  {
    to: "/rules",
    label: "Rules",
    buttonBackgroundImage: "/button-background-cloth.png",
  },
  {
    to: "/image-lab",
    label: "Image Lab",
    buttonBackgroundImage: "/button-background-curse.png",
    hideInProduction: true,
  },
  {
    to: "/workflow-lab",
    label: "Workflow Lab",
    buttonBackgroundImage: "/button-background-grey.png",
    linkClassName: styles.comicNavLinkWide,
    hideInProduction: true,
  },
].filter((item) => !(import.meta.env.PROD && item.hideInProduction));

const defaultFooterContent = (
  <Text variant="emphasised" color="steel-dark" className="text-center">
    Made by{" "}
    <a
      href="mailto:tomasreichmann@gmail.com"
      target="_blank"
      rel="noreferrer"
      className="text-kac-gold-darker hover:underline"
    >
      Tomas Reichmann
    </a>
    &nbsp;2026
  </Text>
);

export const Page = ({
  mode = "fit-content",
  footerContent = defaultFooterContent,
  children,
}: PageProps): JSX.Element => {
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  return (
    <div
      className={cn(
        "flex w-full flex-col",
        mode === "fit-screen" ? "h-[100dvh] overflow-hidden" : "min-h-full",
      )}
    >
      <header className="overflow-visible pb-4">
        <div className={cn("app-shell py-3 paper-shadow", styles.headerShell)}>
          <NavLink
            to="/"
            className={styles.brandLink}
            aria-label="Go to home page"
          >
            <img
              src="/mighty-decks-ai-storyteller-logo.png"
              alt="Mighty Decks AI Storyteller"
              className={styles.brandImage}
              loading="eager"
              decoding="async"
            />
          </NavLink>

          <button
            type="button"
            className={styles.comicNavToggle}
            aria-expanded={mobileNavOpen}
            aria-controls="primary-navigation"
            aria-label={mobileNavOpen ? "Close navigation menu" : "Open navigation menu"}
            onClick={() => setMobileNavOpen((current) => !current)}
          >
            <span className={styles.comicNavToggleLine} />
            <span className={styles.comicNavToggleLine} />
            <span className={styles.comicNavToggleLine} />
          </button>

          <nav
            id="primary-navigation"
            className={cn(styles.comicNav, mobileNavOpen && styles.comicNavOpen)}
            aria-label="Primary"
          >
            {navItems.map((item) => {
              const style: ComicNavStyle = {
                "--button-background-image": `url("${item.buttonBackgroundImage}")`,
              };

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  style={style}
                  className={({ isActive }) =>
                    cn(
                      styles.comicNavLink,
                      item.linkClassName,
                      isActive && styles.comicNavLinkActive,
                    )
                  }
                  onClick={() => setMobileNavOpen(false)}
                >
                  <span className={styles.comicNavLabel}>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </header>

      <main
        className={cn(
          mode === "fit-screen" ? "min-h-0 overflow-y-auto" : "",
          "w-full flex-1 flex flex-col",
        )}
      >
        {children}
      </main>

      {footerContent !== null ? (
        <footer className="overflow-hidden py-2">
          <div className="app-shell py-4">{footerContent}</div>
        </footer>
      ) : null}
    </div>
  );
};
