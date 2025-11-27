/**
 * Enum Constants
 * Feature: 003-correction-ui
 * Task: T009
 *
 * Classification enum values matching database constraints
 */

export const CATEGORIES = ['KIDS', 'ROBYN', 'WORK', 'FINANCIAL', 'SHOPPING', 'CHURCH', 'OTHER'] as const

export const URGENCY_LEVELS = ['HIGH', 'MEDIUM', 'LOW'] as const

export const ACTION_TYPES = ['FYI', 'RESPOND', 'TASK', 'PAYMENT', 'CALENDAR', 'NONE'] as const

// Type exports
export type Category = (typeof CATEGORIES)[number]
export type UrgencyLevel = (typeof URGENCY_LEVELS)[number]
export type ActionType = (typeof ACTION_TYPES)[number]

// Display labels for UI dropdowns
export const CATEGORY_LABELS: Record<Category, string> = {
  KIDS: 'Kids & School',
  ROBYN: 'Robyn (Personal)',
  WORK: 'Work & Professional',
  FINANCIAL: 'Financial & Bills',
  SHOPPING: 'Shopping & Orders',
  CHURCH: 'Church & Faith',
  OTHER: 'Other',
}

export const URGENCY_LABELS: Record<UrgencyLevel, string> = {
  HIGH: 'High (Immediate)',
  MEDIUM: 'Medium (This Week)',
  LOW: 'Low (Informational)',
}

export const ACTION_LABELS: Record<ActionType, string> = {
  FYI: 'FYI (Information Only)',
  RESPOND: 'Respond (Reply Needed)',
  TASK: 'Task (Action Item)',
  PAYMENT: 'Payment (Bill Due)',
  CALENDAR: 'Calendar (Event/Meeting)',
  NONE: 'None',
}
