<!--
  Date Range Picker Component
  Feature: 003-correction-ui
  Task: T045
  Requirement: FR-006 (filter by date range)

  From/To date picker for filtering classifications by date
-->

<script setup lang="ts">
interface Props {
  dateFrom?: string
  dateTo?: string
  label?: string
}

const props = withDefaults(defineProps<Props>(), {
  dateFrom: '',
  dateTo: '',
  label: 'Date Range',
})

const emit = defineEmits<{
  'update:dateFrom': [value: string]
  'update:dateTo': [value: string]
}>()

function handleFromChange(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:dateFrom', target.value)
}

function handleToChange(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:dateTo', target.value)
}
</script>

<template>
  <div class="date-range-picker">
    <label class="picker-label">{{ label }}</label>

    <div class="date-inputs">
      <div class="date-field">
        <label class="field-label">From:</label>
        <input type="date" :value="dateFrom" @input="handleFromChange" class="date-input" />
      </div>

      <div class="date-field">
        <label class="field-label">To:</label>
        <input type="date" :value="dateTo" @input="handleToChange" class="date-input" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.date-range-picker {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.picker-label {
  font-weight: var(--md-sys-typescale-label-large-weight);
  font-size: var(--md-sys-typescale-label-large-size);
  color: var(--md-sys-color-on-surface);
}

.date-inputs {
  display: flex;
  gap: 1rem;
}

.date-field {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.field-label {
  font-size: var(--md-sys-typescale-label-medium-size);
  color: var(--md-sys-color-on-surface-variant);
}

.date-input {
  padding: 0.6rem;
  border: 1px solid var(--md-sys-color-outline);
  border-radius: var(--md-sys-shape-corner-small);
  font-size: var(--md-sys-typescale-body-medium-size);
  font-family: inherit;
  background-color: var(--md-sys-color-surface);
  color: var(--md-sys-color-on-surface);
  transition: var(--md-sys-theme-transition);
}

.date-input:focus {
  outline: none;
  border-color: var(--md-sys-color-primary);
  box-shadow: 0 0 0 3px var(--md-sys-color-primary-container);
}

@media (max-width: 768px) {
  .date-inputs {
    flex-direction: column;
  }
}
</style>
