/**
 * Service Contracts: Business Logic Layer Function Signatures
 * Feature: 003-correction-ui
 * Date: 2025-11-22
 *
 * These interfaces define the expected signatures for service layer functions
 * that implement business logic and data access operations.
 */

import type {
  ListClassificationsRequest,
  ListClassificationsResponse,
  GetClassificationRequest,
  GetClassificationResponse,
  UpdateClassificationRequest,
  UpdateClassificationResponse,
  GetCorrectionStatisticsRequest,
  GetCorrectionStatisticsResponse
} from './api-contracts'

// ============================================================================
// Classification Service
// ============================================================================

/**
 * Classification Service Interface
 *
 * Handles CRUD operations for email classifications using Supabase client.
 * All methods throw DatabaseError on failure.
 */
export interface IClassificationService {
  /**
   * List classifications with pagination, filtering, and sorting
   *
   * @param request - Page, filters, and sort parameters
   * @returns Paginated list of classifications with joined email data
   * @throws DatabaseError if Supabase connection fails
   * @throws ValidationError if request parameters are invalid
   *
   * Performance: Target <500ms for 50 records with filters
   */
  listClassifications(request: ListClassificationsRequest): Promise<ListClassificationsResponse>

  /**
   * Get single classification with full email content
   *
   * @param request - Classification ID
   * @returns Classification with joined email data
   * @throws DatabaseError if not found or connection fails
   *
   * Performance: Target <200ms
   */
  getClassification(request: GetClassificationRequest): Promise<GetClassificationResponse>

  /**
   * Update classification fields (save correction)
   *
   * Database trigger `log_classification_correction` automatically:
   * 1. Preserves original values in original_* fields (on first correction)
   * 2. Sets corrected_timestamp to NOW()
   * 3. Sets corrected_by to current database user
   * 4. Inserts entries into correction_logs table (one per changed field)
   *
   * @param request - Classification ID and field updates
   * @returns Updated classification with auto-populated correction fields
   * @throws DatabaseError if update fails or ID not found
   * @throws ValidationError if enum values are invalid
   *
   * Performance: Target <300ms (includes trigger execution)
   * Side Effects: Creates 1-3 rows in correction_logs table
   */
  updateClassification(request: UpdateClassificationRequest): Promise<UpdateClassificationResponse>

  /**
   * Get correction statistics and patterns for analytics dashboard
   *
   * Aggregates data from correction_logs table:
   * - Summary: Total corrections, correction rate %, most corrected category
   * - Patterns: Top 20 original→corrected transitions with frequencies
   * - Timeline: Corrections per day/week for charting
   *
   * @param request - Optional date range filter
   * @returns Aggregated statistics and patterns
   * @throws DatabaseError if query fails
   *
   * Performance: Target <1 second (includes aggregations)
   */
  getCorrectionStatistics(request: GetCorrectionStatisticsRequest): Promise<GetCorrectionStatisticsResponse>
}

// ============================================================================
// Logger Service
// ============================================================================

/**
 * Logger Service Interface (FR-021: Browser console logging)
 *
 * Wraps console logging with structured format for debugging
 */
export interface ILoggerService {
  /**
   * Log error to browser console
   */
  error(message: string, error: Error | unknown, context?: Record<string, any>): void

  /**
   * Log warning to browser console
   */
  warn(message: string, context?: Record<string, any>): void

  /**
   * Log info message to browser console
   */
  info(message: string, context?: Record<string, any>): void

  /**
   * Log user action to browser console (for debugging workflow)
   */
  logAction(action: string, details?: Record<string, any>): void
}

/**
 * Example Logger Implementation
 */
export const LoggerService: ILoggerService = {
  error(message: string, error: Error | unknown, context?: Record<string, any>) {
    console.error(`[ERROR] ${message}`, {
      error,
      context,
      timestamp: new Date().toISOString()
    })
  },

  warn(message: string, context?: Record<string, any>) {
    console.warn(`[WARN] ${message}`, {
      context,
      timestamp: new Date().toISOString()
    })
  },

  info(message: string, context?: Record<string, any>) {
    console.info(`[INFO] ${message}`, {
      context,
      timestamp: new Date().toISOString()
    })
  },

  logAction(action: string, details?: Record<string, any>) {
    console.log(`[ACTION] ${action}`, {
      details,
      timestamp: new Date().toISOString()
    })
  }
}

// ============================================================================
// Formatter Service
// ============================================================================

/**
 * Formatter Service Interface
 *
 * Utilities for formatting data for display (dates, confidence scores, etc.)
 */
export interface IFormatterService {
  /**
   * Format ISO timestamp to local user timezone
   * @param isoString - ISO 8601 timestamp
   * @returns Formatted date string (e.g., "Nov 22, 2025 3:30 PM")
   */
  formatTimestamp(isoString: string): string

  /**
   * Format confidence score as percentage
   * @param score - Confidence score (0.0-1.0)
   * @returns Formatted percentage (e.g., "95%")
   */
  formatConfidence(score: number): string

  /**
   * Truncate long text with ellipsis
   * @param text - Text to truncate
   * @param maxLength - Maximum characters before truncation
   * @returns Truncated text with ellipsis if needed
   */
  truncateText(text: string, maxLength: number): string

  /**
   * Format email body for display
   * @param body - Full email body
   * @param maxChars - Maximum characters to show (default: 2000)
   * @returns Truncated body with indicator if truncated
   */
  formatEmailBody(body: string, maxChars?: number): {
    preview: string
    isTruncated: boolean
    fullLength: number
  }
}

// ============================================================================
// Validation Service
// ============================================================================

/**
 * Validation Service Interface
 *
 * Client-side validation before sending to database
 */
export interface IValidationService {
  /**
   * Validate classification edit form
   * @param form - Form data from inline editor
   * @returns Array of error messages (empty if valid)
   */
  validateClassificationEdit(form: {
    category: string
    urgency: string
    action: string
    correction_reason?: string
  }): string[]

  /**
   * Validate filter values
   * @param filters - Filter values from filter panel
   * @returns Array of error messages (empty if valid)
   */
  validateFilters(filters: {
    confidenceMin?: number
    confidenceMax?: number
    dateFrom?: string
    dateTo?: string
  }): string[]
}

// ============================================================================
// Test Fixtures
// ============================================================================

/**
 * Mock Classification for Testing
 */
export const MOCK_CLASSIFICATION: ClassificationWithEmail = {
  id: 1,
  email_id: 100,
  category: 'KIDS',
  urgency: 'HIGH',
  action: 'CALENDAR',
  confidence_score: 0.95,
  extracted_names: ['PTA'],
  extracted_dates: ['tomorrow at 7pm'],
  extracted_amounts: [],
  classified_timestamp: '2025-11-22T10:30:00Z',
  original_category: null,
  original_urgency: null,
  original_action: null,
  corrected_timestamp: null,
  corrected_by: null,
  correction_reason: null,
  created_at: '2025-11-22T10:30:00Z',
  updated_at: '2025-11-22T10:30:00Z',
  email: {
    id: 100,
    message_id: '1234567890abcdef',
    subject: 'PTA Meeting Tomorrow',
    sender: 'school@example.com',
    body: 'Don\'t forget the PTA meeting tomorrow at 7pm in the cafeteria. Please bring baked goods!',
    received_at: '2025-11-22T09:00:00Z'
  }
}

/**
 * Mock Corrected Classification for Testing
 */
export const MOCK_CORRECTED_CLASSIFICATION: ClassificationWithEmail = {
  ...MOCK_CLASSIFICATION,
  id: 2,
  email_id: 101,
  category: 'WORK',
  original_category: 'SHOPPING',
  corrected_timestamp: '2025-11-22T11:00:00Z',
  corrected_by: 'operator',
  correction_reason: 'Email from work vendor, not personal shopping',
  email: {
    id: 101,
    message_id: 'abcdef1234567890',
    subject: 'Order Confirmation #12345',
    sender: 'orders@workvendor.com',
    body: 'Your order for office supplies has been confirmed...',
    received_at: '2025-11-22T08:00:00Z'
  }
}

/**
 * Mock Correction Pattern for Testing
 */
export const MOCK_CORRECTION_PATTERN: CorrectionPattern = {
  field_name: 'CATEGORY',
  original_value: 'SHOPPING',
  corrected_value: 'WORK',
  occurrence_count: 15,
  example_emails: [
    {
      email_id: 101,
      subject: 'Order Confirmation #12345',
      sender: 'orders@workvendor.com'
    },
    {
      email_id: 102,
      subject: 'Purchase Order Received',
      sender: 'vendor@company.com'
    }
  ]
}
