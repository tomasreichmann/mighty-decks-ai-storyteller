import {
  useEffect,
  useState,
  type PropsWithChildren,
  type ReactNode,
} from "react";
import {
  NavLink,
  useHref,
  useLinkClickHandler,
  useLocation,
  useMatch,
} from "react-router-dom";
import { cn } from "../../utils/cn";
import { Button, type ButtonColors } from "../common/Button";
import { Text } from "../common/Text";
import styles from "./Page.module.css";

interface PageProps extends PropsWithChildren {
  mode?: "fit-content" | "fit-screen";
  footerContent?: ReactNode;
  hideHeader?: boolean;
}

interface NavItem {
  to: string;
  label: string;
  color: ButtonColors;
  end?: boolean;
  activePath?: string;
}

interface FooterLink {
  to: string;
  label: string;
  end?: boolean;
}

const navItems: NavItem[] = [
  {
    to: "/",
    label: "Home",
    color: "gold",
    end: true,
  },
  {
    to: "/adventure-module/list",
    label: "Modules",
    color: "steel",
    activePath: "/adventure-module/*",
  },
  {
    to: "/campaign/list",
    label: "Campaigns",
    color: "cloth",
    activePath: "/campaign/*",
  },
  {
    to: "/rules",
    label: "Rules",
    color: "curse",
    activePath: "/rules/*",
  },
];

const footerLinks: FooterLink[] = [
  { to: "/", label: "Home", end: true },
  { to: "/privacy-policy", label: "Privacy Policy" },
  { to: "/terms-of-service", label: "Terms of Service" },
];

const defaultFooterContent = (
  <div className="flex flex-col items-center gap-2">
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
      {footerLinks.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className="text-sm font-bold uppercase tracking-[0.08em] text-kac-gold-darker hover:underline"
        >
          {item.label}
        </NavLink>
      ))}
    </div>
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
  </div>
);

const PrimaryNavLink = ({
  item,
  onNavigate,
}: {
  item: NavItem;
  onNavigate: () => void;
}): JSX.Element => {
  const href = useHref(item.to);
  const navigate = useLinkClickHandler<HTMLElement>(item.to);
  const isActive = useMatch({
    path: item.activePath ?? item.to,
    end: item.end ?? false,
  }) !== null;

  return (
    <Button
      variant="ghost"
      href={href}
      aria-current={isActive ? "page" : undefined}
      color={item.color}
      className={styles.primaryNavLink}
      onClick={(event) => {
        onNavigate();
        navigate(event);
      }}
    >
      {item.label}
    </Button>
  );
};

export const Page = ({
  mode = "fit-content",
  footerContent = defaultFooterContent,
  hideHeader = false,
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
      {hideHeader ? null : (
        <header className={styles.pageHeader}>
          <div className={cn("app-shell", styles.headerShell)}>
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
              aria-label={
                mobileNavOpen ? "Close navigation menu" : "Open navigation menu"
              }
              onClick={() => setMobileNavOpen((current) => !current)}
            >
              <span className={styles.comicNavToggleLine} />
              <span className={styles.comicNavToggleLine} />
              <span className={styles.comicNavToggleLine} />
            </button>

            <nav
              id="primary-navigation"
              className={cn(
                styles.comicNav,
                mobileNavOpen && styles.comicNavOpen,
              )}
              aria-label="Primary"
            >
              <div className={styles.comicNavContent}>
                {navItems.map((item) => (
                  <PrimaryNavLink
                    key={item.to}
                    item={item}
                    onNavigate={() => setMobileNavOpen(false)}
                  />
                ))}
              </div>
            </nav>
          </div>
        </header>
      )}

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
