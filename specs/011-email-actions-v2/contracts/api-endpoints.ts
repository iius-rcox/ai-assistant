/**
 * Email Actions V2 - Supabase Service Contracts
 * Feature: 011-email-actions-v2
 *
 * This contract defines the service layer interfaces for the correction-ui
 * frontend to interact with the new Email Actions V2 entities.
 */

import type { ActionTypeV2, SenderListEntry, Shipment, Draft, CalendarEvent, ActionLog } from './action-types';

// =============================================================================
// CLASSIFICATION SERVICE UPDATES
// =============================================================================

/**
 * Extended classification type with v2 action fields.
 */
export interface ClassificationV2 {
  id: number;
  email_id: number;

  // Original fields
  category: string;
  urgency: string;
  confidence_score: number;
  summary: string | null;

  // V2 action fields
  action_v2: ActionTypeV2;
  action_confidence: number | null;
  action_auto_assigned: boolean;
  has_tracking_info: boolean;
  has_date_info: boolean;

  // Correction tracking
  original_category: string | null;
  original_urgency: string | null;
  original_action: string | null; // Old action field (deprecated)
  corrected_timestamp: string | null;
  corrected_by: string | null;
  version: number;

  // Timestamps
  created_at: string;
  updated_at: string;

  // Joined email data
  email?: {
    id: number;
    subject: string | null;
    sender: string | null;
    body: string | null;
    received_timestamp: string;
  };
}

/**
 * Request to update a classification's action.
 */
export interface UpdateActionRequest {
  classification_id: number;
  action_v2: ActionTypeV2;
  correction_reason?: string;
}

/**
 * Response from updating a classification's action.
 */
export interface UpdateActionResponse {
  success: boolean;
  classification: ClassificationV2;
  action_log_id: number;
  error?: string;
}

// =============================================================================
// SENDER LIST SERVICE
// =============================================================================

/**
 * Request to add an entry to safelist or blacklist.
 */
export interface AddSenderListRequest {
  list_type: 'safelist' | 'blacklist';
  entry_type: 'email' | 'domain';
  entry_value: string;
  added_reason?: string;
  source_email_id?: number;
}

/**
 * Request to remove an entry from a list (soft delete).
 */
export interface RemoveSenderListRequest {
  entry_id: number;
  deactivated_reason?: string;
}

/**
 * Sender list service interface.
 */
export interface SenderListService {
  /**
   * Get all active entries in a list.
   */
  getList(listType: 'safelist' | 'blacklist'): Promise<SenderListEntry[]>;

  /**
   * Get all active entries (both lists).
   */
  getAllEntries(): Promise<{
    safelist: SenderListEntry[];
    blacklist: SenderListEntry[];
  }>;

  /**
   * Add a new entry to a list.
   */
  addEntry(request: AddSenderListRequest): Promise<SenderListEntry>;

  /**
   * Remove (deactivate) an entry.
   */
  removeEntry(request: RemoveSenderListRequest): Promise<void>;

  /**
   * Check if a sender is on a list.
   */
  checkSender(
    senderEmail: string
  ): Promise<{
    isBlacklisted: boolean;
    isSafelisted: boolean;
    blacklistEntry?: SenderListEntry;
    safelistEntry?: SenderListEntry;
  }>;

  /**
   * Add sender to blacklist from row context menu.
   * FR-020: "Add sender to junk" action.
   */
  addSenderToJunk(
    senderEmail: string,
    sourceEmailId?: number
  ): Promise<SenderListEntry>;

  /**
   * Add sender domain to blacklist from row context menu.
   * FR-020: "Add sender domain to junk" action.
   */
  addDomainToJunk(
    senderEmail: string,
    sourceEmailId?: number
  ): Promise<SenderListEntry>;

  /**
   * Mark as not junk: add to safelist and change action to IGNORE.
   * FR-021: "Mark as not junk" action.
   */
  markAsNotJunk(
    classificationId: number,
    senderEmail: string
  ): Promise<{
    safelistEntry: SenderListEntry;
    updatedClassification: ClassificationV2;
  }>;
}

// =============================================================================
// SHIPMENT SERVICE
// =============================================================================

/**
 * Shipment list filters.
 */
export interface ShipmentFilters {
  delivery_status?: Shipment['delivery_status'][];
  carrier?: string[];
  estimated_delivery_from?: string;
  estimated_delivery_to?: string;
}

/**
 * Shipment service interface.
 */
export interface ShipmentService {
  /**
   * Get all shipments with optional filtering.
   */
  listShipments(filters?: ShipmentFilters): Promise<Shipment[]>;

  /**
   * Get shipment by ID.
   */
  getShipment(id: number): Promise<Shipment | null>;

  /**
   * Get shipment by email ID.
   */
  getShipmentByEmail(emailId: number): Promise<Shipment | null>;

  /**
   * Get pending shipments (not yet delivered).
   */
  getPendingShipments(): Promise<Shipment[]>;

  /**
   * Update shipment status (manual update).
   */
  updateShipmentStatus(
    id: number,
    status: Shipment['delivery_status'],
    actualDelivery?: string
  ): Promise<Shipment>;
}

// =============================================================================
// DRAFT SERVICE
// =============================================================================

/**
 * Draft list filters.
 */
export interface DraftFilters {
  status?: Draft['status'][];
  email_id?: number;
}

/**
 * Draft service interface.
 */
export interface DraftService {
  /**
   * Get all drafts with optional filtering.
   */
  listDrafts(filters?: DraftFilters): Promise<Draft[]>;

  /**
   * Get draft by ID.
   */
  getDraft(id: number): Promise<Draft | null>;

  /**
   * Get pending drafts (awaiting user action).
   */
  getPendingDrafts(): Promise<Draft[]>;

  /**
   * Get draft by email ID.
   */
  getDraftByEmail(emailId: number): Promise<Draft | null>;

  /**
   * Get draft history for an email (all versions including rewrites).
   */
  getDraftHistory(emailId: number): Promise<Draft[]>;
}

// =============================================================================
// CALENDAR EVENT SERVICE
// =============================================================================

/**
 * Calendar event list filters.
 */
export interface CalendarEventFilters {
  status?: CalendarEvent['status'][];
  event_start_from?: string;
  event_start_to?: string;
}

/**
 * Calendar event service interface.
 */
export interface CalendarEventService {
  /**
   * Get all calendar events with optional filtering.
   */
  listCalendarEvents(filters?: CalendarEventFilters): Promise<CalendarEvent[]>;

  /**
   * Get calendar event by ID.
   */
  getCalendarEvent(id: number): Promise<CalendarEvent | null>;

  /**
   * Get calendar event by email ID.
   */
  getCalendarEventByEmail(emailId: number): Promise<CalendarEvent | null>;

  /**
   * Get tentative events (pending confirmation).
   */
  getTentativeEvents(): Promise<CalendarEvent[]>;

  /**
   * Get upcoming events.
   */
  getUpcomingEvents(days?: number): Promise<CalendarEvent[]>;
}

// =============================================================================
// ACTION LOG SERVICE
// =============================================================================

/**
 * Action log filters.
 */
export interface ActionLogFilters {
  email_id?: number;
  classification_id?: number;
  action?: ActionTypeV2[];
  source?: ActionLog['source'][];
  from_date?: string;
  to_date?: string;
}

/**
 * Action log service interface.
 */
export interface ActionLogService {
  /**
   * Get action logs with optional filtering.
   */
  listActionLogs(filters?: ActionLogFilters): Promise<ActionLog[]>;

  /**
   * Get action logs for a specific email.
   */
  getEmailActionHistory(emailId: number): Promise<ActionLog[]>;

  /**
   * Get recent action logs (for dashboard).
   */
  getRecentActions(limit?: number): Promise<ActionLog[]>;

  /**
   * Get action statistics.
   */
  getActionStats(fromDate?: string, toDate?: string): Promise<{
    byAction: Record<ActionTypeV2, number>;
    bySource: Record<ActionLog['source'], number>;
    autoAssignedRate: number;
    totalActions: number;
  }>;
}

// =============================================================================
// CLASSIFICATION SERVICE EXTENSIONS
// =============================================================================

/**
 * Extended classification service interface with v2 features.
 */
export interface ClassificationServiceV2 {
  /**
   * Update action for a classification.
   * Creates action log entry.
   */
  updateAction(request: UpdateActionRequest): Promise<UpdateActionResponse>;

  /**
   * Bulk update actions for multiple classifications.
   */
  bulkUpdateAction(
    requests: UpdateActionRequest[]
  ): Promise<{
    successful: number;
    failed: number;
    results: UpdateActionResponse[];
  }>;

  /**
   * Get classification with action-specific related data.
   * Includes: shipment (if SHIPMENT), draft (if DRAFT_REPLY), calendar_event (if CALENDAR).
   */
  getClassificationWithActionData(id: number): Promise<{
    classification: ClassificationV2;
    shipment?: Shipment;
    draft?: Draft;
    calendarEvent?: CalendarEvent;
    actionHistory: ActionLog[];
  }>;

  /**
   * Get action availability for a classification.
   * Used to enable/disable action dropdown options.
   */
  getActionAvailability(classificationId: number): Promise<{
    [K in ActionTypeV2]: {
      available: boolean;
      reason?: string;
    };
  }>;
}

// =============================================================================
// SUPABASE QUERY PATTERNS
// =============================================================================

/**
 * Example Supabase queries for service implementation.
 *
 * These are provided as reference for implementing the services.
 */

export const QUERY_EXAMPLES = {
  // Get classifications with v2 action data
  listClassificationsV2: `
    SELECT
      c.*,
      e.subject, e.sender, e.body, e.received_timestamp
    FROM classifications c
    JOIN emails e ON c.email_id = e.id
    ORDER BY c.created_at DESC
    LIMIT $1 OFFSET $2
  `,

  // Check if sender is blacklisted
  checkBlacklist: `
    SELECT EXISTS (
      SELECT 1 FROM sender_lists
      WHERE list_type = 'blacklist'
      AND is_active = true
      AND (
        (entry_type = 'email' AND entry_value = lower($1))
        OR (entry_type = 'domain' AND entry_value = lower($2))
      )
    ) as is_blacklisted
  `,

  // Get pending shipments
  getPendingShipments: `
    SELECT s.*, e.subject, e.sender
    FROM shipments s
    JOIN emails e ON s.email_id = e.id
    WHERE s.delivery_status NOT IN ('delivered', 'exception')
    ORDER BY s.estimated_delivery ASC NULLS LAST
  `,

  // Get pending drafts
  getPendingDrafts: `
    SELECT d.*, e.subject, e.sender
    FROM drafts d
    JOIN emails e ON d.email_id = e.id
    WHERE d.status IN ('pending', 'rewriting')
    AND (d.expires_at IS NULL OR d.expires_at > NOW())
    ORDER BY d.generated_at DESC
  `,

  // Get tentative calendar events
  getTentativeEvents: `
    SELECT ce.*, e.subject, e.sender
    FROM calendar_events ce
    JOIN emails e ON ce.email_id = e.id
    WHERE ce.status = 'tentative'
    AND ce.event_start > NOW()
    ORDER BY ce.event_start ASC
  `,

  // Get action statistics
  getActionStats: `
    SELECT
      action,
      COUNT(*) as count,
      COUNT(*) FILTER (WHERE auto_assigned = true) as auto_count
    FROM action_logs
    WHERE created_at >= $1 AND created_at <= $2
    GROUP BY action
  `,

  // Mark as not junk (transaction)
  markAsNotJunk: `
    -- Transaction: Add to safelist + update classification
    BEGIN;

    INSERT INTO sender_lists (list_type, entry_type, entry_value, added_reason, source_email_id)
    VALUES ('safelist', 'email', lower($1), 'Marked as not junk', $2)
    ON CONFLICT (list_type, entry_value) DO NOTHING;

    UPDATE classifications
    SET action_v2 = 'IGNORE', updated_at = NOW()
    WHERE id = $3;

    INSERT INTO action_logs (email_id, classification_id, action, previous_action, auto_assigned, source, assignment_reason)
    SELECT email_id, id, 'IGNORE', action_v2, false, 'ui_manual', 'Marked as not junk'
    FROM classifications WHERE id = $3;

    COMMIT;
  `,
};

// =============================================================================
// ERROR CODES
// =============================================================================

/**
 * Error codes for service operations.
 */
export const ERROR_CODES = {
  // Sender list errors
  DUPLICATE_ENTRY: 'SENDER_LIST_DUPLICATE_ENTRY',
  ENTRY_NOT_FOUND: 'SENDER_LIST_ENTRY_NOT_FOUND',
  INVALID_EMAIL: 'SENDER_LIST_INVALID_EMAIL',
  INVALID_DOMAIN: 'SENDER_LIST_INVALID_DOMAIN',

  // Action errors
  ACTION_NOT_AVAILABLE: 'ACTION_NOT_AVAILABLE',
  CLASSIFICATION_NOT_FOUND: 'CLASSIFICATION_NOT_FOUND',
  PROTECTED_CATEGORY: 'ACTION_PROTECTED_CATEGORY',

  // Draft errors
  DRAFT_NOT_FOUND: 'DRAFT_NOT_FOUND',
  DRAFT_EXPIRED: 'DRAFT_EXPIRED',
  DRAFT_ALREADY_SENT: 'DRAFT_ALREADY_SENT',

  // Shipment errors
  SHIPMENT_NOT_FOUND: 'SHIPMENT_NOT_FOUND',
  NO_TRACKING_INFO: 'SHIPMENT_NO_TRACKING_INFO',

  // Calendar errors
  CALENDAR_EVENT_NOT_FOUND: 'CALENDAR_EVENT_NOT_FOUND',
  CALENDAR_SYNC_FAILED: 'CALENDAR_SYNC_FAILED',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
