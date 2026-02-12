import { ElementType, PropsWithChildren } from "react";
import { cn } from "../../utils/cn";

interface ImageBackgroundProps extends PropsWithChildren {
  imageUri: string;
  imageAlt?: string;
  as?: ElementType;
  className?: string;
  imageClassName?: string;
  overlayClassName?: string;
  overlay?: JSX.Element;
}

export const ImageBackground = ({
  imageUri,
  imageAlt = "",
  as,
  className = "",
  imageClassName = "",
  overlay,
  overlayClassName,
  children,
}: ImageBackgroundProps): JSX.Element => {
  const Component = as ?? "div";
  const isDecorative = imageAlt === "";

  return (
    <Component className={cn("relative isolate", className)}>
      <img
        src={imageUri}
        alt={imageAlt}
        aria-hidden={isDecorative ? "true" : undefined}
        className={cn(
          "absolute inset-0 h-full w-full object-contain",
          imageClassName,
        )}
      />
      {overlay && (
        <div
          className={cn(
            "absolute inset-0 h-full w-full object-contain",
            overlayClassName,
          )}
        >
          {overlay}
        </div>
      )}
      {children}
    </Component>
  );
};
