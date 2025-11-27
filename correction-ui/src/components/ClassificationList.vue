<!--
  Classification List Component
  Feature: 006-material-design-themes, 007-instant-edit-undo, 008-column-search-filters, 010-shadcn-blue-theme
  Tasks: T012 (006), T015-T019 (007), T015-T024 (008), T026-T027 (010)

  Displays paginated list of classifications with inline editing support
  Updated with M3 surface-container hierarchy and shadcn pagination

  007-instant-edit-undo:
  - T015: Handle 'instant-save' event from InlineEditCell
  - T016: Wire handleInstantSave() to useInlineEdit.instantSave()
  - T017: Remove Save button for instant-save enabled rows
  - T018: Remove confirmation dialog trigger
  - T019: Verify instant save works with optimistic locking

  008-column-search-filters:
  - T015-T019: Add column search filter row with ColumnSearchInput components
  - T020-T024: Multi-column filtering with AND logic

  010-shadcn-blue-theme:
  - T026: Replace inline pagination with new Pagination component
  - T027: Add "Showing X-Y of Z" info display
-->

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useClassificationStore } from '@/stores/classificationStore'
import { useInlineEdit } from '@/composables/useInlineEdit'
import { useUndo } from '@/composables/useUndo'
import { useToast } from '@/composables/useToast'
import { useGridNavigation } from '@/composables/useGridNavigation'
import { useAutoSave } from '@/composables/useAutoSave'
import { useUnsavedChangesGuard } from '@/composables/useUnsavedChangesGuard'
import { usePendingQueue } from '@/composables/usePendingQueue'
import { useSearch } from '@/composables/useSearch'
import { useSort } from '@/composables/useSort'
import { useColumnFilters } from '@/composables/useColumnFilters'
import { useBulkActions } from '@/composables/useBulkActions'
import { useExpandableRows } from '@/composables/useExpandableRows'
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts'
import CorrectionBadge from './shared/CorrectionBadge.vue'
import KeyboardShortcutsModal from './KeyboardShortcutsModal.vue'
import ConfidenceBar from './ConfidenceBar.vue'
import ConflictResolutionDialog from './ConflictResolutionDialog.vue'
import MobileEditModal from './MobileEditModal.vue'
import SearchInput from './SearchInput.vue'
import ColumnSearchInput from './ColumnSearchInput.vue'
import BulkActionToolbar from './BulkActionToolbar.vue'
import ExpandableRowDetails from './ExpandableRowDetails.vue'
import MobileColumnFilters from './MobileColumnFilters.vue'
// Feature: 011-email-actions-v2 - Action dropdown
import ActionDropdown from './ActionDropdown.vue'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from '@/components/ui/pagination'
import { usePagination } from '@/composables/usePagination'
import type { InlineEditData, ConflictData } from '@/types/inline-edit'
import type { ActionTypeV2 } from '@/types/enums'
import { ACTION_TYPES_V2 } from '@/types/enums'
import { migrateAction, type ActionAvailabilityContext } from '@/types/actions'
import { useMediaQuery, useDebounceFn } from '@vueuse/core'
import { formatTimestamp, formatConfidence } from '@/utils/formatters'
import { handleSupabaseError } from '@/utils/errorHandler'
import { logAction, logInfo } from '@/utils/logger'

// Feature flag for Email Actions V2 (011-email-actions-v2)
// Set to true once database migration is complete
const USE_ACTION_V2 = true

const router = useRouter()
const store = useClassificationStore()

// Pagination composable (Feature: 010-shadcn-blue-theme, Tasks: T026-T027)
const currentPageRef = computed({
  get: () => store.currentPage,
  set: (value: number) => store.setPage(value),
})

const { items: paginationItems } = usePagination(
  currentPageRef,
  computed(() => store.pageCount),
  {
    siblingCount: 1,
    showEdges: true,
    onChange: (page: number) => {
      logAction('Page changed via pagination', { page })
    },
  }
)

// Pagination info computed (T027: "Showing X-Y of Z")
const paginationInfo = computed(() => {
  if (store.totalCount === 0) return null
  const start = (store.currentPage - 1) * store.pageSize + 1
  const end = Math.min(store.currentPage * store.pageSize, store.totalCount)
  return { start, end, total: store.totalCount }
})

// Search composable (Feature: 005-table-enhancements, Task: T016)
const {
  query: searchQuery,
  isLoading: isSearching,
  resultCount: searchResultCount,
  hasQuery: hasSearchQuery,
  filteredClassifications,
  setQuery: setSearchQuery,
  clearSearch,
  highlight: highlightText,
} = useSearch({
  onSearchComplete: resultIds => {
    logAction('Search completed', { resultCount: resultIds.length })
  },
  onSearchError: error => {
    showError(`Search failed: ${error.message}`)
  },
})

// Sort composable with localStorage persistence (Feature: 005-table-enhancements, Tasks: T017, T022, T023)
const { sortColumn, sortDirection, toggleSort, getSortIndicator } = useSort({
  persist: true, // T023 - persist across page refresh
  onSortChange: state => {
    logAction('Sort changed (persisted)', { column: state.column, direction: state.direction })
  },
})

// Column filters composable (Feature: 008-column-search-filters, Tasks: T016-T024)
const {
  filters: columnFilters,
  activeFilterCount: columnFilterCount,
  hasActiveFilters: hasColumnFilters,
  setFilter: setColumnFilterLocal,
  clearFilter: clearColumnFilterLocal,
  clearAllFilters: clearAllColumnFiltersLocal,
  applyFilters: applyColumnFilters,
  isColumnFiltered,
} = useColumnFilters({
  onFilterChange: filters => {
    logAction('Column filters changed', { activeCount: columnFilterCount.value })
  },
  onFiltersCleared: () => {
    logAction('All column filters cleared')
  },
})

// Minimum characters required before applying column filter
const MIN_FILTER_CHARS = 3

// Helper to check if filter value meets minimum length requirement
function meetsMinLength(value: string | undefined): string | undefined {
  return value && value.length >= MIN_FILTER_CHARS ? value : undefined
}

// Computed: true if any column filter meets the minimum character threshold
const hasActiveServerFilters = computed(() => {
  return !!(
    meetsMinLength(columnFilters.value.subject) ||
    meetsMinLength(columnFilters.value.sender) ||
    meetsMinLength(columnFilters.value.category) ||
    meetsMinLength(columnFilters.value.urgency) ||
    meetsMinLength(columnFilters.value.action)
  )
})

// Computed: true if subject or sender filters are active (client-side only)
const hasClientSideFilters = computed(() => {
  return !!(
    meetsMinLength(columnFilters.value.subject) ||
    meetsMinLength(columnFilters.value.sender)
  )
})

// Debounced function to apply column filters to server-side query
// Note: subject/sender require fetching all records then filtering (PostgREST limitation)
const applyColumnFiltersToServer = useDebounceFn(() => {
  // Merge column filters with existing sidebar filters
  const currentFilters = { ...store.filters }

  // All column filters go to server - subject/sender will trigger full fetch + client-side filter
  currentFilters.subjectSearch = meetsMinLength(columnFilters.value.subject)
  currentFilters.senderSearch = meetsMinLength(columnFilters.value.sender)
  currentFilters.categorySearch = meetsMinLength(columnFilters.value.category)
  currentFilters.urgencySearch = meetsMinLength(columnFilters.value.urgency)
  currentFilters.actionSearch = meetsMinLength(columnFilters.value.action)

  // Clean up undefined values
  if (!currentFilters.subjectSearch) delete currentFilters.subjectSearch
  if (!currentFilters.senderSearch) delete currentFilters.senderSearch
  if (!currentFilters.categorySearch) delete currentFilters.categorySearch
  if (!currentFilters.urgencySearch) delete currentFilters.urgencySearch
  if (!currentFilters.actionSearch) delete currentFilters.actionSearch

  store.setFilters(currentFilters)
}, 300)

// Wrapper functions that trigger server-side refetch
function setColumnFilter(column: 'subject' | 'sender' | 'category' | 'urgency' | 'action', value: string) {
  setColumnFilterLocal(column, value)
  applyColumnFiltersToServer()
}

function clearAllColumnFilters() {
  clearAllColumnFiltersLocal()
  applyColumnFiltersToServer()
}

// Bulk actions composable (Feature: 005-table-enhancements, Tasks: T031-T033)
const {
  selectedIds: bulkSelectedIds,
  selectedCount: bulkSelectedCount,
  isAllSelected: bulkIsAllSelected,
  isIndeterminate: bulkIsIndeterminate,
  hasSelection: bulkHasSelection,
  isProcessing: bulkIsProcessing,
  toggleSelection: bulkToggleSelection,
  toggleSelectAll: bulkToggleSelectAll,
  clearSelection: bulkClearSelection,
  isSelected: bulkIsSelected,
  executeBulkAction,
} = useBulkActions({
  onSelectionChange: ids => {
    logAction('Bulk selection changed', { count: ids.length })
  },
  onActionComplete: result => {
    if (result.failed.length === 0) {
      showSuccess(`Updated ${result.success.length} items successfully`)
    } else {
      showError(`Updated ${result.success.length} items, ${result.failed.length} failed`)
    }
  },
})

// Expandable rows composable (Feature: 005-table-enhancements, Tasks: T034-T040)
const {
  isExpanded: rowIsExpanded,
  isLoading: rowIsLoading,
  getDetails: getRowDetails,
  getError: getRowError,
  toggleExpand: toggleRowExpand,
} = useExpandableRows({
  singleExpand: true,
  onExpand: (id, details) => {
    logAction('Row expanded', { id, hasHistory: (details.correctionHistory?.length ?? 0) > 0 })
  },
  onCollapse: id => {
    logAction('Row collapsed', { id })
  },
  onError: (id, error) => {
    showError(`Failed to load details: ${error.message}`)
  },
})

// Keyboard shortcuts composable (Feature: 005-table-enhancements, 007-instant-edit-undo, Tasks: T041-T047, T038-T042)
// Reference to search input for focus
const searchInputRef = ref<InstanceType<typeof SearchInput> | null>(null)

const { isHelpModalOpen: isKeyboardHelpOpen, closeHelpModal: closeKeyboardHelp } =
  useKeyboardShortcuts({
    onFocusSearch: () => {
      // Focus the search input when "/" is pressed
      const searchInput = document.querySelector('.search-input input') as HTMLInputElement
      searchInput?.focus()
    },
    onToggleExpand: () => {
      // Expand/collapse the focused row
      const classifications = hasSearchQuery.value
        ? filteredClassifications.value
        : store.classifications
      if (
        classifications.length > 0 &&
        focusedRow.value >= 0 &&
        focusedRow.value < classifications.length
      ) {
        const classification = classifications[focusedRow.value]
        if (classification) {
          toggleRowExpand(classification.id)
        }
      }
    },
    onSave: () => {
      // Save current edit if there's one in progress
      if (editingRowId.value !== null && canSave.value) {
        handleSaveRow(editingRowId.value)
      }
    },
    // T038-T040: Ctrl/Cmd+Z to undo last change
    onUndo: async () => {
      if (canUndo.value) {
        const result = await executeUndo()
        if (result.success) {
          toast.success('Change undone')
          // Refresh to show restored value
          await store.refreshClassifications()
        } else {
          toast.error(result.error || 'Failed to undo')
        }
      }
    },
  })

// Inline edit composable (T016)
const {
  editingRowId,
  currentData,
  originalVersion,
  saveStatus,
  saveError,
  isDirty,
  canSave,
  conflictData,
  hasConflict,
  startEditing,
  updateField,
  saveEdit,
  instantSave, // T009: New instant save method
  cancelEdit,
  forceOverwrite,
  acceptServerVersion,
} = useInlineEdit()

// Undo composable (007-instant-edit-undo, T025)
const {
  canUndo,
  undoDescription: _undoDescription, // Available for future UI display
  recordChange,
  executeUndo,
  clearUndo: _clearUndo, // Available for future manual clear
} = useUndo()

// Toast composable for instant save feedback
const toast = useToast()

// Auto-save composable for localStorage backup (T060, T065)
const { saveToStorage, clearSavedState, hasSavedState, getSavedState, watchAndSave } = useAutoSave({
  onRecover: state => {
    logInfo('Recovered auto-saved state', { rowId: state.rowId })
    showSuccess('Draft recovered from previous session')
  },
})

// Pending queue for offline saves (T061, T063, T064)
const {
  isOnline,
  isProcessing: isPendingProcessing,
  queueSize,
  hasQueuedOperations,
  enqueue: enqueuePendingSave,
  processQueue,
} = usePendingQueue({
  saveOperation: async (rowId, data, version) => {
    // Re-attempt save through the inline edit flow
    startEditing(rowId)
    Object.entries(data).forEach(([key, value]) => {
      updateField(key as keyof InlineEditData, value)
    })
    const result = await saveEdit()
    return result.success
  },
  onSuccess: op => {
    showSuccess(`Pending save for row ${op.rowId} completed`)
    logAction('Pending operation succeeded', { id: op.id, rowId: op.rowId })
  },
  onFailed: op => {
    showError(`Failed to save pending changes for row ${op.rowId}`)
    logAction('Pending operation failed', { id: op.id, rowId: op.rowId })
  },
})

// Unsaved changes guard (T067, T068, T069)
const { disableGuard, enableGuard } = useUnsavedChangesGuard({
  hasChanges: () => isDirty.value,
  message: 'You have unsaved changes. Are you sure you want to leave?',
  onConfirmLeave: () => {
    // Save to localStorage before leaving
    if (editingRowId.value && currentData.value) {
      saveToStorage(editingRowId.value, currentData.value, originalVersion.value ?? undefined)
    }
  },
})

// Watch for edit changes and auto-save to localStorage (T060)
watchAndSave(
  () => editingRowId.value,
  () => currentData.value,
  () => originalVersion.value
)

// Conflict dialog state (T056)
const isConflictDialogOpen = computed(() => hasConflict.value && conflictData.value !== null)

// Responsive breakpoint detection (T076)
const isMobile = useMediaQuery('(max-width: 768px)')

// Mobile edit modal state (T077)
const mobileEditClassification = ref<any>(null)
const isMobileModalOpen = computed(
  () => isMobile.value && editingRowId.value !== null && mobileEditClassification.value !== null
)

// Mobile column filters modal state (T034)
const isMobileFiltersOpen = ref(false)

function openMobileFilters() {
  isMobileFiltersOpen.value = true
  logAction('Mobile column filters opened')
}

function closeMobileFilters() {
  isMobileFiltersOpen.value = false
  logAction('Mobile column filters closed')
}

// Grid navigation for keyboard accessibility (T034-T044)
const {
  focusedRow,
  focusedCol,
  handleKeydown: handleGridKeydown,
  getCellAttributes,
  getRowAttributes,
  getGridAttributes,
} = useGridNavigation({
  rowCount: () => store.classifications.length,
  columnCount: 9, // Checkbox, Subject, Sender, Category, Urgency, Action, Confidence, Timestamp, Status
  onEnter: rowIndex => {
    // Enter edit mode for the focused row
    const classification = store.classifications[rowIndex]
    if (classification) {
      startEditing(classification.id)
      logAction('Keyboard enter edit mode', { rowId: classification.id })
    }
  },
  onSpace: rowIndex => {
    // Space also enters edit mode (alternative to Enter)
    const classification = store.classifications[rowIndex]
    if (classification) {
      startEditing(classification.id)
      logAction('Keyboard space enter edit mode', { rowId: classification.id })
    }
  },
  onEscape: () => {
    // Cancel any active editing
    if (editingRowId.value !== null) {
      cancelEdit()
      rowsWithChanges.value.delete(editingRowId.value)
      logAction('Keyboard escape cancel edit')
    }
  },
  isEditing: () => editingRowId.value !== null,
})

const pageSizeOptions = [25, 50, 100] // T027: Updated to match PAGINATION_CONFIG
const retryCount = ref(0)

// Success/error message display (T030, T031)
const successMessage = ref<string | null>(null)
const errorMessageInline = ref<string | null>(null)
let successTimeout: ReturnType<typeof setTimeout> | null = null
let errorTimeout: ReturnType<typeof setTimeout> | null = null

function showSuccess(message: string) {
  successMessage.value = message
  if (successTimeout) clearTimeout(successTimeout)
  successTimeout = setTimeout(() => {
    successMessage.value = null
  }, 3000)
}

function showError(message: string) {
  errorMessageInline.value = message
  if (errorTimeout) clearTimeout(errorTimeout)
  errorTimeout = setTimeout(() => {
    errorMessageInline.value = null
  }, 5000)
}

// Fetch on mount and check for recovered state (T065)
onMounted(() => {
  store.fetchClassifications()
  logAction('Classification list mounted')

  // Check for recovered auto-save state
  if (hasSavedState()) {
    const saved = getSavedState()
    if (saved) {
      // Show recovery notification - user can click the row to restore
      showSuccess(`Draft found for row ${saved.rowId}. Click the row to restore.`)
      logInfo('Found recoverable draft', { rowId: saved.rowId })
    }
  }
})

// Handle conflict resolution (T057)
async function handleConflictResolve(resolution: 'keep-mine' | 'use-server' | 'merge') {
  logAction('Conflict resolution chosen', { resolution })

  switch (resolution) {
    case 'keep-mine': {
      // Force overwrite with client's changes
      disableGuard() // Don't prompt during save
      const result = await forceOverwrite()
      enableGuard()
      if (result.success) {
        showSuccess('Your changes have been saved')
        clearSavedState()
      } else {
        showError(`Failed to save: ${result.error}`)
      }
      break
    }

    case 'use-server':
      // Accept server version
      acceptServerVersion()
      clearSavedState()
      showSuccess('Server version restored')
      break

    case 'merge':
      // For now, just show an info message - full merge UI would be a separate dialog
      showSuccess('Please manually review and update the fields, then save')
      break
  }
}

function handleConflictClose() {
  // User closed dialog without resolving - keep conflict state so they can try again
  logAction('Conflict dialog closed without resolution')
}

// Track which row has changes for save button visibility
const rowsWithChanges = ref<Set<number>>(new Set())

// Handle row click for mobile - open modal (T077)
function handleRowClick(classification: any) {
  if (isMobile.value) {
    mobileEditClassification.value = classification
    startEditing(classification.id)
    logAction('Mobile edit modal opened', { rowId: classification.id })
  }
}

// Handle dropdown change for a row (legacy - used when instant save is disabled)
function handleFieldChange(rowId: number, field: keyof InlineEditData, value: string) {
  console.log('🔄 Field changed:', { rowId, field, value })

  // Start editing this row if not already
  if (editingRowId.value !== rowId) {
    console.log('▶️ Starting edit for row:', rowId)
    startEditing(rowId)
  }

  // Update the field
  updateField(field, value)

  // Mark row as having changes
  rowsWithChanges.value.add(rowId)
  console.log('✏️ Row marked as changed. Current data:', currentData.value)
  console.log(
    '📊 Has changes?',
    hasRowChanges(rowId),
    'isDirty?',
    isDirty.value,
    'canSave?',
    canSave.value
  )
  logAction('Field changed', { rowId, field, value })
}

/**
 * Handle instant save from dropdown change (T015-T019)
 * Feature: 007-instant-edit-undo
 *
 * This function:
 * - T015: Handles 'instant-save' event from dropdowns
 * - T016: Wires to useInlineEdit.instantSave()
 * - T019: Works with existing optimistic locking
 */
async function handleInstantSave(
  recordId: number,
  field: 'category' | 'urgency' | 'action',
  newValue: string,
  previousValue: string
) {
  console.log('⚡ Instant save triggered:', { recordId, field, newValue, previousValue })
  logAction('Instant save triggered', { recordId, field, newValue, previousValue })

  // Track which field is saving for UI feedback
  savingField.value = { recordId, field }

  // Call instant save
  const result = await instantSave(recordId, field, newValue, previousValue)

  // Clear saving indicator
  savingField.value = null

  if (result.success && result.undoChange) {
    // T035: Trigger success flash animation
    recentlySavedField.value = { recordId, field }
    setTimeout(() => {
      if (
        recentlySavedField.value?.recordId === recordId &&
        recentlySavedField.value?.field === field
      ) {
        recentlySavedField.value = null
      }
    }, 600) // Match animation duration
    // T025: Record for undo
    const fieldLabels: Record<string, string> = {
      category: 'Category',
      urgency: 'Urgency',
      action: 'Action',
    }

    recordChange({
      type: 'single',
      changes: [result.undoChange],
      description: `Changed ${fieldLabels[field]} to ${newValue}`,
    })

    // T026: Show toast with Undo button
    toast.showWithUndo(`${fieldLabels[field]} updated`, async () => {
      // T027: Execute undo and show success toast
      const undoResult = await executeUndo()
      if (undoResult.success) {
        toast.success('Change undone')
        // Refresh to show restored value
        await store.refreshClassifications()
      } else {
        // T028: Show error toast with retry on undo failure
        toast.error(undoResult.error || 'Failed to undo')
      }
    })
    logAction('Instant save successful', { recordId, field, newValue })
  } else {
    // Show error message
    showError(result.error || 'Failed to save')
    logAction('Instant save failed', { recordId, field, error: result.error })
  }
}

// Track which field is currently saving for visual feedback
const savingField = ref<{ recordId: number; field: string } | null>(null)

// T035: Track which field recently saved successfully (for success flash)
const recentlySavedField = ref<{ recordId: number; field: string } | null>(null)

// Helper to check if a specific field is saving
function isFieldSaving(recordId: number, field: string): boolean {
  return savingField.value?.recordId === recordId && savingField.value?.field === field
}

// T035: Helper to check if a specific field was recently saved successfully
function wasRecentlySaved(recordId: number, field: string): boolean {
  return (
    recentlySavedField.value?.recordId === recordId && recentlySavedField.value?.field === field
  )
}

// =============================================================================
// EMAIL ACTIONS V2 HELPERS (Feature: 011-email-actions-v2, Tasks: T016-T020)
// =============================================================================

/**
 * Get action availability context for a classification
 * Used by ActionDropdown to determine which actions are available
 */
function getActionContext(classification: any): ActionAvailabilityContext {
  return {
    hasTrackingInfo: classification.has_tracking_info || false,
    hasDateInfo: classification.has_date_info || false,
    category: classification.category,
    isBlacklisted: false, // TODO: Check sender_lists when available
    isSafelisted: false, // TODO: Check sender_lists when available
  }
}

/**
 * Handle action change for V2 actions
 * Uses instant save pattern from T015-T019
 */
async function handleActionV2Change(
  recordId: number,
  newAction: ActionTypeV2,
  previousAction: string
) {
  logAction('Action V2 change triggered', { recordId, newAction, previousAction })

  // For now, save to action_v2 column via instant save
  // This will be extended to also create action_logs entries
  await handleInstantSave(recordId, 'action', newAction, previousAction)
}

// Handle mobile modal field update (T080)
function handleMobileFieldUpdate(field: keyof InlineEditData, value: string) {
  if (editingRowId.value !== null) {
    updateField(field, value)
    rowsWithChanges.value.add(editingRowId.value)
  }
}

// Handle mobile modal save (T080)
async function handleMobileSave() {
  if (editingRowId.value !== null) {
    await handleSaveRow(editingRowId.value)
    mobileEditClassification.value = null
  }
}

// Handle mobile modal cancel (T080)
function handleMobileCancel() {
  if (editingRowId.value !== null) {
    handleCancelRow(editingRowId.value)
    mobileEditClassification.value = null
  }
}

// Handle mobile modal close (T080)
function handleMobileClose() {
  mobileEditClassification.value = null
  if (editingRowId.value !== null && !isDirty.value) {
    cancelEdit()
  }
}

// Check if a row has unsaved changes
function hasRowChanges(rowId: number): boolean {
  return editingRowId.value === rowId && isDirty.value
}

// Save handler for a specific row (T021, T061-T064)
async function handleSaveRow(rowId: number) {
  console.log('💾 Save clicked for row:', rowId)
  console.log('Current editing row:', editingRowId.value)
  console.log('Can save?', canSave.value)
  console.log('Online?', isOnline.value)

  if (editingRowId.value !== rowId) {
    console.error('❌ Cannot save: editing row mismatch')
    return
  }

  // Check if offline (T061, T062)
  if (!isOnline.value) {
    // Queue for later when online (T064)
    if (currentData.value && originalVersion.value) {
      enqueuePendingSave(rowId, currentData.value, originalVersion.value, 'Offline')
      showSuccess('Offline: Changes queued for save when connection restored')
      rowsWithChanges.value.delete(rowId)
      cancelEdit()
      logAction('Save queued (offline)', { rowId })
    } else {
      showError('Cannot queue save: missing data')
    }
    return
  }

  console.log('🚀 Calling saveEdit()...')
  disableGuard() // Don't prompt during save
  const result = await saveEdit()
  enableGuard()
  console.log('📥 Save result:', result)

  if (result.success) {
    console.log('✅ Save successful')
    // Clear the changes tracker for this row
    rowsWithChanges.value.delete(rowId)
    // Clear auto-saved state since we successfully saved
    clearSavedState()
    // Show success message (T030)
    showSuccess('Changes saved successfully')
    // Refresh list to show updated data
    const previousCount = store.classifications.length
    await store.refreshClassifications()
    // Check if item was removed from view due to filter mismatch (T048, T049)
    const itemStillInView = store.classifications.some(c => c.id === rowId)
    if (!itemStillInView && store.hasActiveFilters && previousCount > 0) {
      showSuccess('Changes saved. Item no longer matches current filters.')
    }
    logAction('Inline edit saved successfully', { rowId })
  } else if (result.conflict) {
    console.error('⚠️ Conflict detected:', result.conflict)
    // Conflict dialog will open automatically (T056)
    logAction('Inline edit conflict detected', { rowId, conflict: result.conflict })
  } else {
    console.error('❌ Save failed:', result.error)

    // Check if it's a network error - queue for retry (T063, T064)
    if (
      result.error?.includes('network') ||
      result.error?.includes('fetch') ||
      result.error?.includes('timeout')
    ) {
      if (currentData.value && originalVersion.value) {
        enqueuePendingSave(rowId, currentData.value, originalVersion.value, result.error)
        showError('Network error: Changes queued for retry')
      } else {
        showError(`Save failed: ${result.error || 'Unknown error'}`)
      }
    } else {
      // Show error message (T031)
      showError(`Save failed: ${result.error || 'Unknown error'}`)
    }
    logAction('Inline edit save failed', { rowId, error: result.error })
  }
}

// Cancel handler for a specific row (T022)
function handleCancelRow(rowId: number) {
  if (editingRowId.value !== rowId) return

  cancelEdit()
  rowsWithChanges.value.delete(rowId)
  logAction('Inline edit cancelled', { rowId })
}

// Sort handler using useSort composable (T022)
function handleSort(column: string) {
  toggleSort(column as any)
}

// Bulk action handler (T033)
async function handleBulkAction(type: string, value?: string) {
  logAction('Bulk action triggered', { type, value, count: bulkSelectedCount.value })
  try {
    await executeBulkAction(type as any, value)
  } catch (e) {
    showError(`Bulk action failed: ${(e as Error).message}`)
  }
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

// Combined filtered data - applies global search
// Feature: 008-column-search-filters, T018, T023
// Note: All column filters (including subject/sender) are now handled by the service
// The service fetches all records when email filters are active and filters + paginates
const displayedClassifications = computed(() => {
  // Start with global search results or all classifications
  // Column filters are handled by the service layer
  return hasSearchQuery.value ? filteredClassifications.value : store.classifications
})
</script>

<template>
  <div class="classification-list">
    <div class="list-header">
      <h2>
        Email Classifications
        <!-- Column filter count indicator (Feature: 008-column-search-filters, T030) -->
        <span
          v-if="columnFilterCount > 0"
          class="filter-count-badge"
          :title="`${columnFilterCount} column filter${columnFilterCount > 1 ? 's' : ''} active`"
        >
          {{ columnFilterCount }}
        </span>
      </h2>
      <div class="list-controls">
        <!-- Mobile Filter Toggle Button (T034) -->
        <button
          v-if="isMobile"
          type="button"
          class="btn-mobile-filters"
          :class="{ 'has-active': hasColumnFilters }"
          @click="openMobileFilters"
          aria-label="Open column filters"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          <span v-if="columnFilterCount > 0" class="mobile-filter-badge">{{
            columnFilterCount
          }}</span>
        </button>

        <!-- Search Input (Feature: 005-table-enhancements, Task: T016) -->
        <SearchInput
          :model-value="searchQuery"
          @update:model-value="setSearchQuery"
          @clear="clearSearch"
          :is-loading="isSearching"
          :result-count="searchResultCount"
          placeholder="Search emails..."
        />
        <label class="page-size-control">
          Show:
          <select :value="store.pageSize" @change="handlePageSizeChange" class="page-size-select">
            <option v-for="size in pageSizeOptions" :key="size" :value="size">
              {{ size }} per page
            </option>
          </select>
        </label>
      </div>
    </div>

    <!-- Offline indicator (T062) -->
    <Transition name="slide-down">
      <div v-if="!isOnline" class="offline-banner" role="alert">
        <span class="offline-icon">📡</span>
        <span class="offline-text"
          >You're offline. Changes will be saved when connection is restored.</span
        >
      </div>
    </Transition>

    <!-- Pending queue indicator (T064) -->
    <Transition name="slide-down">
      <div v-if="hasQueuedOperations && isOnline" class="pending-banner" role="status">
        <span class="pending-icon">⏳</span>
        <span class="pending-text"
          >{{ queueSize }} pending save{{ queueSize > 1 ? 's' : '' }} being processed...</span
        >
        <div v-if="isPendingProcessing" class="pending-spinner"></div>
      </div>
    </Transition>

    <!-- Error display (T041) -->
    <div v-if="store.error" class="error-banner">
      <p class="error-text">{{ errorMessage }}</p>
      <button @click="handleRetry" class="btn-retry">Retry</button>
    </div>

    <!-- Bulk Action Toolbar (Feature: 005-table-enhancements, Task: T033) -->
    <BulkActionToolbar
      :selected-count="bulkSelectedCount"
      :is-processing="bulkIsProcessing"
      @action="handleBulkAction"
      @clear="bulkClearSelection"
    />

    <!-- Conflict Resolution Dialog (T056) -->
    <ConflictResolutionDialog
      :isOpen="isConflictDialogOpen"
      :conflict="conflictData"
      :myChanges="currentData"
      @resolve="handleConflictResolve"
      @close="handleConflictClose"
    />

    <!-- Mobile Edit Modal (T075, T077, T080) -->
    <MobileEditModal
      :isOpen="isMobileModalOpen"
      :classification="mobileEditClassification"
      :editData="currentData"
      :saveStatus="saveStatus"
      :isDirty="isDirty"
      @update:field="handleMobileFieldUpdate"
      @save="handleMobileSave"
      @cancel="handleMobileCancel"
      @close="handleMobileClose"
    />

    <!-- Keyboard Shortcuts Modal (T045, T046) -->
    <KeyboardShortcutsModal :isOpen="isKeyboardHelpOpen" @close="closeKeyboardHelp" />

    <!-- Mobile Column Filters Modal (T034, T035) -->
    <MobileColumnFilters
      :is-open="isMobileFiltersOpen"
      :filters="columnFilters"
      :active-count="columnFilterCount"
      @close="closeMobileFilters"
      @update:filter="setColumnFilter"
      @clear-all="clearAllColumnFilters"
    />

    <!-- Success message toast (T030) -->
    <Transition name="toast">
      <div v-if="successMessage" class="toast toast-success">
        <span class="toast-icon">✓</span>
        <span class="toast-text">{{ successMessage }}</span>
      </div>
    </Transition>

    <!-- Error message toast (T031) -->
    <Transition name="toast">
      <div v-if="errorMessageInline" class="toast toast-error">
        <span class="toast-icon">✕</span>
        <span class="toast-text">{{ errorMessageInline }}</span>
        <button @click="errorMessageInline = null" class="toast-close">×</button>
      </div>
    </Transition>

    <!-- Classification table (T026, T035) - Always visible with ARIA grid -->
    <div class="table-container">
      <table
        class="classification-table"
        v-bind="getGridAttributes()"
        @keydown="handleGridKeydown"
        tabindex="0"
        aria-label="Email Classifications"
      >
        <colgroup>
          <col />
          <!-- Checkbox -->
          <col />
          <!-- Subject -->
          <col />
          <!-- Sender -->
          <col />
          <!-- Category -->
          <col />
          <!-- Urgency -->
          <col />
          <!-- Action -->
          <col />
          <!-- Confidence -->
          <col />
          <!-- Classified -->
          <col />
          <!-- Status -->
        </colgroup>
        <thead>
          <tr>
            <!-- Select All checkbox (T032) -->
            <th class="checkbox-cell">
              <label class="checkbox-wrapper" title="Select all">
                <input
                  type="checkbox"
                  :checked="bulkIsAllSelected"
                  :indeterminate="bulkIsIndeterminate"
                  @change="bulkToggleSelectAll(displayedClassifications)"
                  class="bulk-checkbox"
                  aria-label="Select all rows"
                />
                <span class="checkbox-custom"></span>
              </label>
            </th>
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

          <!-- Column Filter Row (Feature: 008-column-search-filters, T015, T017, T037) -->
          <tr v-if="!isMobile" class="filter-row" role="row">
            <th class="checkbox-cell"><!-- No filter for checkbox --></th>
            <th class="filter-cell">
              <ColumnSearchInput
                :model-value="columnFilters.subject"
                @update:model-value="v => setColumnFilter('subject', v)"
                column-label="Subject"
                placeholder="Filter subject..."
                :is-active="isColumnFiltered('subject')"
                aria-controls="classifications-tbody"
                data-testid="filter-subject"
              />
            </th>
            <th class="filter-cell">
              <ColumnSearchInput
                :model-value="columnFilters.sender"
                @update:model-value="v => setColumnFilter('sender', v)"
                column-label="Sender"
                placeholder="Filter sender..."
                :is-active="isColumnFiltered('sender')"
                aria-controls="classifications-tbody"
                data-testid="filter-sender"
              />
            </th>
            <th class="filter-cell">
              <ColumnSearchInput
                :model-value="columnFilters.category"
                @update:model-value="v => setColumnFilter('category', v)"
                column-label="Category"
                placeholder="Filter category..."
                :is-active="isColumnFiltered('category')"
                aria-controls="classifications-tbody"
                data-testid="filter-category"
              />
            </th>
            <th class="filter-cell">
              <ColumnSearchInput
                :model-value="columnFilters.urgency"
                @update:model-value="v => setColumnFilter('urgency', v)"
                column-label="Urgency"
                placeholder="Filter urgency..."
                :is-active="isColumnFiltered('urgency')"
                aria-controls="classifications-tbody"
                data-testid="filter-urgency"
              />
            </th>
            <th class="filter-cell">
              <ColumnSearchInput
                :model-value="columnFilters.action"
                @update:model-value="v => setColumnFilter('action', v)"
                column-label="Action"
                placeholder="Filter action..."
                :is-active="isColumnFiltered('action')"
                aria-controls="classifications-tbody"
                data-testid="filter-action"
              />
            </th>
            <th class="filter-cell"><!-- No filter for Confidence --></th>
            <th class="filter-cell"><!-- No filter for Classified --></th>
            <th class="filter-cell"><!-- No filter for Status --></th>
          </tr>
        </thead>
        <tbody id="classifications-tbody">
          <!-- Loading skeletons (T086) -->
          <template v-if="store.isLoading && store.classifications.length === 0">
            <tr v-for="n in 5" :key="`skeleton-${n}`" class="skeleton-row">
              <td class="checkbox-cell"><div class="skeleton skeleton-checkbox"></div></td>
              <td><div class="skeleton skeleton-text skeleton-long"></div></td>
              <td><div class="skeleton skeleton-text skeleton-medium"></div></td>
              <td><div class="skeleton skeleton-badge"></div></td>
              <td><div class="skeleton skeleton-badge skeleton-small"></div></td>
              <td><div class="skeleton skeleton-badge skeleton-small"></div></td>
              <td><div class="skeleton skeleton-text skeleton-small"></div></td>
              <td><div class="skeleton skeleton-text skeleton-medium"></div></td>
              <td><div class="skeleton skeleton-badge skeleton-tiny"></div></td>
            </tr>
          </template>

          <!-- Loading overlay for smooth updates (when data already exists) -->
          <tr v-else-if="store.isLoading" class="loading-overlay-row">
            <td colspan="9" class="loading-overlay-cell">
              <div class="loading-overlay">
                <div class="mini-spinner"></div>
                <span>Updating...</span>
              </div>
            </td>
          </tr>

          <!-- Empty state - No search/filter results (T015, T021, T022, T087) -->
          <!-- Note: hasActiveServerFilters checks if filters meet 3-char minimum -->
          <tr
            v-else-if="
              (hasSearchQuery || hasActiveServerFilters) && displayedClassifications.length === 0
            "
            class="empty-row"
          >
            <td colspan="9" class="empty-cell">
              <div class="empty-state">
                <svg
                  class="empty-icon"
                  xmlns="http://www.w3.org/2000/svg"
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <p class="empty-title">No results found</p>
                <p class="empty-description">
                  <template v-if="hasSearchQuery && hasActiveServerFilters">
                    No emails match your search and filter criteria. Try different keywords or clear
                    filters.
                  </template>
                  <template v-else-if="hasSearchQuery">
                    No emails match "{{ searchQuery }}". Try different keywords.
                  </template>
                  <template v-else>
                    No emails match your column filters. Try different criteria.
                  </template>
                </p>
                <div class="empty-actions">
                  <button v-if="hasSearchQuery" @click="clearSearch" class="btn-clear-filters">
                    Clear Search
                  </button>
                  <button
                    v-if="hasActiveServerFilters"
                    @click="clearAllColumnFilters"
                    class="btn-clear-filters btn-secondary"
                  >
                    Clear Column Filters
                  </button>
                </div>
              </div>
            </td>
          </tr>

          <!-- Empty state - No data (T087) -->
          <tr v-else-if="store.classifications.length === 0" class="empty-row">
            <td colspan="9" class="empty-cell">
              <div class="empty-state">
                <svg
                  class="empty-icon"
                  xmlns="http://www.w3.org/2000/svg"
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M21 8V21H3V8"></path>
                  <path d="M1 3H23V8H1Z"></path>
                  <path d="M10 12H14"></path>
                </svg>
                <p class="empty-title">No classifications found</p>
                <p class="empty-description">
                  {{
                    store.hasActiveFilters
                      ? 'Try adjusting your filters or clearing them to see more results.'
                      : 'No email classifications have been processed yet.'
                  }}
                </p>
                <button
                  v-if="store.hasActiveFilters"
                  @click="store.clearFilters()"
                  class="btn-clear-filters"
                >
                  Clear Filters
                </button>
              </div>
            </td>
          </tr>

          <!-- Data rows with always-on inline dropdowns (T018-T020, T035-T043, T077) -->
          <!-- Uses displayedClassifications which combines global search + column filters (T016, T018, T023) -->
          <template
            v-else
            v-for="(classification, rowIndex) in displayedClassifications"
            :key="classification.id"
          >
            <tr
              v-bind="getRowAttributes(rowIndex)"
              :class="{
                'table-row': true,
                'has-changes': hasRowChanges(classification.id),
                'row-focused': focusedRow === rowIndex,
                'row-expanded': rowIsExpanded(classification.id),
                'mobile-clickable': isMobile,
              }"
              @click="handleRowClick(classification)"
            >
              <!-- Row checkbox (T031) -->
              <td class="checkbox-cell" @click.stop>
                <label class="checkbox-wrapper">
                  <input
                    type="checkbox"
                    :checked="bulkIsSelected(classification.id)"
                    @change="bulkToggleSelection(classification.id)"
                    class="bulk-checkbox"
                    :aria-label="`Select row ${classification.id}`"
                  />
                  <span class="checkbox-custom"></span>
                </label>
              </td>

              <!-- Subject (read-only) - with search highlight (T016) -->
              <td class="subject-cell">
                <button
                  class="expand-btn"
                  :class="{ expanded: rowIsExpanded(classification.id) }"
                  @click.stop="toggleRowExpand(classification.id)"
                  :aria-expanded="rowIsExpanded(classification.id)"
                  :aria-label="
                    rowIsExpanded(classification.id) ? 'Collapse row details' : 'Expand row details'
                  "
                  title="Toggle details"
                >
                  <span class="expand-icon">▶</span>
                </button>
                <span
                  v-if="hasSearchQuery"
                  v-html="highlightText(classification.email.subject || 'N/A')"
                ></span>
                <span v-else>{{ classification.email.subject || 'N/A' }}</span>
              </td>

              <!-- Sender (read-only) - with search highlight (T016) -->
              <td>
                <span
                  v-if="hasSearchQuery"
                  v-html="highlightText(classification.email.sender || 'N/A')"
                ></span>
                <span v-else>{{ classification.email.sender || 'N/A' }}</span>
              </td>

              <!-- Category (instant save) - T015, T019, T035 -->
              <td @click.stop class="editable-cell">
                <select
                  :value="classification.category"
                  @change="
                    handleInstantSave(
                      classification.id,
                      'category',
                      ($event.target as HTMLSelectElement).value,
                      classification.category
                    )
                  "
                  class="badge-select badge-category"
                  :class="[
                    `badge-${classification.category.toLowerCase()}`,
                    { 'is-saving': isFieldSaving(classification.id, 'category') },
                    { 'save-success': wasRecentlySaved(classification.id, 'category') },
                  ]"
                  :disabled="isFieldSaving(classification.id, 'category')"
                >
                  <option value="KIDS">KIDS</option>
                  <option value="ROBYN">ROBYN</option>
                  <option value="WORK">WORK</option>
                  <option value="FINANCIAL">FINANCIAL</option>
                  <option value="SHOPPING">SHOPPING</option>
                  <option value="CHURCH">CHURCH</option>
                  <option value="OTHER">OTHER</option>
                </select>
                <span
                  v-if="isFieldSaving(classification.id, 'category')"
                  class="field-spinner"
                ></span>
              </td>

              <!-- Urgency (instant save) - T015, T019, T035 -->
              <td @click.stop class="editable-cell">
                <select
                  :value="classification.urgency"
                  @change="
                    handleInstantSave(
                      classification.id,
                      'urgency',
                      ($event.target as HTMLSelectElement).value,
                      classification.urgency
                    )
                  "
                  class="badge-select badge-urgency"
                  :class="[
                    `badge-urgency-${classification.urgency.toLowerCase()}`,
                    { 'is-saving': isFieldSaving(classification.id, 'urgency') },
                    { 'save-success': wasRecentlySaved(classification.id, 'urgency') },
                  ]"
                  :disabled="isFieldSaving(classification.id, 'urgency')"
                >
                  <option value="HIGH">HIGH</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="LOW">LOW</option>
                </select>
                <span
                  v-if="isFieldSaving(classification.id, 'urgency')"
                  class="field-spinner"
                ></span>
              </td>

              <!-- Action (instant save) - T015, T019, T035, T018 (011-email-actions-v2) -->
              <td @click.stop class="editable-cell action-cell">
                <!-- V2 Action Dropdown (Feature: 011-email-actions-v2) -->
                <template v-if="USE_ACTION_V2">
                  <ActionDropdown
                    :model-value="(classification as any).action_v2 || migrateAction(classification.action)"
                    :context="getActionContext(classification)"
                    :disabled="isFieldSaving(classification.id, 'action')"
                    compact
                    @change="(newAction: ActionTypeV2) => handleActionV2Change(classification.id, newAction, (classification as any).action_v2 || classification.action)"
                  />
                </template>
                <!-- V1 Action Select (legacy) -->
                <template v-else>
                  <select
                    :value="classification.action"
                    @change="
                      handleInstantSave(
                        classification.id,
                        'action',
                        ($event.target as HTMLSelectElement).value,
                        classification.action
                      )
                    "
                    class="action-select"
                    :class="[
                      { 'is-saving': isFieldSaving(classification.id, 'action') },
                      { 'save-success': wasRecentlySaved(classification.id, 'action') },
                    ]"
                    :disabled="isFieldSaving(classification.id, 'action')"
                  >
                    <option value="FYI">FYI</option>
                    <option value="RESPOND">RESPOND</option>
                    <option value="TASK">TASK</option>
                    <option value="PAYMENT">PAYMENT</option>
                    <option value="CALENDAR">CALENDAR</option>
                    <option value="NONE">NONE</option>
                  </select>
                </template>
                <span
                  v-if="isFieldSaving(classification.id, 'action')"
                  class="field-spinner"
                ></span>
              </td>

              <!-- Confidence (read-only) -->
              <td>
                <ConfidenceBar :score="classification.confidence_score" :compact="true" />
              </td>

              <!-- Classified timestamp (read-only) -->
              <td>{{ formatTimestamp(classification.classified_timestamp) }}</td>

              <!-- Status column (T017 - removed Save/Cancel for instant save) -->
              <td @click.stop>
                <!-- Show saving indicator when any field in this row is saving -->
                <div v-if="savingField?.recordId === classification.id" class="instant-save-status">
                  <span class="status-spinner"></span>
                  <span class="status-text">Saving...</span>
                </div>
                <!-- Show correction badge when not saving -->
                <CorrectionBadge
                  v-else
                  :correctedTimestamp="classification.corrected_timestamp"
                  :correctedBy="classification.corrected_by"
                  variant="small"
                />
              </td>
            </tr>

            <!-- Expandable Row Details (T037-T040) -->
            <ExpandableRowDetails
              v-if="rowIsExpanded(classification.id)"
              :details="getRowDetails(classification.id)"
              :is-loading="rowIsLoading(classification.id)"
              :error="getRowError(classification.id)"
              :colspan="10"
            />
          </template>
        </tbody>
      </table>
    </div>

    <!-- Pagination controls (Feature: 010-shadcn-blue-theme, Tasks: T026-T027) -->
    <div v-if="!store.isLoading && store.totalCount > 0" class="pagination-wrapper">
      <div class="pagination-info">
        Showing {{ paginationInfo?.start }}-{{ paginationInfo?.end }}
        of {{ paginationInfo?.total }}
      </div>

      <Pagination
        :current-page="store.currentPage"
        :total-pages="store.pageCount"
        :sibling-count="1"
        :show-edges="true"
        @update:current-page="store.setPage($event)"
        @change="(page: number) => logAction('Pagination changed', { page })"
      >
        <PaginationContent>
          <template v-for="(item, index) in paginationItems" :key="index">
            <PaginationItem v-if="item.type === 'previous'">
              <PaginationPrevious :disabled="item.isDisabled" />
            </PaginationItem>

            <PaginationItem v-else-if="item.type === 'page'">
              <PaginationLink :page="item.page!" :is-active="item.isActive" />
            </PaginationItem>

            <PaginationItem v-else-if="item.type === 'ellipsis'">
              <PaginationEllipsis />
            </PaginationItem>

            <PaginationItem v-else-if="item.type === 'next'">
              <PaginationNext :disabled="item.isDisabled" />
            </PaginationItem>
          </template>
        </PaginationContent>
      </Pagination>
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
  color: var(--md-sys-color-on-surface);
}

.list-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

/* Search highlight styling */
:deep(mark) {
  background-color: var(--md-sys-color-tertiary-container);
  color: var(--md-sys-color-on-tertiary-container);
  padding: 0.1em 0.2em;
  border-radius: 2px;
  font-weight: 500;
}

.page-size-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.page-size-select {
  padding: 0.4rem 0.6rem;
  border: 1px solid var(--md-sys-color-outline);
  border-radius: var(--md-sys-shape-corner-small);
  background-color: var(--md-sys-color-surface-container-low);
  color: var(--md-sys-color-on-surface);
  transition: var(--md-sys-theme-transition);
}

/* Error banner */
.error-banner {
  background-color: var(--md-sys-color-error-container);
  border: 1px solid var(--md-sys-color-error);
  border-radius: var(--md-sys-shape-corner-small);
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.error-text {
  margin: 0;
  color: var(--md-sys-color-on-error-container);
}

.btn-retry {
  padding: 0.5rem 1rem;
  background-color: var(--md-sys-color-error);
  color: var(--md-sys-color-on-error);
  border: none;
  border-radius: var(--md-sys-shape-corner-small);
  cursor: pointer;
  transition: var(--md-sys-theme-transition);
}

.btn-retry:hover {
  opacity: 0.9;
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
  background-color: var(--md-sys-color-surface-container) !important;
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
  color: var(--md-sys-color-primary);
  font-weight: 500;
}

.mini-spinner {
  border: 3px solid var(--md-sys-color-surface-container-high);
  border-top: 3px solid var(--md-sys-color-primary);
  border-radius: 50%;
  width: 20px;
  height: 20px;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Loading skeletons */
.skeleton-row {
  background-color: var(--md-sys-color-surface-container);
}

.skeleton {
  background: linear-gradient(
    90deg,
    var(--md-sys-color-surface-container-high) 25%,
    var(--md-sys-color-surface-container-highest) 50%,
    var(--md-sys-color-surface-container-high) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
  border-radius: var(--md-sys-shape-corner-extra-small);
}

.skeleton-text {
  height: 16px;
}

.skeleton-badge {
  height: 24px;
  border-radius: 12px;
}

.skeleton-long {
  width: 80%;
}

.skeleton-medium {
  width: 60%;
}

.skeleton-small {
  width: 50px;
}

.skeleton-tiny {
  width: 30px;
}

@keyframes skeleton-shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* Empty state */
.empty-row {
  background-color: var(--md-sys-color-surface-container);
}

.empty-cell {
  text-align: center;
  padding: 3rem !important;
  color: var(--md-sys-color-on-surface-variant);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.empty-icon {
  color: var(--md-sys-color-outline);
  margin-bottom: 0.5rem;
}

.empty-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--md-sys-color-on-surface);
}

.empty-description {
  margin: 0;
  font-size: 0.9rem;
  color: var(--md-sys-color-on-surface-variant);
  max-width: 400px;
}

.btn-clear-filters {
  margin-top: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: var(--md-sys-color-primary);
  color: var(--md-sys-color-on-primary);
  border: none;
  border-radius: var(--md-sys-shape-corner-small);
  cursor: pointer;
  font-size: 0.9rem;
  transition: var(--md-sys-theme-transition);
}

.btn-clear-filters:hover {
  opacity: 0.9;
}

.btn-clear-filters.btn-secondary {
  background-color: var(--md-sys-color-secondary);
  color: var(--md-sys-color-on-secondary);
}

.empty-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

/* Column Filter Row Styles (Feature: 008-column-search-filters, T015, T019) */
.filter-row {
  background-color: var(--md-sys-color-surface-container-low);
}

.filter-row th {
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  vertical-align: middle;
}

.filter-cell {
  min-width: 100px;
}

/* Active filter count indicator (T030) */
.filter-count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: var(--md-sys-shape-corner-full);
  background-color: var(--md-sys-color-primary);
  color: var(--md-sys-color-on-primary);
  font-size: var(--md-sys-typescale-label-small-size);
  font-weight: var(--md-sys-typescale-label-small-weight);
  margin-left: 0.5rem;
}

/* Mobile filter toggle button (T034) */
.btn-mobile-filters {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  width: 44px;
  height: 44px;
  border: 1px solid var(--md-sys-color-outline);
  border-radius: var(--md-sys-shape-corner-medium);
  background-color: var(--md-sys-color-surface-container-low);
  color: var(--md-sys-color-on-surface-variant);
  cursor: pointer;
  transition: var(--md-sys-theme-transition);
}

.btn-mobile-filters:hover {
  background-color: var(--md-sys-color-surface-container);
  border-color: var(--md-sys-color-primary);
}

.btn-mobile-filters:focus {
  outline: 2px solid var(--md-sys-color-primary);
  outline-offset: 2px;
}

.btn-mobile-filters.has-active {
  background-color: var(--md-sys-color-primary-container);
  border-color: var(--md-sys-color-primary);
  color: var(--md-sys-color-on-primary-container);
}

.mobile-filter-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: var(--md-sys-shape-corner-full);
  background-color: var(--md-sys-color-primary);
  color: var(--md-sys-color-on-primary);
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
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
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: var(--md-sys-shape-corner-medium);
  width: 100%;
}

.classification-table {
  width: 100%;
  border-collapse: collapse;
  background-color: var(--md-sys-color-surface);
  table-layout: fixed;
}

.classification-table thead {
  background-color: var(--md-sys-color-surface-container);
  border-bottom: 2px solid var(--md-sys-color-outline-variant);
}

.classification-table th {
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: var(--md-sys-color-on-surface);
  font-size: 0.9rem;
  white-space: nowrap;
}

.classification-table th.sortable {
  cursor: pointer;
  user-select: none;
  transition: var(--md-sys-theme-transition);
}

.classification-table th.sortable:hover {
  background-color: var(--md-sys-color-surface-container-high);
}

.sort-indicator {
  margin-left: 0.5rem;
  color: var(--md-sys-color-primary);
}

.classification-table td {
  padding: 0.8rem 1rem;
  border-top: 1px solid var(--md-sys-color-outline-variant);
  font-size: 0.9rem;
  color: var(--md-sys-color-on-surface);
}

.table-row.clickable {
  cursor: pointer;
  transition: var(--md-sys-theme-transition);
}

.table-row.clickable:hover {
  background-color: var(--md-sys-color-surface-container);
}

.subject-cell {
  font-weight: 500;
  color: var(--md-sys-color-on-surface);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  /* Allow subject to display more text */
  max-width: none;
}

.subject-cell > span {
  /* Only truncate when absolutely necessary */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Expand button styles */
.expand-btn {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  border: none;
  border-radius: var(--md-sys-shape-corner-extra-small);
  background-color: transparent;
  cursor: pointer;
  transition: var(--md-sys-theme-transition);
  color: var(--md-sys-color-on-surface-variant);
}

.expand-btn:hover {
  background-color: var(--md-sys-color-surface-container-high);
  color: var(--md-sys-color-primary);
}

.expand-btn:focus {
  outline: 2px solid var(--md-sys-color-primary);
  outline-offset: 1px;
}

.expand-icon {
  font-size: 0.6rem;
  transition: transform 0.15s ease;
}

.expand-btn.expanded .expand-icon {
  transform: rotate(90deg);
}

.table-row.row-expanded {
  background-color: var(--md-sys-color-primary-container);
  border-left: 3px solid var(--md-sys-color-primary);
}

/* Checkbox column styles (T031, T032) */
.checkbox-cell {
  width: 40px !important;
  min-width: 40px;
  max-width: 40px;
  text-align: center;
  padding: 0.5rem !important;
}

.checkbox-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  width: 20px;
  height: 20px;
}

.bulk-checkbox {
  position: absolute;
  opacity: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
  z-index: 1;
}

.checkbox-custom {
  display: inline-block;
  width: 18px;
  height: 18px;
  border: 2px solid var(--md-sys-color-outline);
  border-radius: var(--md-sys-shape-corner-extra-small);
  background-color: var(--md-sys-color-surface);
  transition: var(--md-sys-theme-transition);
  position: relative;
}

.bulk-checkbox:checked + .checkbox-custom {
  background-color: var(--md-sys-color-primary);
  border-color: var(--md-sys-color-primary);
}

.bulk-checkbox:checked + .checkbox-custom::after {
  content: '';
  position: absolute;
  left: 5px;
  top: 2px;
  width: 5px;
  height: 9px;
  border: solid var(--md-sys-color-on-primary);
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.bulk-checkbox:indeterminate + .checkbox-custom {
  background-color: var(--md-sys-color-primary);
  border-color: var(--md-sys-color-primary);
}

.bulk-checkbox:indeterminate + .checkbox-custom::after {
  content: '';
  position: absolute;
  left: 3px;
  top: 7px;
  width: 10px;
  height: 2px;
  background-color: var(--md-sys-color-on-primary);
}

.bulk-checkbox:focus + .checkbox-custom {
  box-shadow: 0 0 0 3px var(--md-sys-color-primary-container);
}

.checkbox-wrapper:hover .checkbox-custom {
  border-color: var(--md-sys-color-primary);
}

.skeleton-checkbox {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  margin: 0 auto;
}

/* Column widths - percentage based for responsiveness */
.classification-table col:nth-child(1) {
  width: 3%;
} /* Checkbox */
.classification-table col:nth-child(2) {
  width: 25%;
} /* Subject */
.classification-table col:nth-child(3) {
  width: 12%;
} /* Sender */
.classification-table col:nth-child(4) {
  width: 10%;
} /* Category */
.classification-table col:nth-child(5) {
  width: 8%;
} /* Urgency */
.classification-table col:nth-child(6) {
  width: 9%;
} /* Action */
.classification-table col:nth-child(7) {
  width: 8%;
} /* Confidence */
.classification-table col:nth-child(8) {
  width: 18%;
} /* Classified */
.classification-table col:nth-child(9) {
  width: 7%;
} /* Status */

/* Checkbox column */
.classification-table th:nth-child(1),
.classification-table td:nth-child(1) {
  padding: 0.5rem !important;
  text-align: center;
}

/* Subject column */
.classification-table th:nth-child(2),
.classification-table td:nth-child(2) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Sender column */
.classification-table th:nth-child(3),
.classification-table td:nth-child(3) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Status column */
.classification-table th:nth-child(9),
.classification-table td:nth-child(9) {
  text-align: center;
}

/* Badges */
.badge {
  display: inline-block;
  padding: 0.25rem 0.6rem;
  border-radius: var(--md-sys-shape-corner-full);
  font-size: var(--md-sys-typescale-label-small-size);
  font-weight: var(--md-sys-typescale-label-small-weight);
  text-transform: uppercase;
}

.badge-kids {
  background-color: var(--md-ext-color-badge-kids);
  color: var(--md-ext-color-badge-kids-text);
}
.badge-robyn {
  background-color: var(--md-ext-color-badge-robyn);
  color: var(--md-ext-color-badge-robyn-text);
}
.badge-work {
  background-color: var(--md-ext-color-badge-work);
  color: var(--md-ext-color-badge-work-text);
}
.badge-financial {
  background-color: var(--md-ext-color-badge-financial);
  color: var(--md-ext-color-badge-financial-text);
}
.badge-shopping {
  background-color: var(--md-ext-color-badge-shopping);
  color: var(--md-ext-color-badge-shopping-text);
}
.badge-church {
  background-color: var(--md-ext-color-badge-church);
  color: var(--md-ext-color-badge-church-text);
}
.badge-other {
  background-color: var(--md-ext-color-badge-other);
  color: var(--md-ext-color-badge-other-text);
}

.badge-urgency-high {
  background-color: var(--md-ext-color-urgency-high);
  color: var(--md-ext-color-urgency-high-text);
}
.badge-urgency-medium {
  background-color: var(--md-ext-color-urgency-medium);
  color: var(--md-ext-color-urgency-medium-text);
}
.badge-urgency-low {
  background-color: var(--md-ext-color-urgency-low);
  color: var(--md-ext-color-urgency-low-text);
}

/* Pagination (Feature: 010-shadcn-blue-theme, Tasks: T026-T027) */
.pagination-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 1rem;
  background-color: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius, 0.5rem);
  margin-top: 1rem;
}

.pagination-info {
  font-size: 0.875rem;
  color: hsl(var(--muted-foreground));
}

/* Inline Edit Styles (Feature: 004-inline-edit, T016-T020) */

/* Row with unsaved changes highlight */
.table-row.has-changes {
  background-color: var(--md-ext-color-warning-container);
  border-left: 3px solid var(--md-ext-color-warning);
}

/* Keyboard focus indicator for row (T042) */
.table-row.row-focused {
  outline: 2px solid var(--md-sys-color-primary);
  outline-offset: -2px;
  background-color: var(--md-sys-color-primary-container);
}

.table-row.row-focused.has-changes {
  background-color: var(--md-ext-color-warning-container);
  outline-color: var(--md-ext-color-warning);
}

/* Focus styles for table */
.classification-table:focus {
  outline: 2px solid var(--md-sys-color-primary);
  outline-offset: 2px;
}

.classification-table:focus-visible {
  outline: 2px solid var(--md-sys-color-primary);
  outline-offset: 2px;
}

/* Badge-styled select dropdowns (Asana-style inline editing) */
.badge-select,
.action-select {
  /* Base badge styling */
  display: inline-block;
  padding: 0.25rem 1.5rem 0.25rem 0.6rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;

  /* Remove default select appearance */
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;

  /* Add custom dropdown arrow */
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='white' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.4rem center;
  background-size: 0.7rem;

  /* Styling */
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  color: white;
}

/* Category badge colors */
.badge-select.badge-kids {
  background-color: var(--md-ext-color-badge-kids);
}
.badge-select.badge-robyn {
  background-color: var(--md-ext-color-badge-robyn);
}
.badge-select.badge-work {
  background-color: var(--md-ext-color-badge-work);
}
.badge-select.badge-financial {
  background-color: var(--md-ext-color-badge-financial);
}
.badge-select.badge-shopping {
  background-color: var(--md-ext-color-badge-shopping);
}
.badge-select.badge-church {
  background-color: var(--md-ext-color-badge-church);
}
.badge-select.badge-other {
  background-color: var(--md-ext-color-badge-other);
}

/* Urgency badge colors */
.badge-select.badge-urgency-high {
  background-color: var(--md-ext-color-urgency-high);
}
.badge-select.badge-urgency-medium {
  background-color: var(--md-ext-color-urgency-medium);
}
.badge-select.badge-urgency-low {
  background-color: var(--md-ext-color-urgency-low);
}

/* Action select styling (no badge background) */
.action-select {
  background-color: transparent;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2349454F' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  color: var(--md-sys-color-on-surface);
  padding: 0.25rem 1.5rem 0.25rem 0.4rem;
  border: none;
  font-size: var(--md-sys-typescale-body-medium-size);
  text-transform: none;
  font-weight: normal;
}

/* Hover effects */
.badge-select:hover:not(:disabled),
.action-select:hover:not(:disabled) {
  opacity: 0.9;
  transform: scale(1.02);
}

/* Focus effects */
.badge-select:focus,
.action-select:focus {
  outline: 2px solid var(--md-sys-color-primary);
  outline-offset: 2px;
}

/* Disabled state */
.badge-select:disabled,
.action-select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Option styling */
.badge-select option,
.action-select option {
  background-color: var(--md-sys-color-surface);
  color: var(--md-sys-color-on-surface);
  padding: 0.5rem;
  font-weight: normal;
}

/* Instant save styles (007-instant-edit-undo, T015-T019) */
.editable-cell {
  position: relative;
}

.badge-select.is-saving,
.action-select.is-saving {
  opacity: 0.6;
  pointer-events: none;
}

.field-spinner {
  position: absolute;
  right: 0.25rem;
  top: 50%;
  transform: translateY(-50%);
  width: 12px;
  height: 12px;
  border: 2px solid var(--md-sys-color-outline-variant);
  border-top-color: var(--md-sys-color-primary);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  pointer-events: none;
}

.instant-save-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: var(--md-sys-typescale-label-small-size);
  color: var(--md-sys-color-primary);
}

.status-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid var(--md-sys-color-outline-variant);
  border-top-color: var(--md-sys-color-primary);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

.status-text {
  font-weight: 500;
}

/* T035: Success highlight animation after save completes */
@keyframes success-flash {
  0% {
    box-shadow: 0 0 0 0 var(--md-ext-color-success);
  }
  50% {
    box-shadow: 0 0 0 3px var(--md-ext-color-success);
  }
  100% {
    box-shadow: 0 0 0 0 transparent;
  }
}

.badge-select.save-success,
.action-select.save-success {
  animation: success-flash 0.6s ease-out;
}

/* Edit actions (Save/Cancel buttons) - kept for legacy/fallback */
.edit-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  align-items: center;
}

.btn-save,
.btn-cancel {
  padding: 0.4rem 0.8rem;
  border: none;
  border-radius: var(--md-sys-shape-corner-small);
  cursor: pointer;
  font-size: 1rem;
  font-weight: var(--md-sys-typescale-label-large-weight);
  transition: var(--md-sys-theme-transition);
  min-width: 32px;
  height: 32px;
}

.btn-save {
  background-color: var(--md-ext-color-success);
  color: var(--md-ext-color-on-success);
}

.btn-save:hover:not(:disabled) {
  opacity: 0.9;
  transform: scale(1.05);
}

.btn-save:disabled {
  background-color: var(--md-sys-color-surface-container-highest);
  color: var(--md-sys-color-on-surface);
  cursor: not-allowed;
  opacity: 0.5;
}

.btn-cancel {
  background-color: var(--md-sys-color-error);
  color: var(--md-sys-color-on-error);
}

.btn-cancel:hover:not(:disabled) {
  opacity: 0.9;
  transform: scale(1.05);
}

.btn-cancel:disabled {
  background-color: var(--md-sys-color-surface-container-highest);
  color: var(--md-sys-color-on-surface);
  cursor: not-allowed;
  opacity: 0.5;
}

/* Toast notifications (T030, T031) */
.toast {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: var(--md-sys-shape-corner-medium);
  box-shadow: var(--md-sys-elevation-3);
  font-size: var(--md-sys-typescale-body-medium-size);
  min-width: 200px;
  max-width: 400px;
}

.toast-success {
  background-color: var(--md-ext-color-success-container);
  border-left: 4px solid var(--md-ext-color-success);
  color: var(--md-ext-color-on-success-container);
}

.toast-error {
  background-color: var(--md-sys-color-error-container);
  border-left: 4px solid var(--md-sys-color-error);
  color: var(--md-sys-color-on-error-container);
}

.toast-icon {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border-radius: var(--md-sys-shape-corner-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
}

.toast-success .toast-icon {
  background-color: var(--md-ext-color-success);
  color: var(--md-ext-color-on-success);
}

.toast-error .toast-icon {
  background-color: var(--md-sys-color-error);
  color: var(--md-sys-color-on-error);
}

.toast-text {
  flex: 1;
}

.toast-close {
  flex-shrink: 0;
  background: none;
  border: none;
  font-size: 1.25rem;
  color: inherit;
  opacity: 0.6;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.toast-close:hover {
  opacity: 1;
}

/* Toast transitions */
.toast-enter-active {
  animation: toast-in 0.3s ease-out;
}

.toast-leave-active {
  animation: toast-out 0.2s ease-in forwards;
}

@keyframes toast-in {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes toast-out {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}

/* Button spinner (T028) */
.btn-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: btn-spin 0.8s linear infinite;
}

.btn-saving {
  position: relative;
  pointer-events: none;
}

@keyframes btn-spin {
  to {
    transform: rotate(360deg);
  }
}

/* Offline and Pending banners (T062, T064) */
.offline-banner,
.pending-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: var(--md-sys-shape-corner-small);
  font-size: var(--md-sys-typescale-body-medium-size);
  margin-bottom: 0.5rem;
}

.offline-banner {
  background-color: var(--md-ext-color-warning-container);
  border: 1px solid var(--md-ext-color-warning);
  color: var(--md-ext-color-on-warning-container);
}

.pending-banner {
  background-color: var(--md-sys-color-tertiary-container);
  border: 1px solid var(--md-sys-color-tertiary);
  color: var(--md-sys-color-on-tertiary-container);
}

.offline-icon,
.pending-icon {
  font-size: 1.25rem;
}

.offline-text,
.pending-text {
  flex: 1;
}

.pending-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--md-sys-color-tertiary-container);
  border-top-color: var(--md-sys-color-tertiary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* Slide down transition for banners */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Mobile-clickable row indicator (T077) */
.mobile-clickable {
  cursor: pointer;
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

  .pagination-wrapper {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  /* Larger touch targets for mobile (T078) */
  .btn-save,
  .btn-cancel {
    min-width: 44px;
    height: 44px;
    font-size: 1.2rem;
  }

  /* Toast positioning for mobile */
  .toast {
    left: 1rem;
    right: 1rem;
    max-width: none;
  }

  /* Mobile card layout (T079) */
  .classification-table {
    display: block;
  }

  .classification-table thead {
    display: none;
  }

  .classification-table tbody {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .classification-table tr.table-row {
    display: flex;
    flex-wrap: wrap;
    padding: 1rem;
    border: 1px solid var(--md-sys-color-outline-variant);
    border-radius: var(--md-sys-shape-corner-medium);
    background-color: var(--md-sys-color-surface);
    gap: 0.5rem;
  }

  .classification-table tr.table-row:active {
    background-color: var(--md-sys-color-surface-container);
  }

  .classification-table tr.table-row.has-changes {
    border-left: 4px solid var(--md-ext-color-warning);
  }

  .classification-table td {
    border: none;
    padding: 0;
  }

  /* Checkbox - show in corner of card on mobile */
  .classification-table td:nth-child(1) {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    width: auto !important;
    min-width: auto;
    max-width: none;
  }

  .classification-table tr.table-row {
    position: relative;
    padding-right: 2.5rem; /* Make room for checkbox */
  }

  /* Subject spans full width */
  .classification-table td:nth-child(2) {
    width: 100%;
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 0.25rem;
  }

  /* Sender spans full width */
  .classification-table td:nth-child(3) {
    width: 100%;
    font-size: var(--md-sys-typescale-body-small-size);
    color: var(--md-sys-color-on-surface-variant);
    margin-bottom: 0.5rem;
  }

  /* Category, Urgency, Action in a row */
  .classification-table td:nth-child(4),
  .classification-table td:nth-child(5),
  .classification-table td:nth-child(6) {
    width: auto;
  }

  /* Hide confidence, timestamp on mobile - show in modal */
  .classification-table td:nth-child(7),
  .classification-table td:nth-child(8) {
    display: none;
  }

  /* Status/Actions at end */
  .classification-table td:nth-child(9) {
    width: auto;
    margin-left: auto;
  }

  /* Hide inline dropdowns on mobile - use modal instead */
  .badge-select,
  .action-select {
    pointer-events: none;
    background-image: none;
    padding-right: 0.6rem;
  }

  /* Hide skeleton rows on mobile for cleaner loading */
  .skeleton-row {
    display: block;
    padding: 1rem;
    border: 1px solid var(--md-sys-color-outline-variant);
    border-radius: var(--md-sys-shape-corner-medium);
    margin-bottom: 0.5rem;
  }

  .skeleton-row td {
    display: block;
    border: none;
    padding: 0.25rem 0;
  }

  /* Empty and loading states */
  .empty-row,
  .loading-overlay-row {
    display: block;
    padding: 2rem 1rem;
    text-align: center;
  }
}
</style>
