import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// text-legal es un tamaño propio (app/globals.css). Sin esto, tailwind-merge lo toma por un
// color y lo descarta al combinarlo con un text-<color>: el aviso legal quedaba a 16px.
const twMerge = extendTailwindMerge({
  extend: { classGroups: { 'font-size': ['text-legal'] } },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
