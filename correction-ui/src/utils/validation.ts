/**
 * Validation Service
 * Feature: 003-correction-ui
 * Task: T013
 * Requirement: FR-014 (Prevent invalid enum values)
 *
 * Client-side validation before database updates
 */

import { CATEGORIES, URGENCY_LEVELS, ACTION_TYPES } from '@/types/enums'
import type { Category, UrgencyLevel, ActionType } from '@/types/enums'

export interface ValidationError {
  field: string
  message: string
}

/**
 * Validate classification edit form
 * Returns array of error messages (empty if valid)
 */
export function validateClassificationEdit(form: {
  category: string
  urgency: string
  action: string
}): ValidationError[] {
  const errors: ValidationError[] = []

  // Validate category
  if (!CATEGORIES.includes(form.category as Category)) {
    errors.push({
      field: 'category',
      message: `Invalid category: ${form.category}. Must be one of: ${CATEGORIES.join(', ')}`
    })
  }

  // Validate urgency
  if (!URGENCY_LEVELS.includes(form.urgency as UrgencyLevel)) {
    errors.push({
      field: 'urgency',
      message: `Invalid urgency: ${form.urgency}. Must be one of: ${URGENCY_LEVELS.join(', ')}`
    })
  }

  // Validate action
  if (!ACTION_TYPES.includes(form.action as ActionType)) {
    errors.push({
      field: 'action',
      message: `Invalid action: ${form.action}. Must be one of: ${ACTION_TYPES.join(', ')}`
    })
  }

  return errors
}

/**
 * Validate filter values
 */
export function validateFilters(filters: {
  confidenceMin?: number
  confidenceMax?: number
  dateFrom?: string
  dateTo?: string
}): ValidationError[] {
  const errors: ValidationError[] = []

  // Validate confidence range
  if (filters.confidenceMin !== undefined && (filters.confidenceMin < 0 || filters.confidenceMin > 1)) {
    errors.push({
      field: 'confidenceMin',
      message: 'Minimum confidence must be between 0 and 1'
    })
  }

  if (filters.confidenceMax !== undefined && (filters.confidenceMax < 0 || filters.confidenceMax > 1)) {
    errors.push({
      field: 'confidenceMax',
      message: 'Maximum confidence must be between 0 and 1'
    })
  }

  if (
    filters.confidenceMin !== undefined &&
    filters.confidenceMax !== undefined &&
    filters.confidenceMin > filters.confidenceMax
  ) {
    errors.push({
      field: 'confidence',
      message: 'Minimum confidence cannot be greater than maximum'
    })
  }

  // Validate date range
  if (filters.dateFrom && filters.dateTo) {
    const from = new Date(filters.dateFrom)
    const to = new Date(filters.dateTo)

    if (from > to) {
      errors.push({
        field: 'date',
        message: 'Start date cannot be after end date'
      })
    }
  }

  return errors
}
