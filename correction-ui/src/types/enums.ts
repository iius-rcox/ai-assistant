/**
 * Enum Constants
 * Feature: 003-correction-ui (updated: 011-email-actions-v2)
 * Task: T009, T002
 *
 * Classification enum values matching database constraints
 */

export const CATEGORIES = ['KIDS', 'ROBYN', 'WORK', 'FINANCIAL', 'SHOPPING', 'CHURCH', 'OTHER'] as const

export const URGENCY_LEVELS = ['HIGH', 'MEDIUM', 'LOW'] as const

// Legacy action types (v1) - kept for backward compatibility
export const ACTION_TYPES = ['FYI', 'RESPOND', 'TASK', 'PAYMENT', 'CALENDAR', 'NONE'] as const

// New action types (v2) - Feature: 011-email-actions-v2
export const ACTION_TYPES_V2 = [
  'IGNORE',
  'SHIPMENT',
  'DRAFT_REPLY',
  'JUNK',
  'NOTIFY',
  'CALENDAR',
] as const

// Type exports
export type Category = (typeof CATEGORIES)[number]
export type UrgencyLevel = (typeof URGENCY_LEVELS)[number]
export type ActionType = (typeof ACTION_TYPES)[number]
export type ActionTypeV2 = (typeof ACTION_TYPES_V2)[number]

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

// Legacy action labels (v1)
export const ACTION_LABELS: Record<ActionType, string> = {
  FYI: 'FYI (Information Only)',
  RESPOND: 'Respond (Reply Needed)',
  TASK: 'Task (Action Item)',
  PAYMENT: 'Payment (Bill Due)',
  CALENDAR: 'Calendar (Event/Meeting)',
  NONE: 'None',
}

// New action labels (v2) - Feature: 011-email-actions-v2
export const ACTION_V2_LABELS: Record<ActionTypeV2, string> = {
  IGNORE: 'Ignore',
  SHIPMENT: 'Shipment',
  DRAFT_REPLY: 'Draft Reply',
  JUNK: 'Junk',
  NOTIFY: 'Notify',
  CALENDAR: 'Calendar',
}
