/**
 * Validation Service
 * Feature: 003-correction-ui, 004-inline-edit
 * Task: T013, T012
 * Requirement: FR-014 (Prevent invalid enum values), FR-005 (Validate before save)
 *
 * Client-side validation before database updates
 */

import { CATEGORIES, URGENCY_LEVELS, ACTION_TYPES } from '@/types/enums'
import type { Category, UrgencyLevel, ActionType } from '@/types/enums'
import type { InlineEditData } from '@/types/inline-edit'

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
 * Validate inline edit data
 * Feature: 004-inline-edit
 * Task: T012
 * Requirements: FR-005 (Validate before save)
 *
 * @param data - Inline edit data to validate
 * @returns Array of validation errors (empty if valid)
 */
export function validateInlineEdit(data: InlineEditData): ValidationError[] {
  return validateClassificationEdit(data)
}

/**
 * Check if inline edit data is valid
 * Convenience function that returns boolean
 *
 * @param data - Inline edit data to validate
 * @returns true if valid, false if validation errors exist
 */
export function isValidInlineEdit(data: InlineEditData): boolean {
  return validateInlineEdit(data).length === 0
}

/**
 * Check if inline edit data has any changes compared to original
 * Used to determine if Save button should be enabled
 *
 * @param original - Original classification data
 * @param current - Current inline edit data
 * @returns true if any field has changed
 */
export function hasInlineEditChanges(
  original: Pick<any, 'category' | 'urgency' | 'action'>,
  current: InlineEditData
): boolean {
  return (
    original.category !== current.category ||
    original.urgency !== current.urgency ||
    original.action !== current.action
  )
}

/**
 * Get list of changed fields between original and current
 *
 * @param original - Original classification data
 * @param current - Current inline edit data
 * @returns Array of field names that have changed
 */
export function getChangedFields(
  original: Pick<any, 'category' | 'urgency' | 'action'>,
  current: InlineEditData
): Array<keyof InlineEditData> {
  const changed: Array<keyof InlineEditData> = []

  if (original.category !== current.category) changed.push('category')
  if (original.urgency !== current.urgency) changed.push('urgency')
  if (original.action !== current.action) changed.push('action')

  return changed
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
