<!--
  ActionStatusIndicator Component
  Feature: 011-email-actions-v2
  Task: T014

  Visual indicator showing action type with icons
  Requirement: FR-004 (display status indicators on rows)
  Icons:
    - NOTIFY: 🔔 (bell)
    - CALENDAR: 📅 (calendar)
    - DRAFT_REPLY: 📝 (draft)
    - SHIPMENT: 📦 (package)
    - JUNK: ⚠️ (warning)
    - IGNORE: (no icon)
-->

<script setup lang="ts">
import { computed } from 'vue'
import type { ActionTypeV2 } from '@/types/enums'
import { ACTION_ICONS, ACTION_V2_LABELS } from '@/types/actions'

interface Props {
  action: ActionTypeV2
  hasPendingDraft?: boolean
  hasPendingEvent?: boolean
  hasPendingShipment?: boolean
  showLabel?: boolean
  size?: 'small' | 'medium' | 'large'
}

const props = withDefaults(defineProps<Props>(), {
  hasPendingDraft: false,
  hasPendingEvent: false,
  hasPendingShipment: false,
  showLabel: false,
  size: 'medium',
})

const icon = computed(() => ACTION_ICONS[props.action])
const label = computed(() => ACTION_V2_LABELS[props.action])

// Determine if there's a pending item requiring attention
const hasPending = computed(() => {
  switch (props.action) {
    case 'DRAFT_REPLY':
      return props.hasPendingDraft
    case 'CALENDAR':
      return props.hasPendingEvent
    case 'SHIPMENT':
      return props.hasPendingShipment
    default:
      return false
  }
})

// CSS classes based on action type
const statusClass = computed(() => ({
  'status--notify': props.action === 'NOTIFY',
  'status--calendar': props.action === 'CALENDAR',
  'status--draft': props.action === 'DRAFT_REPLY',
  'status--shipment': props.action === 'SHIPMENT',
  'status--junk': props.action === 'JUNK',
  'status--ignore': props.action === 'IGNORE',
  'status--pending': hasPending.value,
  [`status--${props.size}`]: true,
}))
</script>

<template>
  <span v-if="icon || showLabel" class="action-status" :class="statusClass" :title="label">
    <span v-if="icon" class="action-status__icon">{{ icon }}</span>
    <span v-if="showLabel" class="action-status__label">{{ label }}</span>
    <span v-if="hasPending" class="action-status__badge" aria-label="Pending action">
      <span class="action-status__badge-dot"></span>
    </span>
  </span>
</template>

<style scoped>
.action-status {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  position: relative;
}

.action-status__icon {
  line-height: 1;
}

/* Size variants */
.status--small .action-status__icon {
  font-size: 0.875rem;
}

.status--medium .action-status__icon {
  font-size: 1rem;
}

.status--large .action-status__icon {
  font-size: 1.25rem;
}

.action-status__label {
  font-size: var(--md-sys-typescale-body-small-size);
  color: var(--md-sys-color-on-surface-variant);
}

/* Action-specific styling */
.status--notify {
  color: var(--md-sys-color-primary);
}

.status--calendar {
  color: var(--md-sys-color-tertiary);
}

.status--draft {
  color: var(--md-sys-color-secondary);
}

.status--shipment {
  color: var(--md-sys-color-primary);
}

.status--junk {
  color: var(--md-sys-color-error);
}

.status--ignore {
  color: var(--md-sys-color-on-surface-variant);
}

/* Pending indicator */
.action-status__badge {
  position: absolute;
  top: -2px;
  right: -4px;
}

.action-status__badge-dot {
  display: block;
  width: 8px;
  height: 8px;
  background-color: var(--md-sys-color-error);
  border-radius: 50%;
  border: 2px solid var(--md-sys-color-surface);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.1);
  }
}

/* Pending state emphasis */
.status--pending .action-status__icon {
  animation: subtle-bounce 1s ease-in-out infinite;
}

@keyframes subtle-bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-1px);
  }
}
</style>
