/**
 * Format a date to Jakarta timezone (UTC+7)
 * Output: "DD MMM YYYY, HH:mm WIB"
 */
export function formatDate(dateString) {
  if (!dateString) return '—'
  const date = new Date(dateString)
  const options = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Jakarta',
  }
  const formatted = new Intl.DateTimeFormat('en-GB', options).format(date)
  return `${formatted} WIB`
}

/**
 * Format currency to IDR with dot as thousand separator
 * Output: "Rp X.XXX.XXX"
 */
export function formatCurrency(amount) {
  if (amount == null) return '—'
  return `Rp ${Number(amount).toLocaleString('id-ID')}`
}

/**
 * Convert snake_case to Title Case
 * e.g., "product_defect" → "Product Defect"
 */
export function formatLabel(str) {
  if (!str) return '—'
  return str
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
