/**
 * Pending Queue Composable
 * Feature: 004-inline-edit
 * Task: T054
 * Requirements: FR-027, FR-028 (Offline support and retry)
 *
 * Queues failed save operations for retry when online
 */

import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useOnline, useStorage } from '@vueuse/core'
import type { InlineEditData } from '@/types/inline-edit'
import { STORAGE_KEYS } from '@/constants/storage'
import { logAction, logInfo, logWarn, logError } from '@/utils/logger'

export interface PendingOperation {
  id: string
  rowId: number
  data: InlineEditData
  version: number
  timestamp: number
  retryCount: number
  lastError?: string
}

export interface UsePendingQueueOptions {
  /** Max retry attempts before giving up */
  maxRetries?: number
  /** Retry delay in ms (will be multiplied by retry count) */
  retryDelayMs?: number
  /** Function to execute the save operation */
  saveOperation: (rowId: number, data: InlineEditData, version: number) => Promise<boolean>
  /** Called when operation succeeds */
  onSuccess?: (operation: PendingOperation) => void
  /** Called when operation fails after max retries */
  onFailed?: (operation: PendingOperation) => void
}

export function usePendingQueue(options: UsePendingQueueOptions) {
  const {
    maxRetries = 3,
    retryDelayMs = 2000,
    saveOperation,
    onSuccess,
    onFailed
  } = options

  // Track online status using VueUse (T061)
  const isOnline = useOnline()

  // Persist queue to localStorage
  const queue = useStorage<PendingOperation[]>(
    STORAGE_KEYS.PENDING_QUEUE,
    [],
    localStorage
  )

  const isProcessing = ref(false)
  let retryTimeout: ReturnType<typeof setTimeout> | null = null

  // Queue size for UI display
  const queueSize = computed(() => queue.value.length)
  const hasQueuedOperations = computed(() => queue.value.length > 0)

  /**
   * Add operation to pending queue
   */
  function enqueue(rowId: number, data: InlineEditData, version: number, error?: string): string {
    const id = `${rowId}-${Date.now()}`
    const operation: PendingOperation = {
      id,
      rowId,
      data: { ...data },
      version,
      timestamp: Date.now(),
      retryCount: 0,
      lastError: error
    }

    queue.value.push(operation)
    logAction('Queued pending operation', { id, rowId })

    // Try to process if online
    if (isOnline.value) {
      scheduleRetry()
    }

    return id
  }

  /**
   * Remove operation from queue
   */
  function dequeue(id: string) {
    const index = queue.value.findIndex(op => op.id === id)
    if (index !== -1) {
      queue.value.splice(index, 1)
      logAction('Removed pending operation', { id })
    }
  }

  /**
   * Clear all pending operations
   */
  function clearQueue() {
    queue.value = []
    logAction('Cleared pending queue')
  }

  /**
   * Process a single operation
   */
  async function processOperation(operation: PendingOperation): Promise<boolean> {
    try {
      logInfo('Processing pending operation', { id: operation.id, attempt: operation.retryCount + 1 })

      const success = await saveOperation(operation.rowId, operation.data, operation.version)

      if (success) {
        dequeue(operation.id)
        onSuccess?.(operation)
        logAction('Pending operation succeeded', { id: operation.id })
        return true
      } else {
        throw new Error('Save returned false')
      }
    } catch (error) {
      operation.retryCount++
      operation.lastError = error instanceof Error ? error.message : 'Unknown error'

      if (operation.retryCount >= maxRetries) {
        dequeue(operation.id)
        onFailed?.(operation)
        logError('Pending operation failed after max retries', error, { id: operation.id })
        return false
      }

      logWarn('Pending operation failed, will retry', { id: operation.id, retryCount: operation.retryCount })
      return false
    }
  }

  /**
   * Process all pending operations (T063)
   */
  async function processQueue() {
    if (isProcessing.value || !isOnline.value || queue.value.length === 0) {
      return
    }

    isProcessing.value = true
    logInfo('Processing pending queue', { count: queue.value.length })

    // Process operations sequentially
    for (const operation of [...queue.value]) {
      if (!isOnline.value) {
        logWarn('Went offline during queue processing')
        break
      }

      await processOperation(operation)

      // Small delay between operations
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    isProcessing.value = false

    // Schedule retry for remaining operations
    if (queue.value.length > 0 && isOnline.value) {
      scheduleRetry()
    }
  }

  /**
   * Schedule retry after delay
   */
  function scheduleRetry() {
    if (retryTimeout) {
      clearTimeout(retryTimeout)
    }

    const delay = retryDelayMs * Math.min(queue.value[0]?.retryCount || 1, 5)
    retryTimeout = setTimeout(() => {
      processQueue()
    }, delay)
  }

  /**
   * Cancel scheduled retry
   */
  function cancelRetry() {
    if (retryTimeout) {
      clearTimeout(retryTimeout)
      retryTimeout = null
    }
  }

  // Watch online status and process queue when coming back online (T063)
  onMounted(() => {
    // Process any existing queued operations on mount
    if (isOnline.value && queue.value.length > 0) {
      setTimeout(() => processQueue(), 1000)
    }
  })

  onUnmounted(() => {
    cancelRetry()
  })

  // Auto-retry when coming back online
  const stopWatcher = ref<(() => void) | null>(null)
  onMounted(() => {
    const unwatch = watch(isOnline, (online, wasOnline) => {
      if (online && !wasOnline && queue.value.length > 0) {
        logInfo('Back online, processing pending queue')
        processQueue()
      }
    })
    stopWatcher.value = unwatch
  })

  onUnmounted(() => {
    stopWatcher.value?.()
  })

  return {
    // State
    isOnline,
    isProcessing,
    queue,
    queueSize,
    hasQueuedOperations,

    // Actions
    enqueue,
    dequeue,
    clearQueue,
    processQueue,
    processOperation
  }
}
