/**
 * Enum Constants
 * Feature: 005-table-enhancements
 *
 * Array constants for dropdown options and bulk actions.
 * These match the enum types defined in @/types/enums.ts
 */

// Categories (from Type: Category in types/enums.ts)
export const CATEGORIES = [
  'KIDS',
  'ROBYN',
  'WORK',
  'FINANCIAL',
  'SHOPPING',
  'OTHER'
] as const

// Urgency levels (from Type: UrgencyLevel in types/enums.ts)
export const URGENCY_LEVELS = [
  'HIGH',
  'MEDIUM',
  'LOW'
] as const

// Action types (from Type: ActionType in types/enums.ts)
export const ACTION_TYPES = [
  'FYI',
  'RESPOND',
  'TASK',
  'PAYMENT',
  'CALENDAR',
  'NONE'
] as const

// Export types derived from constants
export type CategoryValue = typeof CATEGORIES[number]
export type UrgencyValue = typeof URGENCY_LEVELS[number]
export type ActionValue = typeof ACTION_TYPES[number]
