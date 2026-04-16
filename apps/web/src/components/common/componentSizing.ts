export type ComponentSize = "sm" | "md" | "lg";

export const componentSurfaceSizeClassMap: Record<ComponentSize, string> = {
  sm: "min-h-8 px-3 py-1.5 text-xs",
  md: "min-h-10 px-4 py-2 text-sm",
  lg: "min-h-12 px-5 py-2.5 text-base",
};

export const componentCircleSizeClassMap: Record<ComponentSize, string> = {
  sm: "h-8 w-8 p-0 text-xs",
  md: "h-10 w-10 p-0 text-sm",
  lg: "h-12 w-12 p-0 text-base",
};

export const componentLabelSizeClassMap: Record<ComponentSize, string> = {
  sm: "px-2 pt-1 pb-0.5 text-[10px]/none",
  md: "px-2.5 pt-1.5 pb-1 text-xs/none",
  lg: "px-3 pt-2 pb-1.5 text-sm/none",
};
