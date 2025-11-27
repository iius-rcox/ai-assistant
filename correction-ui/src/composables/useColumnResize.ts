/**
 * Column Resize Composable
 * Feature: 005-table-enhancements
 * Tasks: T061, T062, T063, T064
 * Requirements: FR-008, FR-009
 *
 * Provides column resizing functionality with:
 * - Drag handle event listeners
 * - Minimum width constraint (50px)
 * - localStorage persistence for column widths
 */

import { ref, onMounted, onUnmounted } from 'vue'
import { logAction } from '@/utils/logger'

const STORAGE_KEY = 'table-column-widths'
const MIN_COLUMN_WIDTH = 50 // pixels

export interface ColumnWidths {
  [columnKey: string]: number
}

export interface UseColumnResizeOptions {
  /** Default column widths */
  defaultWidths?: ColumnWidths
  /** Minimum column width */
  minWidth?: number
  /** Callback when widths change */
  onWidthChange?: (widths: ColumnWidths) => void
}

export function useColumnResize(options: UseColumnResizeOptions = {}) {
  const { defaultWidths = {}, minWidth = MIN_COLUMN_WIDTH, onWidthChange } = options

  // State
  const columnWidths = ref<ColumnWidths>({ ...defaultWidths })
  const isResizing = ref(false)
  const resizingColumn = ref<string | null>(null)
  const startX = ref(0)
  const startWidth = ref(0)

  /**
   * Load saved widths from localStorage
   */
  function loadSavedWidths() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        columnWidths.value = { ...defaultWidths, ...parsed }
        logAction('Column widths loaded', { widths: columnWidths.value })
      }
    } catch (e) {
      // localStorage not available or invalid JSON
    }
  }

  /**
   * Save widths to localStorage
   */
  function saveWidths() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(columnWidths.value))
    } catch (e) {
      // localStorage not available
    }
  }

  /**
   * Get width for a column
   */
  function getColumnWidth(columnKey: string): number | undefined {
    return columnWidths.value[columnKey]
  }

  /**
   * Set width for a column
   */
  function setColumnWidth(columnKey: string, width: number) {
    const clampedWidth = Math.max(minWidth, width)
    columnWidths.value[columnKey] = clampedWidth
    saveWidths()
    onWidthChange?.(columnWidths.value)
  }

  /**
   * Start resizing a column
   */
  function startResize(columnKey: string, event: MouseEvent) {
    event.preventDefault()
    isResizing.value = true
    resizingColumn.value = columnKey
    startX.value = event.clientX
    startWidth.value = columnWidths.value[columnKey] || 100

    // Add global listeners
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    // Add cursor style to body
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    logAction('Column resize started', { column: columnKey })
  }

  /**
   * Handle mouse move during resize
   */
  function handleMouseMove(event: MouseEvent) {
    if (!isResizing.value || !resizingColumn.value) return

    const delta = event.clientX - startX.value
    const newWidth = Math.max(minWidth, startWidth.value + delta)

    columnWidths.value[resizingColumn.value] = newWidth
  }

  /**
   * Handle mouse up to end resize
   */
  function handleMouseUp() {
    if (!isResizing.value) return

    // Remove global listeners
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)

    // Reset cursor
    document.body.style.cursor = ''
    document.body.style.userSelect = ''

    // Save final width
    if (resizingColumn.value) {
      saveWidths()
      logAction('Column resize ended', {
        column: resizingColumn.value,
        width: columnWidths.value[resizingColumn.value],
      })
      onWidthChange?.(columnWidths.value)
    }

    isResizing.value = false
    resizingColumn.value = null
  }

  /**
   * Reset all column widths to defaults
   */
  function resetWidths() {
    columnWidths.value = { ...defaultWidths }
    saveWidths()
    logAction('Column widths reset to defaults')
    onWidthChange?.(columnWidths.value)
  }

  /**
   * Get style object for a column header
   */
  function getColumnStyle(columnKey: string): { width?: string; minWidth: string } {
    const width = columnWidths.value[columnKey]
    return {
      width: width ? `${width}px` : undefined,
      minWidth: `${minWidth}px`,
    }
  }

  // Cleanup on unmount
  onUnmounted(() => {
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  })

  // Load saved widths on mount
  onMounted(() => {
    loadSavedWidths()
  })

  return {
    // State
    columnWidths,
    isResizing,
    resizingColumn,

    // Methods
    getColumnWidth,
    setColumnWidth,
    startResize,
    resetWidths,
    getColumnStyle,
    loadSavedWidths,
  }
}

export type UseColumnResizeReturn = ReturnType<typeof useColumnResize>
