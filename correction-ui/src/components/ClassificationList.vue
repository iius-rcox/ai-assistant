<!--
  Classification List Component
  Feature: 003-correction-ui
  Tasks: T026-T030, T041-T042
  Requirements: FR-001, FR-012, FR-015, FR-016, FR-017, FR-021

  Displays paginated list of classifications with sorting and navigation
-->

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useClassificationStore } from '@/stores/classificationStore'
import CorrectionBadge from './shared/CorrectionBadge.vue'
import { formatTimestamp, formatConfidence } from '@/utils/formatters'
import { handleSupabaseError } from '@/utils/errorHandler'
import { logAction } from '@/utils/logger'

const router = useRouter()
const store = useClassificationStore()

const pageSizeOptions = [20, 50, 100]
const retryCount = ref(0)

// Fetch on mount
onMounted(() => {
  store.fetchClassifications()
  logAction('Classification list mounted')
})

// Click handler - navigate to detail
function handleRowClick(id: number) {
  logAction('Classification clicked', { id })
  router.push({ name: 'classification-detail', params: { id: id.toString() } })
}

// Sort handler
function handleSort(column: string) {
  const newDir = store.sortBy === column && store.sortDir === 'asc' ? 'desc' : 'asc'
  logAction('Sort changed', { column, direction: newDir })
  store.setSorting(column, newDir)
}

// Page size change
function handlePageSizeChange(event: Event) {
  const target = event.target as HTMLSelectElement
  const size = parseInt(target.value)
  logAction('Page size changed', { pageSize: size })
  store.setPageSize(size)
}

// Retry on error
async function handleRetry() {
  retryCount.value++
  logAction('Retry clicked', { attempt: retryCount.value })
  await store.fetchClassifications()
}

// Get user-friendly error message (reactive)
const errorMessage = computed(() => {
  return store.error ? handleSupabaseError(store.error) : ''
})
</script>

<template>
  <div class="classification-list">
    <div class="list-header">
      <h2>Email Classifications</h2>
      <div class="list-controls">
        <label class="page-size-control">
          Show:
          <select
            :value="store.pageSize"
            @change="handlePageSizeChange"
            class="page-size-select"
          >
            <option v-for="size in pageSizeOptions" :key="size" :value="size">
              {{ size }} per page
            </option>
          </select>
        </label>
      </div>
    </div>

    <!-- Error display (T041) -->
    <div v-if="store.error" class="error-banner">
      <p class="error-text">{{ errorMessage }}</p>
      <button @click="handleRetry" class="btn-retry">
        Retry
      </button>
    </div>

    <!-- Classification table (T026) - Always visible -->
    <div class="table-container">
      <table class="classification-table">
        <thead>
          <tr>
            <!-- Sortable headers (T028) -->
            <th @click="handleSort('subject')" class="sortable">
              Subject
              <span class="sort-indicator" v-if="store.sortBy === 'subject'">
                {{ store.sortDir === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th @click="handleSort('sender')" class="sortable">
              Sender
              <span class="sort-indicator" v-if="store.sortBy === 'sender'">
                {{ store.sortDir === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th @click="handleSort('category')" class="sortable">
              Category
              <span class="sort-indicator" v-if="store.sortBy === 'category'">
                {{ store.sortDir === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th @click="handleSort('urgency')" class="sortable">
              Urgency
              <span class="sort-indicator" v-if="store.sortBy === 'urgency'">
                {{ store.sortDir === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th @click="handleSort('action')" class="sortable">
              Action
              <span class="sort-indicator" v-if="store.sortBy === 'action'">
                {{ store.sortDir === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th @click="handleSort('confidence_score')" class="sortable">
              Confidence
              <span class="sort-indicator" v-if="store.sortBy === 'confidence_score'">
                {{ store.sortDir === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th @click="handleSort('classified_timestamp')" class="sortable">
              Classified
              <span class="sort-indicator" v-if="store.sortBy === 'classified_timestamp'">
                {{ store.sortDir === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <!-- Loading overlay for smooth updates -->
          <tr v-if="store.isLoading" class="loading-overlay-row">
            <td colspan="8" class="loading-overlay-cell">
              <div class="loading-overlay">
                <div class="mini-spinner"></div>
                <span>Updating...</span>
              </div>
            </td>
          </tr>

          <!-- Empty state -->
          <tr v-else-if="store.classifications.length === 0" class="empty-row">
            <td colspan="8" class="empty-cell">
              <p>No classifications found matching your criteria.</p>
            </td>
          </tr>

          <!-- Data rows with smooth opacity transition -->
          <tr
            v-else
            v-for="classification in store.classifications"
            :key="classification.id"
            @click="handleRowClick(classification.id)"
            class="table-row clickable"
          >
            <td class="subject-cell">{{ classification.email.subject || 'N/A' }}</td>
            <td>{{ classification.email.sender || 'N/A' }}</td>
            <td>
              <span class="badge" :class="`badge-${classification.category.toLowerCase()}`">
                {{ classification.category }}
              </span>
            </td>
            <td>
              <span class="badge" :class="`badge-urgency-${classification.urgency.toLowerCase()}`">
                {{ classification.urgency }}
              </span>
            </td>
            <td>{{ classification.action }}</td>
            <td>{{ formatConfidence(classification.confidence_score) }}</td>
            <td>{{ formatTimestamp(classification.classified_timestamp) }}</td>
            <td>
              <!-- Correction badge (T030) -->
              <CorrectionBadge
                :correctedTimestamp="classification.corrected_timestamp"
                :correctedBy="classification.corrected_by"
                variant="small"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination controls (T027) -->
    <div v-if="!store.isLoading && store.totalCount > 0" class="pagination">
      <div class="pagination-info">
        Showing {{ (store.currentPage - 1) * store.pageSize + 1 }}-{{
          Math.min(store.currentPage * store.pageSize, store.totalCount)
        }} of {{ store.totalCount }}
      </div>

      <div class="pagination-controls">
        <button
          @click="store.setPage(store.currentPage - 1)"
          :disabled="store.currentPage === 1"
          class="btn-pagination"
        >
          Previous
        </button>

        <span class="page-indicator">
          Page {{ store.currentPage }} of {{ store.pageCount }}
        </span>

        <button
          @click="store.setPage(store.currentPage + 1)"
          :disabled="store.currentPage >= store.pageCount"
          class="btn-pagination"
        >
          Next
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.classification-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.list-header h2 {
  margin: 0;
  color: #2c3e50;
}

.list-controls {
  display: flex;
  gap: 1rem;
}

.page-size-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.page-size-select {
  padding: 0.4rem 0.6rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

/* Error banner */
.error-banner {
  background-color: #fee;
  border: 1px solid #e74c3c;
  border-radius: 4px;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.error-text {
  margin: 0;
  color: #c0392b;
}

.btn-retry {
  padding: 0.5rem 1rem;
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-retry:hover {
  background-color: #c0392b;
}

/* Smooth loading overlay */
.table-container.loading {
  position: relative;
}

.table-container.loading::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.5);
  pointer-events: none;
  transition: opacity 0.2s;
}

.classification-table tbody {
  transition: opacity 0.2s ease-in-out;
}

.classification-table tbody.loading {
  opacity: 0.5;
}

.loading-overlay-row {
  background-color: #f8f9fa !important;
}

.loading-overlay-cell {
  padding: 2rem !important;
  text-align: center;
}

.loading-overlay {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  color: #3498db;
  font-weight: 500;
}

.mini-spinner {
  border: 3px solid #e3e3e3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Empty state */
.empty-row {
  background-color: #f8f9fa;
}

.empty-cell {
  text-align: center;
  padding: 3rem !important;
  color: #95a5a6;
}

.empty-cell p {
  margin: 0;
}

/* Smooth fade transitions */
.fade-enter-active {
  transition: opacity 0.15s ease-in;
}

.fade-leave-active {
  transition: opacity 0.1s ease-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-move {
  transition: transform 0.2s ease;
}

/* Table */
.table-container {
  overflow-x: auto;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  width: 100%;
}

.classification-table {
  width: 100%;
  border-collapse: collapse;
  background-color: white;
  table-layout: fixed;
}

.classification-table thead {
  background-color: #f8f9fa;
  border-bottom: 2px solid #dee2e6;
}

.classification-table th {
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.9rem;
  white-space: nowrap;
}

.classification-table th.sortable {
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s;
}

.classification-table th.sortable:hover {
  background-color: #e9ecef;
}

.sort-indicator {
  margin-left: 0.5rem;
  color: #3498db;
}

.classification-table td {
  padding: 0.8rem 1rem;
  border-top: 1px solid #e0e0e0;
  font-size: 0.9rem;
}

.table-row.clickable {
  cursor: pointer;
  transition: background-color 0.2s;
}

.table-row.clickable:hover {
  background-color: #f8f9fa;
}

.subject-cell {
  font-weight: 500;
  color: #2c3e50;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Maximize space usage - proportional widths */
.classification-table th:nth-child(1),
.classification-table td:nth-child(1) {
  width: 35%;
}

.classification-table th:nth-child(2),
.classification-table td:nth-child(2) {
  width: 25%;
}

.classification-table th:nth-child(3),
.classification-table td:nth-child(3) {
  width: 10%;
}

.classification-table th:nth-child(4),
.classification-table td:nth-child(4) {
  width: 8%;
}

.classification-table th:nth-child(5),
.classification-table td:nth-child(5) {
  width: 8%;
}

.classification-table th:nth-child(6),
.classification-table td:nth-child(6) {
  width: 7%;
}

.classification-table th:nth-child(7),
.classification-table td:nth-child(7) {
  width: 12%;
}

.classification-table th:nth-child(8),
.classification-table td:nth-child(8) {
  width: 5%;
  text-align: center;
}

/* Badges */
.badge {
  display: inline-block;
  padding: 0.25rem 0.6rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
}

.badge-kids { background-color: #9b59b6; color: white; }
.badge-robyn { background-color: #e91e63; color: white; }
.badge-work { background-color: #3498db; color: white; }
.badge-financial { background-color: #27ae60; color: white; }
.badge-shopping { background-color: #f39c12; color: white; }
.badge-other { background-color: #95a5a6; color: white; }

.badge-urgency-high { background-color: #e74c3c; color: white; }
.badge-urgency-medium { background-color: #f39c12; color: white; }
.badge-urgency-low { background-color: #95a5a6; color: white; }

/* Pagination */
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  margin-top: 1rem;
}

.pagination-info {
  font-size: 0.9rem;
  color: #555;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.btn-pagination {
  padding: 0.5rem 1rem;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.btn-pagination:hover:not(:disabled) {
  background-color: #2980b9;
}

.btn-pagination:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
  opacity: 0.6;
}

.page-indicator {
  font-size: 0.9rem;
  color: #555;
  padding: 0 0.5rem;
}

@media (max-width: 768px) {
  .list-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .table-container {
    font-size: 0.85rem;
  }

  .pagination {
    flex-direction: column;
    gap: 1rem;
  }
}
</style>
