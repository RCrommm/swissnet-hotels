export function cur(hotel: any) {
  return hotel?.currency || 'CHF'
}

export function sym(hotel: any) {
  const c = cur(hotel)
  return c === 'GBP' ? '£' : c === 'EUR' ? '€' : 'CHF '
}

export function countryOf(hotel: any) {
  return hotel?.country || 'Switzerland'
}
const ISO_BY_COUNTRY: Record<string, string> = {
  'Switzerland': 'CH',
  'United Kingdom': 'GB',
}

export function iso(h: any): string {
  return ISO_BY_COUNTRY[h?.country || 'Switzerland'] || 'CH'
}