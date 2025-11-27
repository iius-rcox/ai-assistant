<!--
  ActionDropdown Component
  Feature: 011-email-actions-v2
  Tasks: T011, T012, T013

  Grouped dropdown for action selection with risk levels and tooltips
  Requirements:
    - FR-002: Display actions grouped by risk level
    - FR-003: Show hover tooltips explaining each action's behavior
    - FR-007: Disable/hide SHIPMENT for emails without tracking info
    - US7 AS5: Destructive styling (red/warning) for JUNK option
-->

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import type { ActionTypeV2 } from '@/types/enums'
import {
  ACTION_V2_LABELS,
  ACTION_DESCRIPTIONS,
  ACTION_ICONS,
  isActionAvailable,
  getActionUnavailabilityReason,
  type ActionAvailabilityContext,
} from '@/types/actions'

interface Props {
  modelValue: ActionTypeV2
  context?: ActionAvailabilityContext
  disabled?: boolean
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  context: () => ({}),
  disabled: false,
  compact: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: ActionTypeV2]
  change: [value: ActionTypeV2]
}>()

const isOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)
const triggerRef = ref<HTMLElement | null>(null)
const menuRef = ref<HTMLElement | null>(null)
const hoveredAction = ref<ActionTypeV2 | null>(null)
const flipUp = ref(false)

// Menu position for fixed positioning (to escape overflow clipping)
const menuPosition = ref({ top: 0, left: 0 })

// Estimated menu height (used before menu is rendered) - reduced for flat list
const ESTIMATED_MENU_HEIGHT = 200

// Close dropdown when clicking outside
function handleClickOutside(event: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// Close on escape key
function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    isOpen.value = false
  }
}

// Selected action display
const selectedLabel = computed(() => ACTION_V2_LABELS[props.modelValue])
const selectedIcon = computed(() => ACTION_ICONS[props.modelValue])

// Flat list of actions with availability check (no grouping)
const flatActions = computed(() => {
  // Define the order: IGNORE first, JUNK last (destructive)
  const actionOrder: ActionTypeV2[] = ['IGNORE', 'SHIPMENT', 'CALENDAR', 'DRAFT_REPLY', 'NOTIFY', 'JUNK']

  return actionOrder.map(action => ({
    value: action,
    label: ACTION_V2_LABELS[action],
    icon: ACTION_ICONS[action],
    description: ACTION_DESCRIPTIONS[action],
    available: isActionAvailable(action, props.context),
    unavailabilityReason: getActionUnavailabilityReason(action, props.context),
    isDestructive: action === 'JUNK',
  }))
})

async function toggleDropdown() {
  if (props.disabled) return

  if (!isOpen.value) {
    // Opening - calculate if we need to flip
    await calculateFlipDirection()
  }

  isOpen.value = !isOpen.value
}

/**
 * Calculate menu position and whether to flip upward based on available space.
 * Uses fixed positioning to escape overflow clipping from parent containers.
 */
async function calculateFlipDirection() {
  if (!triggerRef.value) return

  const triggerRect = triggerRef.value.getBoundingClientRect()
  const viewportHeight = window.innerHeight
  const spaceBelow = viewportHeight - triggerRect.bottom
  const spaceAbove = triggerRect.top

  // Use estimated height initially, then actual height after render
  let menuHeight = ESTIMATED_MENU_HEIGHT

  // If menu exists, use actual height
  if (menuRef.value) {
    menuHeight = menuRef.value.offsetHeight
  }

  // Flip up if not enough space below AND more space above
  flipUp.value = spaceBelow < menuHeight && spaceAbove > spaceBelow

  // Calculate fixed position based on trigger's viewport coordinates
  if (flipUp.value) {
    // Position above the trigger
    menuPosition.value = {
      top: triggerRect.top - 4, // 4px gap
      left: triggerRect.left,
    }
  } else {
    // Position below the trigger
    menuPosition.value = {
      top: triggerRect.bottom + 4, // 4px gap
      left: triggerRect.left,
    }
  }
}

function selectAction(action: ActionTypeV2) {
  if (isActionAvailable(action, props.context)) {
    emit('update:modelValue', action)
    emit('change', action)
    isOpen.value = false
  }
}

function handleMouseEnter(action: ActionTypeV2) {
  hoveredAction.value = action
}

function handleMouseLeave() {
  hoveredAction.value = null
}

// Determine if current selection is the JUNK action (for destructive styling)
const isCurrentDestructive = computed(() => props.modelValue === 'JUNK')

// Get the CSS class for the current action
const actionClass = computed(() => `action-dropdown__trigger--${props.modelValue.toLowerCase()}`)

// Computed style for fixed positioning menu
const menuStyle = computed(() => {
  if (flipUp.value) {
    return {
      position: 'fixed' as const,
      top: 'auto',
      bottom: `${window.innerHeight - menuPosition.value.top}px`,
      left: `${menuPosition.value.left}px`,
    }
  }
  return {
    position: 'fixed' as const,
    top: `${menuPosition.value.top}px`,
    left: `${menuPosition.value.left}px`,
  }
})
</script>

<template>
  <div
    ref="dropdownRef"
    class="action-dropdown"
    :class="{
      'action-dropdown--compact': compact,
      'action-dropdown--open': isOpen,
      'action-dropdown--flip-up': flipUp
    }"
    @keydown="handleKeydown"
  >
    <button
      ref="triggerRef"
      type="button"
      class="action-dropdown__trigger"
      :class="[
        actionClass,
        {
          'action-dropdown__trigger--disabled': disabled,
        }
      ]"
      :disabled="disabled"
      @click="toggleDropdown"
      :aria-expanded="isOpen"
      aria-haspopup="listbox"
    >
      <span class="action-dropdown__label">{{ selectedLabel }}</span>
    </button>

    <Transition :name="flipUp ? 'dropdown-up' : 'dropdown'">
      <div
        v-if="isOpen"
        ref="menuRef"
        class="action-dropdown__menu"
        :style="menuStyle"
        role="listbox"
      >
        <button
          v-for="action in flatActions"
          :key="action.value"
          type="button"
          class="action-dropdown__option"
          :class="{
            'action-dropdown__option--selected': action.value === modelValue,
            'action-dropdown__option--disabled': !action.available,
            'action-dropdown__option--destructive': action.isDestructive,
            'action-dropdown__option--hovered': hoveredAction === action.value,
          }"
          :disabled="!action.available"
          role="option"
          :aria-selected="action.value === modelValue"
          @click="selectAction(action.value)"
          @mouseenter="handleMouseEnter(action.value)"
          @mouseleave="handleMouseLeave"
        >
          <span v-if="action.icon" class="action-dropdown__option-icon">{{ action.icon }}</span>
          <span class="action-dropdown__option-content">
            <span class="action-dropdown__option-label">{{ action.label }}</span>
            <span v-if="hoveredAction === action.value" class="action-dropdown__option-description">
              {{ action.available ? action.description : action.unavailabilityReason }}
            </span>
          </span>
          <span v-if="action.value === modelValue" class="action-dropdown__check">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11.667 3.5L5.25 9.917L2.333 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.action-dropdown {
  position: relative;
  display: inline-block;
}

.action-dropdown__trigger {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 1.25rem 0.25rem 0.5rem;
  border: none;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s ease;
  color: white;
  min-width: auto;

  /* Custom dropdown arrow */
  background-repeat: no-repeat;
  background-position: right 0.35rem center;
  background-size: 0.6rem;
}

/* Action-specific colors */
.action-dropdown__trigger--ignore {
  background-color: var(--md-ext-color-action-ignore, #78909c);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='white' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
}

.action-dropdown__trigger--shipment {
  background-color: var(--md-ext-color-action-shipment, #8d6e63);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='white' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
}

.action-dropdown__trigger--draft_reply {
  background-color: var(--md-ext-color-action-draft-reply, #5c6bc0);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='white' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
}

.action-dropdown__trigger--junk {
  background-color: var(--md-sys-color-error, #dc2626);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='white' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
}

.action-dropdown__trigger--notify {
  background-color: var(--md-ext-color-action-notify, #f59e0b);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='white' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
}

.action-dropdown__trigger--calendar {
  background-color: var(--md-ext-color-action-calendar, #10b981);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='white' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
}

.action-dropdown--compact .action-dropdown__trigger {
  padding: 0.2rem 1.1rem 0.2rem 0.4rem;
  font-size: 0.7rem;
}

.action-dropdown__trigger:hover:not(:disabled) {
  opacity: 0.9;
  transform: scale(1.02);
}

.action-dropdown__trigger:focus {
  outline: 2px solid var(--md-sys-color-primary);
  outline-offset: 2px;
}

.action-dropdown__trigger--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-dropdown__icon {
  font-size: 0.875rem;
  line-height: 1;
}

.action-dropdown--compact .action-dropdown__icon {
  font-size: 0.75rem;
}

.action-dropdown__label {
  line-height: 1;
}

.action-dropdown__chevron {
  display: none; /* Hidden since we use background-image arrow */
}

.action-dropdown__menu {
  /* Position is set via inline style (fixed positioning to escape overflow clipping) */
  z-index: 1000;
  min-width: 120px;
  width: max-content;
  max-width: 280px;
  padding: 0.25rem 0;
  background-color: var(--md-sys-color-surface-container);
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: var(--md-sys-shape-corner-medium);
  box-shadow: var(--md-sys-elevation-level2);
  overflow: hidden;
}

.action-dropdown__option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.375rem 0.625rem;
  border: none;
  background: transparent;
  color: var(--md-sys-color-on-surface);
  font-size: var(--md-sys-typescale-body-medium-size);
  text-align: left;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.action-dropdown__option:hover:not(:disabled) {
  background-color: var(--md-sys-color-surface-container-high);
}

.action-dropdown__option--selected {
  background-color: var(--md-sys-color-primary-container);
  color: var(--md-sys-color-on-primary-container);
}

.action-dropdown__option--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-dropdown__option--destructive {
  color: var(--md-sys-color-error);
}

.action-dropdown__option--destructive:hover:not(:disabled) {
  background-color: var(--md-sys-color-error-container);
}

.action-dropdown__option-icon {
  font-size: 1rem;
  line-height: 1.4;
}

.action-dropdown__option-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.action-dropdown__option-label {
  font-weight: 500;
}

.action-dropdown__option-description {
  font-size: var(--md-sys-typescale-body-small-size);
  color: var(--md-sys-color-on-surface-variant);
  line-height: 1.3;
}

.action-dropdown__option--disabled .action-dropdown__option-description {
  color: var(--md-sys-color-error);
  font-style: italic;
}

.action-dropdown__check {
  display: flex;
  align-items: center;
  color: var(--md-sys-color-primary);
}

/* Dropdown animation (opening downward) */
.dropdown-enter-active,
.dropdown-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* Dropdown animation (opening upward) */
.dropdown-up-enter-active,
.dropdown-up-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}

.dropdown-up-enter-from,
.dropdown-up-leave-to {
  opacity: 0;
  transform: translateY(4px);
}
</style>
