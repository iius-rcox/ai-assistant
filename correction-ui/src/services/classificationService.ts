/**
 * Classification Service
 * Feature: 003-correction-ui
 * Tasks: T021, T022, T023
 * Updated: 011-email-actions-v2 (T016, T017)
 *
 * Business logic for classification CRUD operations
 */

import { supabase } from './supabase'
import { perfStart, perfEnd, logInfo } from '@/utils/logger'
import type {
  ClassificationWithEmail,
  ClassificationFilters,
  PaginatedResponse,
  PaginationParams,
  Classification,
} from '@/types/models'
import type { Category, UrgencyLevel, ActionType, ActionTypeV2 } from '@/types/enums'
import type {
  ClassificationWithDetails,
  CorrectionHistoryEntry,
  BulkActionResult,
} from '@/types/table-enhancements'
import { createActionLog } from './actionLogService'

/**
 * Feature flag for Email Actions V2 (011-email-actions-v2)
 * Set to true after running database migrations (T007)
 */
export const USE_ACTION_V2 = true

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
  perfStart('listClassifications')
  const { page, pageSize, filters, sortBy = 'classified_timestamp', sortDir = 'desc' } = params

  // Check if we have email table filters (subject/sender) that require client-side filtering
  const hasEmailFilters = !!(filters?.subjectSearch || filters?.senderSearch)

  let query = supabase.from('classifications').select(
    `
      *,
      email:emails (
        id,
        message_id,
        subject,
        sender,
        body,
        received_timestamp
      )
    `,
    { count: 'exact' }
  )

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
    // Column search filters (Feature: 008-column-search-filters)
    // Note: subject/sender filters are on joined 'emails' table - PostgREST doesn't support
    // filtering on embedded tables, so those are handled after fetch below.
    // Only category/urgency/action can be filtered server-side (they're on classifications table)
    if (filters.categorySearch) {
      query = query.ilike('category', `%${filters.categorySearch}%`)
    }
    if (filters.urgencySearch) {
      query = query.ilike('urgency', `%${filters.urgencySearch}%`)
    }
    if (filters.actionSearch) {
      query = query.ilike('action', `%${filters.actionSearch}%`)
    }
  }

  // Apply sorting
  // Note: PostgREST doesn't support sorting on embedded/joined table columns directly
  // Map sortBy to valid classification columns, or skip server-side sort for email fields
  const classificationColumns = [
    'id',
    'email_id',
    'category',
    'urgency',
    'action',
    'confidence_score',
    'classified_timestamp',
    'corrected_timestamp',
    'version',
    'created_at',
    'updated_at',
  ]

  // Only apply server-side sorting for classification table columns
  if (classificationColumns.includes(sortBy)) {
    query = query.order(sortBy, { ascending: sortDir === 'asc' })
  } else {
    // For email fields (subject, sender), fall back to default sort
    // Client-side sorting will handle these cases
    query = query.order('classified_timestamp', { ascending: false })
  }

  // If we have email filters (subject/sender), fetch all records for client-side filtering
  // Otherwise, apply server-side pagination
  if (!hasEmailFilters) {
    const start = (page - 1) * pageSize
    const end = start + pageSize - 1
    query = query.range(start, end)
  }

  const { data, error, count } = await query

  if (error) {
    perfEnd('listClassifications', { error: true })
    throw error
  }

  let results = (data || []) as ClassificationWithEmail[]

  // Apply client-side filtering for email fields (subject/sender)
  if (hasEmailFilters && filters) {
    const subjectFilter = filters.subjectSearch?.toLowerCase()
    const senderFilter = filters.senderSearch?.toLowerCase()

    results = results.filter(item => {
      const subjectMatch = !subjectFilter ||
        (item.email?.subject?.toLowerCase().includes(subjectFilter) ?? false)
      const senderMatch = !senderFilter ||
        (item.email?.sender?.toLowerCase().includes(senderFilter) ?? false)
      return subjectMatch && senderMatch
    })
  }

  // Calculate totals based on filtered results
  const totalFiltered = hasEmailFilters ? results.length : (count || 0)

  // Apply client-side pagination if we fetched all records
  if (hasEmailFilters) {
    const start = (page - 1) * pageSize
    const end = start + pageSize
    results = results.slice(start, end)
  }

  perfEnd('listClassifications', { page, pageSize, resultCount: results.length, hasEmailFilters })
  logInfo('Classifications loaded', { page, pageSize, totalCount: totalFiltered, hasEmailFilters })

  return {
    data: results,
    totalCount: totalFiltered,
    pageCount: Math.ceil(totalFiltered / pageSize),
    currentPage: page,
  }
}

/**
 * Get single classification with full email content
 * Task: T022
 * Requirement: FR-002 (detail view)
 */
export async function getClassification(id: number): Promise<ClassificationWithEmail> {
  perfStart('getClassification')
  const { data, error } = await supabase
    .from('classifications')
    .select(
      `
      *,
      email:emails (*)
    `
    )
    .eq('id', id)
    .single()

  if (error) {
    perfEnd('getClassification', { error: true, id })
    throw error
  }

  if (!data) {
    perfEnd('getClassification', { notFound: true, id })
    throw new Error(`Classification with ID ${id} not found`)
  }

  perfEnd('getClassification', { id })
  return data as ClassificationWithEmail
}

/**
 * Update classification (save correction)
 * Task: T023
 * Updated: 011-email-actions-v2 (T016, T017)
 * Requirements: FR-004 (save immediately), FR-005 (visual feedback)
 *
 * Database trigger `log_classification_correction` automatically:
 * - Preserves original values (on first correction)
 * - Sets corrected_timestamp and corrected_by
 * - Creates correction_log entries
 *
 * When USE_ACTION_V2 is enabled:
 * - Updates action_v2 column instead of/in addition to action
 * - Logs to action_logs table for audit trail (FR-011)
 */
export async function updateClassification(request: {
  id: number
  updates: {
    category: Category
    urgency: UrgencyLevel
    action: ActionType
    action_v2?: ActionTypeV2
    correction_reason?: string | null
  }
  /** Email ID for action logging (required when USE_ACTION_V2 is true) */
  emailId?: number
  /** Previous action value for logging */
  previousAction?: ActionType | ActionTypeV2 | null
}): Promise<{ classification: Classification }> {
  perfStart('updateClassification')
  const { id, updates, emailId, previousAction } = request
  logInfo('Updating classification', { id, updates, useActionV2: USE_ACTION_V2 })

  const updatePayload: Record<string, unknown> = {
    category: updates.category,
    urgency: updates.urgency,
    action: updates.action,
    updated_at: new Date().toISOString(),
  }

  // Add action_v2 fields when feature flag is enabled
  if (USE_ACTION_V2 && updates.action_v2) {
    updatePayload.action_v2 = updates.action_v2
    // action_auto_assigned = false since this is a user correction
    updatePayload.action_auto_assigned = false
  }

  const { data, error } = await (supabase.from('classifications') as any)
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    perfEnd('updateClassification', { error: true, id })
    throw error
  }

  if (!data) {
    perfEnd('updateClassification', { noData: true, id })
    throw new Error(`Failed to update classification ${id}`)
  }

  // Log action change to action_logs table (T017)
  // Only log if action_v2 is being used and we have email_id
  if (USE_ACTION_V2 && updates.action_v2 && emailId) {
    try {
      await createActionLog({
        email_id: emailId,
        classification_id: id,
        action: updates.action_v2,
        previous_action: previousAction as ActionTypeV2 | null,
        auto_assigned: false,
        source: 'ui_manual',
      })
      logInfo('Action log created for classification update', { id, action: updates.action_v2 })
    } catch (logError) {
      // Don't fail the update if logging fails
      logInfo('Failed to create action log', { id, error: logError })
    }
  }

  perfEnd('updateClassification', { id, success: true })
  logInfo('Classification updated successfully', { id })

  return {
    classification: data as Classification,
  }
}

/**
 * Get classification with full email body and correction history
 * Feature: 005-table-enhancements
 * Task: T008
 * Requirements: FR-004 (expandable row details)
 *
 * Returns detailed classification data for expanded row view including:
 * - Full email body (not truncated)
 * - Correction history from correction_log table
 */
export async function getClassificationWithDetails(id: number): Promise<ClassificationWithDetails> {
  perfStart('getClassificationWithDetails')

  // Fetch classification with full email data
  // Note: Database uses original_* columns, not corrected_* columns
  const { data: classification, error: classError } = await supabase
    .from('classifications')
    .select(
      `
      id,
      category,
      urgency,
      action,
      confidence_score,
      original_category,
      original_urgency,
      original_action,
      corrected_timestamp,
      version,
      created_at,
      updated_at,
      email:emails (
        id,
        subject,
        sender,
        body,
        received_timestamp
      )
    `
    )
    .eq('id', id)
    .single()

  if (classError) {
    perfEnd('getClassificationWithDetails', { error: true, id })
    throw classError
  }

  if (!classification) {
    perfEnd('getClassificationWithDetails', { notFound: true, id })
    throw new Error(`Classification with ID ${id} not found`)
  }

  // Fetch correction history from correction_logs table
  // Note: correction_logs uses email_id, not classification_id
  const classificationData = classification as any
  const emailId = classificationData.email?.id

  const { data: corrections, error: corrError } = await supabase
    .from('correction_logs')
    .select('*')
    .eq('email_id', emailId)
    .order('created_at', { ascending: false })

  if (corrError) {
    logInfo('No correction history found', { id, error: corrError.message })
  }

  // Transform correction history with proper typing
  // The correction_logs table stores one row per field change with field_name, original_value, corrected_value
  // Group by timestamp to combine multiple field changes into single entries
  const correctionGroups = new Map<string, any>()
  const correctionData = (corrections || []) as any[]

  for (const c of correctionData) {
    const timestamp = c.correction_timestamp || c.created_at
    if (!correctionGroups.has(timestamp)) {
      correctionGroups.set(timestamp, {
        id: c.id,
        correctedAt: timestamp,
        correctedBy: c.corrected_by,
        source: c.corrected_by === 'system' ? 'system' : 'user',
        changes: {},
      })
    }
    const group = correctionGroups.get(timestamp)!
    group.changes[c.field_name] = {
      from: c.original_value,
      to: c.corrected_value,
    }
  }

  const correctionHistory: CorrectionHistoryEntry[] = Array.from(correctionGroups.values()).map(
    (g: any) => ({
      id: g.id,
      previousCategory: g.changes.CATEGORY?.from || null,
      newCategory: g.changes.CATEGORY?.to || null,
      previousUrgency: g.changes.URGENCY?.from || null,
      newUrgency: g.changes.URGENCY?.to || null,
      previousAction: g.changes.ACTION?.from || null,
      newAction: g.changes.ACTION?.to || null,
      correctedAt: g.correctedAt,
      source: g.source as 'user' | 'system',
    })
  )

  const email = classificationData.email as any

  perfEnd('getClassificationWithDetails', { id, historyCount: correctionHistory.length })

  // The database schema stores original values (before correction) in original_* columns
  // and current values (after correction) in category/urgency/action columns
  // If corrected_timestamp is set, the item was corrected
  const wasCorrected = !!classificationData.corrected_timestamp

  return {
    id: classificationData.id,
    category: classificationData.category,
    urgency: classificationData.urgency,
    action: classificationData.action,
    confidence: classificationData.confidence_score,
    // If corrected, original_* has the old value and category/urgency/action has new value
    // We expose "corrected*" as the current value when item was corrected
    correctedCategory: wasCorrected ? classificationData.category : null,
    correctedUrgency: wasCorrected ? classificationData.urgency : null,
    correctedAction: wasCorrected ? classificationData.action : null,
    // And store the original values
    originalCategory: classificationData.original_category,
    originalUrgency: classificationData.original_urgency,
    originalAction: classificationData.original_action,
    version: classificationData.version,
    createdAt: classificationData.created_at,
    updatedAt: classificationData.updated_at,
    email: {
      id: email?.id,
      subject: email?.subject || null,
      sender: email?.sender || null,
      body: email?.body || null,
      receivedAt: email?.received_timestamp,
    },
    correctionHistory,
  }
}

/**
 * Bulk update multiple classifications
 * Feature: 005-table-enhancements
 * Task: T026
 * Requirements: FR-010 (bulk actions)
 *
 * Updates multiple classifications in a single operation with per-item error handling.
 * Maximum 100 items per request.
 */
export async function bulkUpdateClassifications(
  ids: number[],
  updates: {
    category?: Category
    urgency?: UrgencyLevel
    action?: ActionType
    correction_reason?: string
  }
): Promise<BulkActionResult> {
  perfStart('bulkUpdateClassifications')

  if (ids.length === 0) {
    perfEnd('bulkUpdateClassifications', { skipped: true, reason: 'no ids' })
    return { success: [], failed: [] }
  }

  if (ids.length > 100) {
    perfEnd('bulkUpdateClassifications', { error: true, reason: 'too many ids' })
    throw new Error('Maximum 100 items per bulk operation')
  }

  logInfo('Starting bulk update', { count: ids.length, updates })

  const result: BulkActionResult = {
    success: [],
    failed: [],
  }

  // Build update payload (only include provided fields)
  const updatePayload: Record<string, any> = {
    updated_at: new Date().toISOString(),
  }

  if (updates.category !== undefined) {
    updatePayload.category = updates.category
  }
  if (updates.urgency !== undefined) {
    updatePayload.urgency = updates.urgency
  }
  if (updates.action !== undefined) {
    updatePayload.action = updates.action
  }

  try {
    // Attempt batch update via Supabase
    const { data, error } = await (supabase.from('classifications') as any)
      .update(updatePayload)
      .in('id', ids)
      .select('id')

    if (error) {
      // If batch fails, try individual updates
      logInfo('Batch update failed, falling back to individual updates', { error: error.message })

      for (const id of ids) {
        try {
          const { error: singleError } = await (supabase.from('classifications') as any)
            .update(updatePayload)
            .eq('id', id)

          if (singleError) {
            result.failed.push({ id, error: singleError.message })
          } else {
            result.success.push(id)
          }
        } catch (e) {
          result.failed.push({
            id,
            error: e instanceof Error ? e.message : 'Unknown error',
          })
        }
      }
    } else {
      // Batch update succeeded
      const updatedIds = (data || []).map((item: { id: number }) => item.id)
      result.success = updatedIds

      // Check for any IDs that weren't updated
      const updatedSet = new Set(updatedIds)
      ids.forEach(id => {
        if (!updatedSet.has(id)) {
          result.failed.push({ id, error: 'Not found or not updated' })
        }
      })
    }

    perfEnd('bulkUpdateClassifications', {
      success: result.success.length,
      failed: result.failed.length,
    })

    logInfo('Bulk update completed', {
      success: result.success.length,
      failed: result.failed.length,
    })

    return result
  } catch (error) {
    perfEnd('bulkUpdateClassifications', { error: true })
    throw error
  }
}

/**
 * Update action_v2 field for a single classification
 * Feature: 011-email-actions-v2
 * Task: T016, T017
 * Requirements: FR-004 (save immediately), FR-011 (log to action_logs)
 *
 * This is a specialized function for instant save of action changes
 * that logs to action_logs for audit trail.
 */
export async function updateClassificationAction(params: {
  classificationId: number
  emailId: number
  action: ActionTypeV2
  previousAction?: ActionTypeV2 | null
}): Promise<Classification> {
  perfStart('updateClassificationAction')
  const { classificationId, emailId, action, previousAction } = params
  logInfo('Updating classification action_v2', { classificationId, action, previousAction })

  // Update the classification with new action_v2
  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  // When USE_ACTION_V2 is enabled, update action_v2 column
  // Otherwise, fall back to legacy action column (with mapping)
  if (USE_ACTION_V2) {
    updatePayload.action_v2 = action
    updatePayload.action_auto_assigned = false
  } else {
    // Map v2 action to v1 for backward compatibility
    const v2ToV1Map: Record<ActionTypeV2, ActionType> = {
      IGNORE: 'FYI',
      SHIPMENT: 'NONE',
      DRAFT_REPLY: 'RESPOND',
      JUNK: 'NONE',
      NOTIFY: 'FYI',
      CALENDAR: 'CALENDAR',
    }
    updatePayload.action = v2ToV1Map[action]
  }

  const { data, error } = await (supabase.from('classifications') as any)
    .update(updatePayload)
    .eq('id', classificationId)
    .select()
    .single()

  if (error) {
    perfEnd('updateClassificationAction', { error: true, classificationId })
    throw error
  }

  if (!data) {
    perfEnd('updateClassificationAction', { noData: true, classificationId })
    throw new Error(`Failed to update classification ${classificationId}`)
  }

  // Log to action_logs table (T017)
  if (USE_ACTION_V2) {
    try {
      await createActionLog({
        email_id: emailId,
        classification_id: classificationId,
        action,
        previous_action: previousAction,
        auto_assigned: false,
        source: 'ui_manual',
      })
      logInfo('Action log created', { classificationId, action })
    } catch (logError) {
      // Don't fail the update if logging fails
      logInfo('Failed to create action log (non-fatal)', { classificationId, error: logError })
    }
  }

  perfEnd('updateClassificationAction', { classificationId, success: true })
  return data as Classification
}
