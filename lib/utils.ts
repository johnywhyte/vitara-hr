import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function isGhanaIdComplete(id: string): boolean {
  // Ghana Card format: GHA-XXXXXXXXX-X (GHA + dash + 9 alphanumeric + dash + 1 digit)
  return /^GHA-[A-Z0-9]{9}-\d$/.test(id.toUpperCase())
}

export function formatGhanaId(raw: string): string {
  const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (cleaned.length <= 3) return cleaned
  if (cleaned.length <= 12) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 12)}-${cleaned.slice(12, 13)}`
}
