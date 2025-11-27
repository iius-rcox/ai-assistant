/**
 * TypeScript Type Definitions
 * Feature: 003-correction-ui (updated: 011-email-actions-v2)
 * Task: T010, T003
 *
 * Frontend data models derived from database schema
 */

import type { Database } from './database.types'
import type { Category, UrgencyLevel, ActionType, ActionTypeV2 } from './enums'

// Database table types
export type Classification = Database['public']['Tables']['classifications']['Row']
export type Email = Database['public']['Tables']['emails']['Row']
export type CorrectionLog = Database['public']['Tables']['correction_logs']['Row']

// Derived models with joins
export interface ClassificationWithEmail extends Classification {
  email: Email
}

// Form models
export interface ClassificationEditForm {
  id: number
  category: Category
  urgency: UrgencyLevel
  action: ActionType
}

// Analytics models
export interface CorrectionPattern {
  field_name: 'CATEGORY' | 'URGENCY' | 'ACTION'
  original_value: string
  corrected_value: string
  occurrence_count: number
  example_emails?: {
    email_id: number
    subject: string
    sender: string
  }[]
}

export interface CorrectionTimepoint {
  date: string // ISO date (YYYY-MM-DD)
  count: number // Corrections on this date
}

export interface CorrectionStatistics {
  summary: {
    totalCorrections: number
    correctionRate: number // Percentage (0-100)
    mostCorrectedCategory: string
  }
  patterns: CorrectionPattern[]
  timeline: CorrectionTimepoint[]
}

// Filter models
export interface ClassificationFilters {
  confidenceMin?: number
  confidenceMax?: number
  category?: Category[]
  corrected?: boolean
  dateFrom?: string
  dateTo?: string
  // Column search filters (Feature: 008-column-search-filters)
  subjectSearch?: string
  senderSearch?: string
  categorySearch?: string
  urgencySearch?: string
  actionSearch?: string
}

// Pagination models
export interface PaginationParams {
  page: number
  pageSize: number
  sortBy?: string
  sortDir?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  totalCount: number
  pageCount: number
  currentPage: number
}

// =============================================================================
// EMAIL ACTIONS V2 ENTITY TYPES
// Feature: 011-email-actions-v2
// Task: T003
// =============================================================================

/**
 * Extended classification with v2 action fields.
 */
export interface ClassificationV2 extends Classification {
  action_v2: ActionTypeV2
  action_confidence: number | null
  action_auto_assigned: boolean
  has_tracking_info: boolean
  has_date_info: boolean
}

/**
 * Classification with email and v2 action fields.
 */
export interface ClassificationWithEmailV2 extends ClassificationV2 {
  email: Email
}

/**
 * Shipment entity for tracking extracted shipping information.
 */
export interface Shipment {
  id: number
  email_id: number
  classification_id: number
  tracking_number: string
  carrier: 'USPS' | 'UPS' | 'FedEx' | 'Amazon' | 'DHL' | 'OnTrac' | 'LaserShip' | 'Other'
  carrier_tracking_url: string | null
  items: Array<{ name: string; quantity?: number; price?: string }>
  estimated_delivery: string | null
  actual_delivery: string | null
  delivery_status: 'label_created' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'exception' | 'unknown'
  extracted_at: string
  last_status_check: string | null
  extraction_confidence: number | null
  created_at: string
  updated_at: string
}

/**
 * Draft entity for AI-generated reply drafts.
 */
export interface Draft {
  id: number
  email_id: number
  classification_id: number
  draft_content: string
  draft_subject: string | null
  status: 'pending' | 'sent' | 'discarded' | 'rewriting' | 'expired'
  telegram_message_id: string | null
  telegram_chat_id: string | null
  rewrite_count: number
  rewrite_instructions: string | null
  previous_draft_id: number | null
  generated_at: string
  sent_to_telegram_at: string | null
  user_responded_at: string | null
  email_sent_at: string | null
  expires_at: string | null
  generation_model: string | null
  generation_confidence: number | null
  created_at: string
  updated_at: string
}

/**
 * CalendarEvent entity for tracking Google Calendar events.
 */
export interface CalendarEvent {
  id: number
  email_id: number
  classification_id: number
  google_event_id: string | null
  google_calendar_id: string
  google_event_link: string | null
  event_title: string
  event_description: string | null
  event_location: string | null
  event_start: string
  event_end: string | null
  is_all_day: boolean
  status: 'tentative' | 'confirmed' | 'cancelled' | 'failed'
  extracted_at: string
  extraction_confidence: number | null
  sync_error: string | null
  created_at: string
  updated_at: string
}

/**
 * SenderListEntry entity for SafeList/BlackList management.
 */
export interface SenderListEntry {
  id: number
  list_type: 'safelist' | 'blacklist'
  entry_type: 'email' | 'domain'
  entry_value: string
  added_by: string
  added_reason: string | null
  source_email_id: number | null
  is_active: boolean
  deactivated_at: string | null
  deactivated_reason: string | null
  created_at: string
  updated_at: string
}

/**
 * ActionLog entity for audit trail.
 */
export interface ActionLog {
  id: number
  email_id: number
  classification_id: number
  action: ActionTypeV2
  previous_action: ActionTypeV2 | null
  confidence_score: number | null
  auto_assigned: boolean
  assignment_reason: string | null
  extracted_data: Record<string, unknown> | null
  source: 'workflow' | 'ui_manual' | 'ui_bulk' | 'telegram' | 'system'
  created_at: string
}
