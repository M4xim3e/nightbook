import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { differenceInDays, parseISO } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getExpiryStatus(expiryDate: string): 'expired' | 'critical' | 'warning' | 'ok' {
  const days = differenceInDays(parseISO(expiryDate), new Date())
  if (days < 0) return 'expired'
  if (days === 0) return 'critical'
  if (days <= 1) return 'critical'
  if (days <= 2) return 'warning'
  return 'ok'
}

export function getExpiryLabel(expiryDate: string): string {
  const days = differenceInDays(parseISO(expiryDate), new Date())
  if (days < 0) return `Expiré (${Math.abs(days)}j)`
  if (days === 0) return "Expire aujourd'hui"
  if (days === 1) return 'Expire demain'
  return `Expire dans ${days}j`
}

export function getDefaultShelfLife(category: string): number {
  const shelfLives: Record<string, number> = {
    viande: 3,
    poisson: 2,
    légumes: 5,
    'produits laitiers': 7,
    épicerie: 180,
    boissons: 365,
    autre: 7,
  }
  return shelfLives[category] || 7
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function addDaysToDate(date: Date, days: number): string {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result.toISOString().split('T')[0]
}

export const CATEGORIES = [
  'viande',
  'poisson',
  'légumes',
  'produits laitiers',
  'épicerie',
  'boissons',
  'autre',
] as const

export const UNITS = ['kg', 'g', 'L', 'unité', 'bouteille', 'boîte'] as const

export const CATEGORY_LABELS: Record<string, string> = {
  viande: 'Viande',
  poisson: 'Poisson',
  légumes: 'Légumes',
  'produits laitiers': 'Produits laitiers',
  épicerie: 'Épicerie',
  boissons: 'Boissons',
  autre: 'Autre',
}
