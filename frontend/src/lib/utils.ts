// Adapted from https://www.obsidianui.dev/r/split-showcase.json (MIT). See public/licenses.
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
