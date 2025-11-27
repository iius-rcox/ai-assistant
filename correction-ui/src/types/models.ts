/**
 * TypeScript Type Definitions
 * Feature: 003-correction-ui
 * Task: T010
 *
 * Frontend data models derived from database schema
 */

import type { Database } from './database.types'
import type { Category, UrgencyLevel, ActionType } from './enums'

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
