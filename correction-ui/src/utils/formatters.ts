/**
 * Formatter Utilities
 * Feature: 003-correction-ui
 * Task: T012
 * Requirements: FR-013, FR-018
 *
 * Utilities for formatting data for display
 */

/**
 * Format ISO timestamp to local user timezone
 * Requirement: FR-018
 */
export function formatTimestamp(isoString: string | null): string {
  if (!isoString) return 'N/A'

  try {
    const date = new Date(isoString)
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date)
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
      fullLength: 0
    }
  }

  const fullLength = body.length
  const isTruncated = fullLength > maxChars

  return {
    preview: isTruncated ? body.slice(0, maxChars) : body,
    isTruncated,
    fullLength
  }
}

/**
 * Format date for date picker input (YYYY-MM-DD)
 */
export function formatDateForInput(isoString: string | null): string {
  if (!isoString) return ''

  try {
    const date = new Date(isoString)
    return date.toISOString().split('T')[0]
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
