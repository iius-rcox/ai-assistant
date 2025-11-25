<!--
  ExpandableRowDetails Component
  Feature: 005-table-enhancements
  Tasks: T037, T038, T039
  Requirements: FR-015, FR-016, FR-017, FR-018

  Shows expanded row content with email preview and correction history
-->

<script setup lang="ts">
import { computed } from 'vue'
import { formatTimestamp } from '@/utils/formatters'
import type { ClassificationWithDetails, CorrectionHistoryEntry } from '@/types/table-enhancements'

interface Props {
  details: ClassificationWithDetails | undefined
  isLoading: boolean
  error?: string
  /** Number of columns to span */
  colspan?: number
  /** Maximum characters for body preview */
  previewLength?: number
}

const props = withDefaults(defineProps<Props>(), {
  colspan: 9,
  previewLength: 500
})

// T038 - Email body preview (truncated to previewLength)
const emailPreview = computed(() => {
  if (!props.details?.email?.body) return null
  const body = props.details.email.body
  if (body.length <= props.previewLength) return body
  return body.substring(0, props.previewLength) + '...'
})

const hasMoreContent = computed(() => {
  if (!props.details?.email?.body) return false
  return props.details.email.body.length > props.previewLength
})

// T039 - Correction history
const correctionHistory = computed(() => props.details?.correctionHistory || [])
const hasCorrectionHistory = computed(() => correctionHistory.value.length > 0)

/**
 * Get badge class for change type
 */
function getChangeClass(changeType: string): string {
  const type = changeType.toLowerCase()
  if (type.includes('category')) return 'change-category'
  if (type.includes('urgency')) return 'change-urgency'
  if (type.includes('action')) return 'change-action'
  return ''
}

/**
 * Format a correction history entry for display
 */
function formatCorrectionEntry(entry: CorrectionHistoryEntry): { changes: string[], source: string } {
  const changes: string[] = []

  if (entry.previousCategory !== entry.newCategory) {
    changes.push(`Category: ${entry.previousCategory} → ${entry.newCategory}`)
  }
  if (entry.previousUrgency !== entry.newUrgency) {
    changes.push(`Urgency: ${entry.previousUrgency} → ${entry.newUrgency}`)
  }
  if (entry.previousAction !== entry.newAction) {
    changes.push(`Action: ${entry.previousAction} → ${entry.newAction}`)
  }

  return {
    changes: changes.length > 0 ? changes : ['No changes recorded'],
    source: entry.source === 'system' ? 'System' : 'User'
  }
}
</script>

<template>
  <tr class="expanded-row">
    <td :colspan="colspan" class="expanded-cell">
      <!-- Loading state -->
      <div v-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <span>Loading details...</span>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="error-state">
        <span class="error-icon">⚠️</span>
        <span>{{ error }}</span>
      </div>

      <!-- Content -->
      <div v-else-if="details" class="details-content">
        <!-- Email Preview Section (T038) -->
        <div class="section email-section">
          <h4 class="section-title">
            <span class="section-icon">📧</span>
            Email Preview
          </h4>

          <div v-if="details.email?.subject" class="email-meta">
            <strong>Subject:</strong> {{ details.email.subject }}
          </div>
          <div v-if="details.email?.sender" class="email-meta">
            <strong>From:</strong> {{ details.email.sender }}
          </div>
          <div v-if="details.email?.receivedAt" class="email-meta">
            <strong>Received:</strong> {{ formatTimestamp(details.email.receivedAt) }}
          </div>

          <div v-if="emailPreview" class="email-body">
            <pre class="body-text">{{ emailPreview }}</pre>
            <p v-if="hasMoreContent" class="more-indicator">
              ... ({{ details.email?.body?.length }} characters total)
            </p>
          </div>
          <p v-else class="no-content">No email body available</p>
        </div>

        <!-- Correction History Section (T039) -->
        <div class="section history-section">
          <h4 class="section-title">
            <span class="section-icon">📝</span>
            Correction History
          </h4>

          <div v-if="hasCorrectionHistory" class="timeline">
            <div
              v-for="(entry, index) in correctionHistory"
              :key="entry.id || index"
              class="timeline-entry"
            >
              <div class="timeline-dot"></div>
              <div class="timeline-content">
                <div class="entry-header">
                  <span class="entry-date">{{ formatTimestamp(entry.correctedAt) }}</span>
                  <span class="entry-source" :class="entry.source">{{ formatCorrectionEntry(entry).source }}</span>
                </div>
                <ul class="entry-changes">
                  <li
                    v-for="(change, changeIndex) in formatCorrectionEntry(entry).changes"
                    :key="changeIndex"
                    class="change-item"
                  >
                    {{ change }}
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <p v-else class="no-content">No corrections have been made</p>
        </div>

        <!-- Classification Info -->
        <div class="section info-section">
          <h4 class="section-title">
            <span class="section-icon">🏷️</span>
            Classification Info
          </h4>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Confidence:</span>
              <span class="info-value">{{ Math.round((details.confidence || 0) * 100) }}%</span>
            </div>
            <div class="info-item">
              <span class="info-label">Version:</span>
              <span class="info-value">{{ details.version || 1 }}</span>
            </div>
            <div v-if="details.createdAt" class="info-item">
              <span class="info-label">Created:</span>
              <span class="info-value">{{ formatTimestamp(details.createdAt) }}</span>
            </div>
            <div v-if="details.updatedAt" class="info-item">
              <span class="info-label">Updated:</span>
              <span class="info-value">{{ formatTimestamp(details.updatedAt) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- No details -->
      <div v-else class="no-details">
        <span>No details available</span>
      </div>
    </td>
  </tr>
</template>

<style scoped>
.expanded-row {
  background-color: #f8f9fa;
}

.expanded-cell {
  padding: 0 !important;
  border-top: 2px solid #3498db;
}

.loading-state,
.error-state,
.no-details {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2rem;
  color: #6c757d;
}

.error-state {
  color: #dc3545;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #e0e0e0;
  border-top-color: #3498db;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.details-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  padding: 1rem;
}

.section {
  background-color: white;
  border-radius: 8px;
  padding: 1rem;
  border: 1px solid #e0e0e0;
}

.email-section {
  grid-column: 1 / 2;
}

.history-section {
  grid-column: 2 / 3;
}

.info-section {
  grid-column: 1 / -1;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 1rem 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #2c3e50;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 0.5rem;
}

.section-icon {
  font-size: 1.1rem;
}

.email-meta {
  font-size: 0.875rem;
  color: #495057;
  margin-bottom: 0.5rem;
}

.email-meta strong {
  color: #2c3e50;
}

.email-body {
  margin-top: 1rem;
  padding: 0.75rem;
  background-color: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.body-text {
  margin: 0;
  font-family: inherit;
  font-size: 0.875rem;
  line-height: 1.5;
  white-space: pre-wrap;
  word-wrap: break-word;
  color: #495057;
}

.more-indicator {
  margin: 0.5rem 0 0 0;
  font-size: 0.75rem;
  color: #6c757d;
  font-style: italic;
}

.no-content {
  color: #6c757d;
  font-style: italic;
  font-size: 0.875rem;
}

/* Timeline styles (T039) */
.timeline {
  position: relative;
  padding-left: 1.5rem;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 0.35rem;
  top: 0;
  bottom: 0;
  width: 2px;
  background-color: #dee2e6;
}

.timeline-entry {
  position: relative;
  margin-bottom: 1rem;
}

.timeline-entry:last-child {
  margin-bottom: 0;
}

.timeline-dot {
  position: absolute;
  left: -1.35rem;
  top: 0.25rem;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #3498db;
  border: 2px solid white;
  box-shadow: 0 0 0 2px #3498db;
}

.timeline-content {
  background-color: #f8f9fa;
  border-radius: 4px;
  padding: 0.75rem;
  font-size: 0.875rem;
}

.entry-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.entry-date {
  font-size: 0.75rem;
  color: #6c757d;
}

.entry-source {
  font-size: 0.7rem;
  padding: 0.15rem 0.4rem;
  border-radius: 10px;
  font-weight: 500;
  text-transform: uppercase;
}

.entry-source.user {
  background-color: #d4edda;
  color: #155724;
}

.entry-source.system {
  background-color: #cce5ff;
  color: #004085;
}

.entry-changes {
  margin: 0;
  padding: 0;
  list-style: none;
}

.change-item {
  font-size: 0.8rem;
  color: #495057;
  padding: 0.15rem 0;
}

.change-item::before {
  content: '→';
  margin-right: 0.5rem;
  color: #6c757d;
}

/* Info grid */
.info-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.info-item {
  display: flex;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.info-label {
  color: #6c757d;
}

.info-value {
  color: #2c3e50;
  font-weight: 500;
}

/* Responsive */
@media (max-width: 768px) {
  .details-content {
    grid-template-columns: 1fr;
  }

  .email-section,
  .history-section,
  .info-section {
    grid-column: 1;
  }

  .info-grid {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>
