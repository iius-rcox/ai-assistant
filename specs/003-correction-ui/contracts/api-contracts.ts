/**
 * API Contracts: Supabase Database Operations
 * Feature: 003-correction-ui
 * Date: 2025-11-22
 *
 * These interfaces define the expected structure of API operations
 * for interacting with the Supabase PostgreSQL database.
 */

// ============================================================================
// Request/Response Types
// ============================================================================

/**
 * List Classifications Request
 */
export interface ListClassificationsRequest {
  page: number              // Page number (1-indexed)
  pageSize: number          // Records per page (20/50/100)
  filters?: {
    confidenceMin?: number  // Minimum confidence score (0.0-1.0)
    confidenceMax?: number  // Maximum confidence score (0.0-1.0)
    category?: string[]     // Filter by categories (e.g., ['KIDS', 'WORK'])
    corrected?: boolean     // true = only corrected, false = only uncorrected, undefined = all
    dateFrom?: string       // ISO timestamp (inclusive)
    dateTo?: string         // ISO timestamp (inclusive)
  }
  sortBy?: string           // Column name to sort by (default: 'classified_timestamp')
  sortDir?: 'asc' | 'desc'  // Sort direction (default: 'desc')
}

/**
 * List Classifications Response
 */
export interface ListClassificationsResponse {
  classifications: ClassificationWithEmail[]
  totalCount: number        // Total matching records (for pagination)
  pageCount: number         // Total pages
  currentPage: number       // Current page number
}

/**
 * Classification with joined Email data
 */
export interface ClassificationWithEmail {
  id: number
  email_id: number
  category: Category
  urgency: UrgencyLevel
  action: ActionType
  confidence_score: number
  extracted_names: string[]
  extracted_dates: string[]
  extracted_amounts: string[]
  classified_timestamp: string
  original_category?: string
  original_urgency?: string
  original_action?: string
  corrected_timestamp?: string
  corrected_by?: string
  correction_reason?: string
  created_at: string
  updated_at: string
  email: {
    id: number
    message_id: string
    subject: string
    sender: string
    body: string
    received_at: string
  }
}

/**
 * Get Classification Detail Request
 */
export interface GetClassificationRequest {
  id: number  // Classification ID
}

/**
 * Get Classification Detail Response
 */
export interface GetClassificationResponse {
  classification: ClassificationWithEmail
}

/**
 * Update Classification Request (Save Correction)
 */
export interface UpdateClassificationRequest {
  id: number
  updates: {
    category: Category
    urgency: UrgencyLevel
    action: ActionType
    correction_reason?: string  // Optional notes
  }
}

/**
 * Update Classification Response
 */
export interface UpdateClassificationResponse {
  classification: ClassificationWithEmail
  correctionLogs: CorrectionLog[]  // Auto-created by database trigger
}

/**
 * Get Correction Statistics Request
 */
export interface GetCorrectionStatisticsRequest {
  dateFrom?: string  // ISO timestamp (default: 30 days ago)
  dateTo?: string    // ISO timestamp (default: now)
}

/**
 * Get Correction Statistics Response
 */
export interface GetCorrectionStatisticsResponse {
  summary: {
    totalCorrections: number
    correctionRate: number      // Percentage (0-100)
    mostCorrectedCategory: string
  }
  patterns: CorrectionPattern[]  // Top 20 correction patterns
  timeline: CorrectionTimepoint[] // Corrections per week/day
}

/**
 * Correction Pattern (aggregated)
 */
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

/**
 * Correction Timepoint (for chart)
 */
export interface CorrectionTimepoint {
  date: string       // ISO date (YYYY-MM-DD)
  count: number      // Corrections on this date
}

/**
 * Correction Log Entry
 */
export interface CorrectionLog {
  id: number
  email_id: number
  field_name: 'CATEGORY' | 'URGENCY' | 'ACTION'
  original_value: string
  corrected_value: string
  correction_timestamp: string
  corrected_by: string
  created_at: string
}

// ============================================================================
// Enum Types
// ============================================================================

export type Category = 'KIDS' | 'ROBYN' | 'WORK' | 'FINANCIAL' | 'SHOPPING' | 'OTHER'
export type UrgencyLevel = 'HIGH' | 'MEDIUM' | 'LOW'
export type ActionType = 'FYI' | 'RESPOND' | 'TASK' | 'PAYMENT' | 'CALENDAR' | 'NONE'

// ============================================================================
// Error Types
// ============================================================================

export interface DatabaseError {
  code: string
  message: string
  details?: any
  hint?: string
}

export interface ValidationError {
  field: string
  message: string
  value?: any
}

// ============================================================================
// API Service Interface
// ============================================================================

/**
 * Classification Service Interface
 *
 * All methods interact with Supabase database tables:
 * - classifications (primary)
 * - emails (joined for display)
 * - correction_logs (read-only, auto-populated by DB trigger)
 */
export interface IClassificationService {
  /**
   * List classifications with pagination, filtering, and sorting
   * @throws DatabaseError if connection fails
   */
  listClassifications(request: ListClassificationsRequest): Promise<ListClassificationsResponse>

  /**
   * Get single classification with full email content
   * @throws DatabaseError if not found or connection fails
   */
  getClassification(request: GetClassificationRequest): Promise<GetClassificationResponse>

  /**
   * Update classification fields (saves correction)
   * Database trigger automatically:
   * - Preserves original values (on first correction)
   * - Sets corrected_timestamp and corrected_by
   * - Creates correction_log entries
   * @throws DatabaseError if update fails
   * @throws ValidationError if enum values are invalid
   */
  updateClassification(request: UpdateClassificationRequest): Promise<UpdateClassificationResponse>

  /**
   * Get correction statistics and patterns for analytics
   * @throws DatabaseError if query fails
   */
  getCorrectionStatistics(request: GetCorrectionStatisticsRequest): Promise<GetCorrectionStatisticsResponse>
}
