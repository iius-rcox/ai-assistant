/**
 * Action Log Service
 * Feature: 011-email-actions-v2
 * Task: T009
 *
 * Service for querying action logs (audit trail)
 */

import { supabase } from './supabase'
import { perfStart, perfEnd, logInfo } from '@/utils/logger'
import type { ActionLog } from '@/types/models'
import type { ActionTypeV2 } from '@/types/enums'
import type { Database } from '@/types/database.types'

/**
 * Filters for querying action logs
 */
export interface ActionLogFilters {
  email_id?: number
  classification_id?: number
  action?: ActionTypeV2[]
  source?: ActionLog['source'][]
  from_date?: string
  to_date?: string
}

/**
 * Action statistics response
 */
export interface ActionStats {
  byAction: Record<ActionTypeV2, number>
  bySource: Record<ActionLog['source'], number>
  autoAssignedRate: number
  totalActions: number
}

/**
 * List action logs with optional filtering
 * FR-011: Log all actions, confidence scores, extracted fields
 */
export async function listActionLogs(filters?: ActionLogFilters): Promise<ActionLog[]> {
  perfStart('listActionLogs')

  // Type assertion needed for manually-defined table types
  let query = (supabase.from('action_logs') as any)
    .select('*')
    .order('created_at', { ascending: false })

  if (filters) {
    if (filters.email_id !== undefined) {
      query = query.eq('email_id', filters.email_id)
    }
    if (filters.classification_id !== undefined) {
      query = query.eq('classification_id', filters.classification_id)
    }
    if (filters.action && filters.action.length > 0) {
      query = query.in('action', filters.action)
    }
    if (filters.source && filters.source.length > 0) {
      query = query.in('source', filters.source)
    }
    if (filters.from_date) {
      query = query.gte('created_at', filters.from_date)
    }
    if (filters.to_date) {
      query = query.lte('created_at', filters.to_date)
    }
  }

  const { data, error } = await query

  if (error) {
    perfEnd('listActionLogs', { error: true })
    throw error
  }

  perfEnd('listActionLogs', { count: data?.length || 0 })
  return (data || []) as ActionLog[]
}

/**
 * Get action logs for a specific email
 * FR-012: Support action reversibility by retaining previous state
 */
export async function getEmailActionHistory(emailId: number): Promise<ActionLog[]> {
  perfStart('getEmailActionHistory')

  const { data, error } = await (supabase.from('action_logs') as any)
    .select('*')
    .eq('email_id', emailId)
    .order('created_at', { ascending: false })

  if (error) {
    perfEnd('getEmailActionHistory', { error: true, emailId })
    throw error
  }

  perfEnd('getEmailActionHistory', { emailId, count: data?.length || 0 })
  logInfo('Email action history loaded', { emailId, count: data?.length || 0 })

  return (data || []) as ActionLog[]
}

/**
 * Get action logs for a specific classification
 */
export async function getClassificationActionHistory(classificationId: number): Promise<ActionLog[]> {
  perfStart('getClassificationActionHistory')

  const { data, error } = await (supabase.from('action_logs') as any)
    .select('*')
    .eq('classification_id', classificationId)
    .order('created_at', { ascending: false })

  if (error) {
    perfEnd('getClassificationActionHistory', { error: true, classificationId })
    throw error
  }

  perfEnd('getClassificationActionHistory', { classificationId, count: data?.length || 0 })
  return (data || []) as ActionLog[]
}

/**
 * Get recent action logs (for dashboard)
 */
export async function getRecentActions(limit: number = 50): Promise<ActionLog[]> {
  perfStart('getRecentActions')

  const { data, error } = await (supabase.from('action_logs') as any)
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    perfEnd('getRecentActions', { error: true })
    throw error
  }

  perfEnd('getRecentActions', { count: data?.length || 0 })
  return (data || []) as ActionLog[]
}

/**
 * Get action statistics for a date range
 */
export async function getActionStats(fromDate?: string, toDate?: string): Promise<ActionStats> {
  perfStart('getActionStats')

  let query = (supabase.from('action_logs') as any).select('action, source, auto_assigned')

  if (fromDate) {
    query = query.gte('created_at', fromDate)
  }
  if (toDate) {
    query = query.lte('created_at', toDate)
  }

  const { data, error } = await query

  if (error) {
    perfEnd('getActionStats', { error: true })
    throw error
  }

  const logs = (data || []) as Array<{
    action: ActionTypeV2
    source: ActionLog['source']
    auto_assigned: boolean
  }>

  // Calculate statistics
  const byAction: Record<string, number> = {}
  const bySource: Record<string, number> = {}
  let autoAssignedCount = 0

  for (const log of logs) {
    byAction[log.action] = (byAction[log.action] || 0) + 1
    bySource[log.source] = (bySource[log.source] || 0) + 1
    if (log.auto_assigned) {
      autoAssignedCount++
    }
  }

  const stats: ActionStats = {
    byAction: byAction as Record<ActionTypeV2, number>,
    bySource: bySource as Record<ActionLog['source'], number>,
    autoAssignedRate: logs.length > 0 ? (autoAssignedCount / logs.length) * 100 : 0,
    totalActions: logs.length,
  }

  perfEnd('getActionStats', { total: logs.length })
  logInfo('Action stats calculated', stats)

  return stats
}

/**
 * Create an action log entry
 * Used when updating action from UI
 *
 * Note: Uses type assertion for Supabase operations on action_logs table
 * due to type generation differences between manual and CLI-generated types.
 * Types are defined in database.types.ts and are functionally correct.
 */
export async function createActionLog(params: {
  email_id: number
  classification_id: number
  action: ActionTypeV2
  previous_action?: ActionTypeV2 | null
  confidence_score?: number | null
  auto_assigned: boolean
  assignment_reason?: string | null
  extracted_data?: Record<string, unknown> | null
  source: ActionLog['source']
}): Promise<ActionLog> {
  perfStart('createActionLog')

  const insertData = {
    email_id: params.email_id,
    classification_id: params.classification_id,
    action: params.action,
    previous_action: params.previous_action || null,
    confidence_score: params.confidence_score || null,
    auto_assigned: params.auto_assigned,
    assignment_reason: params.assignment_reason || null,
    extracted_data: params.extracted_data || null,
    source: params.source,
  }

  // Type assertion needed for manually-defined table types
  const { data, error } = await (supabase.from('action_logs') as ReturnType<typeof supabase.from>)
    .insert(insertData as any)
    .select()
    .single()

  if (error) {
    perfEnd('createActionLog', { error: true })
    throw error
  }

  const result = data as ActionLog
  perfEnd('createActionLog', { id: result?.id })
  logInfo('Action log created', {
    id: result?.id,
    action: params.action,
    source: params.source,
  })

  return result
}
