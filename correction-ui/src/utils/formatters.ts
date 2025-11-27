/**
 * Formatter Utilities
 * Feature: 003-correction-ui
 * Task: T012
 * Requirements: FR-013, FR-018
 *
 * Utilities for formatting data for display
 */

/**
 * Format ISO timestamp to EST timezone
 * Format: Mon 11/24/25 1:15PM
 * Requirement: FR-018
 */
export function formatTimestamp(isoString: string | null): string {
  if (!isoString) return 'N/A'

  try {
    const date = new Date(isoString)

    // Convert to EST (America/New_York)
    const estOptions: Intl.DateTimeFormatOptions = { timeZone: 'America/New_York' }

    // Get day of week in EST
    const dayName = date.toLocaleDateString('en-US', { ...estOptions, weekday: 'short' })

    // Get date parts in EST
    const month = date.toLocaleDateString('en-US', { ...estOptions, month: 'numeric' })
    const day = date.toLocaleDateString('en-US', { ...estOptions, day: 'numeric' })
    const year = date.toLocaleDateString('en-US', { ...estOptions, year: '2-digit' })

    // Get time parts in EST
    const hour = date.toLocaleString('en-US', { ...estOptions, hour: 'numeric', hour12: true })
    const minute = date.toLocaleString('en-US', { ...estOptions, minute: '2-digit' })

    // Extract just the number and AM/PM from hour
    const hourMatch = hour.match(/(\d+)\s*(AM|PM)/i)
    const hourNum = hourMatch?.[1] ?? '12'
    const ampm = hourMatch?.[2]?.toUpperCase() ?? 'AM'

    return `${dayName} ${month}/${day}/${year} ${hourNum}:${minute}${ampm}`
  } catch (error) {
    console.warn('Failed to format timestamp:', isoString, error)
    return isoString
  }
}

/**
 * Format confidence score as percentage
 */
export function formatConfidence(score: number | null): string {
  if (score === null || score === undefined) return 'N/A'
  return `${Math.round(score * 100)}%`
}

/**
 * Truncate long text with ellipsis
 */
export function truncateText(text: string | null, maxLength: number): string {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

/**
 * Format email body for display
 * Requirement: FR-013 (truncate to 2000 chars)
 */
export function formatEmailBody(
  body: string | null,
  maxChars: number = 2000
): {
  preview: string
  isTruncated: boolean
  fullLength: number
} {
  if (!body) {
    return {
      preview: '',
      isTruncated: false,
      fullLength: 0,
    }
  }

  const fullLength = body.length
  const isTruncated = fullLength > maxChars

  return {
    preview: isTruncated ? body.slice(0, maxChars) : body,
    isTruncated,
    fullLength,
  }
}

/**
 * Format date for date picker input (YYYY-MM-DD)
 */
export function formatDateForInput(isoString: string | null): string {
  if (!isoString) return ''

  try {
    const date = new Date(isoString)
    const formatted = date.toISOString().split('T')[0]
    return formatted || ''
  } catch (error) {
    console.warn('Failed to format date:', isoString, error)
    return ''
  }
}

/**
 * Format relative time (e.g., "2 hours ago", "3 days ago")
 */
export function formatRelativeTime(isoString: string | null): string {
  if (!isoString) return 'N/A'

  try {
    const date = new Date(isoString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`

    return formatTimestamp(isoString)
  } catch (error) {
    console.warn('Failed to format relative time:', isoString, error)
    return isoString
  }
}
