/** Shared pure helpers (formatting, parsing, etc.). */

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}
