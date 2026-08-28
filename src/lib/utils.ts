import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Tailwind-aware className merge, ported from rabnix-estate-v1 (`@/lib/utils`) so the v1
// design components drop in unchanged. See docs/frontend-port-v1.md §4.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
