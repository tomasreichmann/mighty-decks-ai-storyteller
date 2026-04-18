import { Button } from "../common/Button";

interface SceneCardDetailLinkProps {
  href: string | null;
  label: string;
}

export const SceneCardDetailLink = ({
  href,
  label,
}: SceneCardDetailLinkProps): JSX.Element | null => {
  if (!href) {
    return null;
  }

  return (
    <Button
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      variant="circle"
      color="cloth"
      size="sm"
      aria-label={label}
      title={label}
      className="absolute bottom-2 right-3 z-10"
      contentEditable={false}
      onClick={(event) => {
        event.stopPropagation();
      }}
      onMouseDown={(event) => {
        event.stopPropagation();
      }}
    >
      <span aria-hidden="true" className="text-base leading-none">
        ↑
      </span>
    </Button>
  );
};
