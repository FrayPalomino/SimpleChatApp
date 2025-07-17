import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function suppressBrowserExtensionErrors() {
  if (typeof window !== "undefined") {
    const originalError = console.error
    console.error = (...args) => {
      const message = args.join(" ")
      if (
        message.includes("Could not establish connection") ||
        message.includes("Receiving end does not exist") ||
        message.includes("Extension context invalidated")
      ) {
        return 
      }
      originalError.apply(console, args)
    }
  }
}

