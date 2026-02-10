import { twMerge } from "tailwind-merge";

type ClassValue = string | false | null | undefined;

export const cn = (...classes: ClassValue[]): string => twMerge(...classes);
