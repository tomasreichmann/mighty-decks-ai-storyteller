import { useHref, useLinkClickHandler, useLocation } from "react-router-dom";
import { Button } from "../common/Button";
import {
  type StyleguideCatalogEntry,
  styleguideNavigationEntries,
} from "./styleguideCatalog";

const StyleguideNavLink = ({ item }: { item: StyleguideCatalogEntry }): JSX.Element => {
  const { pathname } = useLocation();
  const href = useHref(item.path);
  const navigate = useLinkClickHandler<HTMLElement>(item.path);
  const activePaths = item.activePaths ?? [item.path];
  const isActive = activePaths.some(
    (activePath) =>
      pathname === activePath ||
      (activePath !== "/styleguide" && pathname.startsWith(`${activePath}/`)),
  );

  return (
    <Button
      variant="ghost"
      size="sm"
      href={href}
      aria-current={isActive ? "page" : undefined}
      color="gold"
      className="styleguide-section-nav__link"
      onClick={navigate}
    >
      {item.title}
    </Button>
  );
};

export const StyleguideSectionNav = (): JSX.Element => {
  return (
    <nav
      className="styleguide-section-nav flex flex-wrap gap-x-4 gap-y-2"
      aria-label="Styleguide sections"
    >
      {styleguideNavigationEntries.map((item) => (
        <StyleguideNavLink key={item.path} item={item} />
      ))}
    </nav>
  );
};
