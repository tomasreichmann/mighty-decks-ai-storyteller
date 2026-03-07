import type { CSSProperties, PropsWithChildren, ReactNode } from "react";
import { NavLink } from "react-router-dom";
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
  hueDegrees: number;
  hideInProduction?: boolean;
}

interface ComicNavStyle extends CSSProperties {
  "--button-hue": string;
}

const navItems: NavItem[] = [
  { to: "/", label: "Home", end: true, hueDegrees: 0 },
  {
    to: "/adventure-module/list",
    label: "Modules",
    hueDegrees: 292,
  },
  {
    to: "/rules",
    label: "Rules",
    hueDegrees: 28,
  },
  {
    to: "/image",
    label: "Image Lab",
    hueDegrees: 175,
    hideInProduction: true,
  },
  {
    to: "/workflow-lab",
    label: "Workflow",
    hueDegrees: 98,
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
  return (
    <div
      className={cn(
        "flex w-full flex-col",
        mode === "fit-screen" ? "h-[100dvh] overflow-hidden" : "min-h-full",
      )}
    >
      <header className="overflow-hidden pb-4">
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

          <nav className={styles.comicNav} aria-label="Primary">
            {navItems.map((item) => {
              const style: ComicNavStyle = {
                "--button-hue": `${item.hueDegrees}deg`,
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
                      isActive && styles.comicNavLinkActive,
                    )
                  }
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
