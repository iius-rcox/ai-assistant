<!--
  ActionTooltip Component
  Feature: 011-email-actions-v2
  Task: T010

  Tooltip for displaying action descriptions
  Requirement: FR-003 (show hover tooltips explaining each action's behavior)
-->

<script setup lang="ts">
import { computed } from 'vue'
import type { ActionTypeV2 } from '@/types/enums'
import { ACTION_DESCRIPTIONS, ACTION_ICONS } from '@/types/actions'

interface Props {
  action: ActionTypeV2
  position?: 'top' | 'bottom' | 'left' | 'right'
  visible?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  position: 'top',
  visible: false,
})

const description = computed(() => ACTION_DESCRIPTIONS[props.action])
const icon = computed(() => ACTION_ICONS[props.action])

const positionClasses = computed(() => ({
  'tooltip--top': props.position === 'top',
  'tooltip--bottom': props.position === 'bottom',
  'tooltip--left': props.position === 'left',
  'tooltip--right': props.position === 'right',
}))
</script>

<template>
  <div class="action-tooltip" :class="[positionClasses, { 'tooltip--visible': visible }]">
    <span v-if="icon" class="tooltip-icon">{{ icon }}</span>
    <span class="tooltip-text">{{ description }}</span>
  </div>
</template>

<style scoped>
.action-tooltip {
  position: absolute;
  z-index: 1000;
  padding: 0.5rem 0.75rem;
  background-color: var(--md-sys-color-inverse-surface);
  color: var(--md-sys-color-inverse-on-surface);
  border-radius: var(--md-sys-shape-corner-small);
  font-size: var(--md-sys-typescale-body-small-size);
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition:
    opacity 0.2s ease,
    visibility 0.2s ease;
  pointer-events: none;
  box-shadow: var(--md-sys-elevation-level2);
  max-width: 280px;
  white-space: normal;
  text-align: left;
}

.tooltip--visible {
  opacity: 1;
  visibility: visible;
}

.tooltip-icon {
  margin-right: 0.375rem;
}

.tooltip-text {
  line-height: 1.4;
}

/* Position variants */
.tooltip--top {
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
}

.tooltip--top::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-top-color: var(--md-sys-color-inverse-surface);
}

.tooltip--bottom {
  top: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
}

.tooltip--bottom::after {
  content: '';
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-bottom-color: var(--md-sys-color-inverse-surface);
}

.tooltip--left {
  right: calc(100% + 8px);
  top: 50%;
  transform: translateY(-50%);
}

.tooltip--left::after {
  content: '';
  position: absolute;
  left: 100%;
  top: 50%;
  transform: translateY(-50%);
  border: 6px solid transparent;
  border-left-color: var(--md-sys-color-inverse-surface);
}

.tooltip--right {
  left: calc(100% + 8px);
  top: 50%;
  transform: translateY(-50%);
}

.tooltip--right::after {
  content: '';
  position: absolute;
  right: 100%;
  top: 50%;
  transform: translateY(-50%);
  border: 6px solid transparent;
  border-right-color: var(--md-sys-color-inverse-surface);
}
</style>
