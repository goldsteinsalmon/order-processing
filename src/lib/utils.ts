
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Note: Type adapter functions moved to src/utils/typeAdapters.ts
// Please import adaptCustomerToCamelCase and other adapter functions from there
