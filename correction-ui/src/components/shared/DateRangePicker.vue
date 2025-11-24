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
  label: 'Date Range'
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
        <input
          type="date"
          :value="dateFrom"
          @input="handleFromChange"
          class="date-input"
        />
      </div>

      <div class="date-field">
        <label class="field-label">To:</label>
        <input
          type="date"
          :value="dateTo"
          @input="handleToChange"
          class="date-input"
        />
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
  font-weight: 600;
  font-size: 0.9rem;
  color: #2c3e50;
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
  font-size: 0.85rem;
  color: #555;
}

.date-input {
  padding: 0.6rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
  font-family: inherit;
}

.date-input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

@media (max-width: 768px) {
  .date-inputs {
    flex-direction: column;
  }
}
</style>
