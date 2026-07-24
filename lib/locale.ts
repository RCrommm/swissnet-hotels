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
