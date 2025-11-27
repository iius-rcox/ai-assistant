/**
 * useActionStatus Composable
 * Feature: 011-email-actions-v2
 * Task: T015
 *
 * Provides computed properties for action status indicators
 */

import { computed, type Ref, type ComputedRef } from 'vue'
import type { ActionTypeV2 } from '@/types/enums'
import type { Draft, CalendarEvent, Shipment } from '@/types/models'
import {
  isActionAvailable,
  type ActionAvailabilityContext,
  ACTION_ICONS,
  ACTION_V2_LABELS,
  ACTION_DESCRIPTIONS,
} from '@/types/actions'

interface ActionStatusOptions {
  action: Ref<ActionTypeV2>
  draft?: Ref<Draft | null | undefined>
  calendarEvent?: Ref<CalendarEvent | null | undefined>
  shipment?: Ref<Shipment | null | undefined>
  context?: Ref<ActionAvailabilityContext>
}

interface ActionStatusReturn {
  /** Icon emoji for the current action */
  icon: ComputedRef<string>
  /** Display label for the current action */
  label: ComputedRef<string>
  /** Description/tooltip text for the current action */
  description: ComputedRef<string>
  /** Whether there's a pending draft awaiting approval */
  hasPendingDraft: ComputedRef<boolean>
  /** Whether there's a pending/tentative calendar event */
  hasPendingEvent: ComputedRef<boolean>
  /** Whether there's a pending shipment (not yet delivered) */
  hasPendingShipment: ComputedRef<boolean>
  /** Whether any action-related item is pending */
  hasPendingItem: ComputedRef<boolean>
  /** Whether the current action is available given the context */
  isActionAvailable: ComputedRef<boolean>
  /** Whether the action is destructive (JUNK) */
  isDestructive: ComputedRef<boolean>
  /** CSS class based on action type */
  actionClass: ComputedRef<string>
}

/**
 * Composable for managing action status indicators
 */
export function useActionStatus(options: ActionStatusOptions): ActionStatusReturn {
  const { action, draft, calendarEvent, shipment, context } = options

  const icon = computed(() => ACTION_ICONS[action.value])
  const label = computed(() => ACTION_V2_LABELS[action.value])
  const description = computed(() => ACTION_DESCRIPTIONS[action.value])

  const hasPendingDraft = computed(() => {
    if (!draft?.value) return false
    return draft.value.status === 'pending' || draft.value.status === 'rewriting'
  })

  const hasPendingEvent = computed(() => {
    if (!calendarEvent?.value) return false
    return calendarEvent.value.status === 'tentative'
  })

  const hasPendingShipment = computed(() => {
    if (!shipment?.value) return false
    const status = shipment.value.delivery_status
    return status !== 'delivered' && status !== 'exception'
  })

  const hasPendingItem = computed(() => {
    switch (action.value) {
      case 'DRAFT_REPLY':
        return hasPendingDraft.value
      case 'CALENDAR':
        return hasPendingEvent.value
      case 'SHIPMENT':
        return hasPendingShipment.value
      default:
        return false
    }
  })

  const isActionAvailableComputed = computed(() => {
    if (!context?.value) return true
    return isActionAvailable(action.value, context.value)
  })

  const isDestructive = computed(() => action.value === 'JUNK')

  const actionClass = computed(() => {
    const base = `action-${action.value.toLowerCase()}`
    const classes = [base]

    if (isDestructive.value) {
      classes.push('action-destructive')
    }
    if (hasPendingItem.value) {
      classes.push('action-pending')
    }

    return classes.join(' ')
  })

  return {
    icon,
    label,
    description,
    hasPendingDraft,
    hasPendingEvent,
    hasPendingShipment,
    hasPendingItem,
    isActionAvailable: isActionAvailableComputed,
    isDestructive,
    actionClass,
  }
}

/**
 * Simple helper to get action display info without reactivity
 */
export function getActionDisplayInfo(action: ActionTypeV2) {
  return {
    icon: ACTION_ICONS[action],
    label: ACTION_V2_LABELS[action],
    description: ACTION_DESCRIPTIONS[action],
    isDestructive: action === 'JUNK',
  }
}

/**
 * Check if an action requires additional context data
 */
export function actionRequiresContext(action: ActionTypeV2): boolean {
  switch (action) {
    case 'SHIPMENT':
      return true // Requires hasTrackingInfo
    case 'CALENDAR':
      return true // Requires hasDateInfo
    case 'JUNK':
      return true // Requires blacklist/safelist check
    default:
      return false
  }
}
