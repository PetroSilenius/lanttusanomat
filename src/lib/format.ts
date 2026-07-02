const dateFormatter = new Intl.DateTimeFormat('fi-FI', {
  day: 'numeric',
  month: 'numeric',
  year: 'numeric',
  timeZone: 'Europe/Helsinki',
})

const timeFormatter = new Intl.DateTimeFormat('fi-FI', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/Helsinki',
})

/** e.g. "2.7.2026" */
export function formatDate(date: Date): string {
  return dateFormatter.format(date)
}

/** e.g. "2.7.2026 klo 9.30" */
export function formatDateTime(date: Date): string {
  return `${dateFormatter.format(date)} klo ${timeFormatter.format(date)}`
}
