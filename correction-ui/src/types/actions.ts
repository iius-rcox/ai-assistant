/**
 * Email Actions V2 - Action Type Definitions
 * Feature: 011-email-actions-v2
 * Task: T001
 *
 * This module defines the action types, thresholds, and display properties
 * used across the correction-ui and n8n workflows.
 */

// =============================================================================
// ACTION TYPE ENUM
// =============================================================================

/**
 * The six constrained action types for email processing.
 * Replaces the old action types: FYI, RESPOND, TASK, PAYMENT, CALENDAR, NONE
 */
export const ACTION_TYPES_V2 = [
  'IGNORE',
  'SHIPMENT',
  'DRAFT_REPLY',
  'JUNK',
  'NOTIFY',
  'CALENDAR',
] as const

export type ActionTypeV2 = (typeof ACTION_TYPES_V2)[number]

// =============================================================================
// ACTION GROUPING (for UI dropdown)
// =============================================================================

/**
 * Actions grouped by risk level for the dropdown UI.
 * FR-002: Display actions grouped by risk level.
 */
export const ACTION_GROUPS = {
  'Low Risk': ['IGNORE'],
  Enrichment: ['SHIPMENT', 'CALENDAR'],
  'Human Review Required': ['DRAFT_REPLY', 'NOTIFY'],
  Destructive: ['JUNK'],
} as const

export type ActionGroup = keyof typeof ACTION_GROUPS

/**
 * Get the risk group for an action type.
 */
export function getActionGroup(action: ActionTypeV2): ActionGroup {
  for (const [group, actions] of Object.entries(ACTION_GROUPS)) {
    if ((actions as readonly string[]).includes(action)) {
      return group as ActionGroup
    }
  }
  return 'Low Risk' // Fallback
}

// =============================================================================
// CONFIDENCE THRESHOLDS
// =============================================================================

/**
 * Minimum confidence thresholds for auto-assigning each action type.
 * FR-005: Enforce confidence thresholds before auto-assigning actions.
 */
export const ACTION_THRESHOLDS: Record<ActionTypeV2, number> = {
  IGNORE: 0.85, // >85% - Default fallback
  SHIPMENT: 0.9, // >90% - Requires tracking info detection
  DRAFT_REPLY: 0.75, // >75% - Lower threshold, human review required anyway
  JUNK: 0.99, // >=99% - Highest threshold, destructive action
  NOTIFY: 0.85, // >=85% - Important emails
  CALENDAR: 0.85, // >=85% - Requires date detection
}

/**
 * Action priority for conflict resolution.
 * When an email matches multiple action triggers, use the highest priority.
 * Edge case: NOTIFY > CALENDAR > SHIPMENT > DRAFT_REPLY > IGNORE > JUNK
 */
export const ACTION_PRIORITY: ActionTypeV2[] = [
  'NOTIFY', // Highest priority - user needs to know
  'CALENDAR', // Second - events are time-sensitive
  'SHIPMENT', // Third - tracking enrichment
  'DRAFT_REPLY', // Fourth - response suggestion
  'IGNORE', // Fifth - safe default
  'JUNK', // Lowest - only when very confident
]

/**
 * Get action priority (lower number = higher priority).
 */
export function getActionPriority(action: ActionTypeV2): number {
  return ACTION_PRIORITY.indexOf(action)
}

// =============================================================================
// DISPLAY LABELS AND DESCRIPTIONS
// =============================================================================

/**
 * Human-readable labels for each action type.
 */
export const ACTION_V2_LABELS: Record<ActionTypeV2, string> = {
  IGNORE: 'Ignore',
  SHIPMENT: 'Shipment',
  DRAFT_REPLY: 'Draft Reply',
  JUNK: 'Junk',
  NOTIFY: 'Notify',
  CALENDAR: 'Calendar',
}

/**
 * Tooltip descriptions for each action type.
 * FR-003: Show hover tooltips explaining each action's behavior.
 */
export const ACTION_DESCRIPTIONS: Record<ActionTypeV2, string> = {
  IGNORE: 'Email will be marked as read. No notification sent.',
  SHIPMENT: 'Extract tracking number and delivery date. View in Shipments.',
  DRAFT_REPLY: 'AI suggests a reply. Approve via Telegram before sending.',
  JUNK: 'Mark as read and archive to junk folder. Cannot be undone.',
  NOTIFY: 'Send Telegram alert with summary and recommended action.',
  CALENDAR: 'Create tentative calendar event. Confirm in Google Calendar.',
}

/**
 * Status indicator icons for each action type.
 * FR-004: Display status indicators on rows.
 */
export const ACTION_ICONS: Record<ActionTypeV2, string> = {
  IGNORE: '', // No icon for IGNORE
  SHIPMENT: '📦', // Package icon
  DRAFT_REPLY: '📝', // Draft icon
  JUNK: '⚠️', // Warning icon
  NOTIFY: '🔔', // Bell icon
  CALENDAR: '📅', // Calendar icon
}

// =============================================================================
// ACTION AVAILABILITY RULES
// =============================================================================

/**
 * Conditions that must be met for an action to be available.
 */
export interface ActionAvailability {
  /** Action is available by default */
  alwaysAvailable: boolean
  /** Requires tracking info in email (has_tracking_info) */
  requiresTrackingInfo?: boolean
  /** Requires date info in email (has_date_info) */
  requiresDateInfo?: boolean
  /** Requires sender not to be in protected category */
  blockedForProtectedCategories?: boolean
  /** Requires sender to be on blacklist */
  requiresBlacklist?: boolean
}

/**
 * Availability rules for each action type.
 * FR-007: Disable/hide SHIPMENT for emails without tracking info.
 * FR-008: Prevent automatic JUNK for protected categories.
 */
export const ACTION_AVAILABILITY: Record<ActionTypeV2, ActionAvailability> = {
  IGNORE: { alwaysAvailable: true },
  SHIPMENT: { alwaysAvailable: false, requiresTrackingInfo: true },
  DRAFT_REPLY: { alwaysAvailable: true },
  JUNK: {
    alwaysAvailable: false,
    blockedForProtectedCategories: true,
    requiresBlacklist: true,
  },
  NOTIFY: { alwaysAvailable: true },
  CALENDAR: { alwaysAvailable: false, requiresDateInfo: true },
}

/**
 * Protected categories that should never have JUNK auto-assigned.
 * FR-008: Prevent automatic JUNK for financial, school, medical, family.
 */
export const PROTECTED_CATEGORIES = [
  'KIDS', // School/children
  'ROBYN', // Family
  'FINANCIAL', // Banking/bills
  'WORK', // Professional
] as const

export type ProtectedCategory = (typeof PROTECTED_CATEGORIES)[number]

/**
 * Context for checking action availability.
 */
export interface ActionAvailabilityContext {
  hasTrackingInfo?: boolean
  hasDateInfo?: boolean
  category?: string
  isBlacklisted?: boolean
  isSafelisted?: boolean
}

/**
 * Check if an action is available for a given email context.
 */
export function isActionAvailable(action: ActionTypeV2, context: ActionAvailabilityContext): boolean {
  const rules = ACTION_AVAILABILITY[action]

  if (rules.alwaysAvailable) {
    return true
  }

  // SHIPMENT requires tracking info
  if (rules.requiresTrackingInfo && !context.hasTrackingInfo) {
    return false
  }

  // CALENDAR requires date info
  if (rules.requiresDateInfo && !context.hasDateInfo) {
    return false
  }

  // JUNK blocked for protected categories and safelisted senders
  if (rules.blockedForProtectedCategories) {
    if (context.category && PROTECTED_CATEGORIES.includes(context.category as ProtectedCategory)) {
      return false
    }
    if (context.isSafelisted) {
      return false
    }
  }

  return true
}

/**
 * Get unavailability reason for an action.
 */
export function getActionUnavailabilityReason(
  action: ActionTypeV2,
  context: ActionAvailabilityContext
): string | null {
  if (isActionAvailable(action, context)) {
    return null
  }

  const rules = ACTION_AVAILABILITY[action]

  if (rules.requiresTrackingInfo && !context.hasTrackingInfo) {
    return 'No tracking information detected in email'
  }

  if (rules.requiresDateInfo && !context.hasDateInfo) {
    return 'No date/event information detected in email'
  }

  if (rules.blockedForProtectedCategories) {
    if (context.category && PROTECTED_CATEGORIES.includes(context.category as ProtectedCategory)) {
      return `Protected category: ${context.category}`
    }
    if (context.isSafelisted) {
      return 'Sender is on SafeList'
    }
  }

  return 'Action not available'
}

// =============================================================================
// ACTION MIGRATION MAPPING
// =============================================================================

/**
 * Mapping from old action types to new action types.
 * Used for data migration and backward compatibility.
 */
export const ACTION_MIGRATION_MAP: Record<string, ActionTypeV2> = {
  FYI: 'IGNORE',
  RESPOND: 'DRAFT_REPLY',
  TASK: 'NOTIFY',
  PAYMENT: 'NOTIFY',
  CALENDAR: 'CALENDAR',
  NONE: 'IGNORE',
}

/**
 * Get the new action type for an old action type.
 */
export function migrateAction(oldAction: string): ActionTypeV2 {
  return ACTION_MIGRATION_MAP[oldAction] || 'IGNORE'
}

// =============================================================================
// ENTITY TYPES
// =============================================================================

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
