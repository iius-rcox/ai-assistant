/**
 * Classification Service
 * Feature: 003-correction-ui
 * Tasks: T021, T022, T023
 *
 * Business logic for classification CRUD operations
 */

import { supabase } from './supabase'
import type {
  ClassificationWithEmail,
  ClassificationFilters,
  PaginatedResponse,
  PaginationParams,
  Classification
} from '@/types/models'
import type { Category, UrgencyLevel, ActionType } from '@/types/enums'

/**
 * List classifications with pagination, filtering, and sorting
 * Task: T021
 * Requirement: FR-001 (paginated list)
 */
export async function listClassifications(params: {
  page: number
  pageSize: number
  filters?: ClassificationFilters
  sortBy?: string
  sortDir?: 'asc' | 'desc'
}): Promise<PaginatedResponse<ClassificationWithEmail>> {
  const { page, pageSize, filters, sortBy = 'classified_timestamp', sortDir = 'desc' } = params

  let query = supabase
    .from('classifications')
    .select(`
      *,
      email:emails (
        id,
        message_id,
        subject,
        sender,
        body,
        received_timestamp
      )
    `, { count: 'exact' })

  // Apply filters
  if (filters) {
    if (filters.confidenceMin !== undefined) {
      query = query.gte('confidence_score', filters.confidenceMin)
    }
    if (filters.confidenceMax !== undefined) {
      query = query.lte('confidence_score', filters.confidenceMax)
    }
    if (filters.category && filters.category.length > 0) {
      query = query.in('category', filters.category)
    }
    if (filters.corrected === true) {
      query = query.not('corrected_timestamp', 'is', null)
    } else if (filters.corrected === false) {
      query = query.is('corrected_timestamp', null)
    }
    if (filters.dateFrom) {
      query = query.gte('classified_timestamp', filters.dateFrom)
    }
    if (filters.dateTo) {
      query = query.lte('classified_timestamp', filters.dateTo)
    }
  }

  // Apply sorting
  query = query.order(sortBy, { ascending: sortDir === 'asc' })

  // Apply pagination
  const start = (page - 1) * pageSize
  const end = start + pageSize - 1
  query = query.range(start, end)

  const { data, error, count } = await query

  if (error) {
    throw error
  }

  return {
    data: (data || []) as ClassificationWithEmail[],
    totalCount: count || 0,
    pageCount: Math.ceil((count || 0) / pageSize),
    currentPage: page
  }
}

/**
 * Get single classification with full email content
 * Task: T022
 * Requirement: FR-002 (detail view)
 */
export async function getClassification(id: number): Promise<ClassificationWithEmail> {
  const { data, error } = await supabase
    .from('classifications')
    .select(`
      *,
      email:emails (*)
    `)
    .eq('id', id)
    .single()

  if (error) {
    throw error
  }

  if (!data) {
    throw new Error(`Classification with ID ${id} not found`)
  }

  return data as ClassificationWithEmail
}

/**
 * Update classification (save correction)
 * Task: T023
 * Requirements: FR-004 (save immediately), FR-005 (visual feedback)
 *
 * Database trigger `log_classification_correction` automatically:
 * - Preserves original values (on first correction)
 * - Sets corrected_timestamp and corrected_by
 * - Creates correction_log entries
 */
export async function updateClassification(request: {
  id: number
  updates: {
    category: Category
    urgency: UrgencyLevel
    action: ActionType
    correction_reason?: string | null
  }
}): Promise<{ classification: Classification }> {
  const { id, updates } = request

  const { data, error } = await supabase
    .from('classifications')
    .update({
      category: updates.category,
      urgency: updates.urgency,
      action: updates.action,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw error
  }

  if (!data) {
    throw new Error(`Failed to update classification ${id}`)
  }

  return {
    classification: data as Classification
  }
}
