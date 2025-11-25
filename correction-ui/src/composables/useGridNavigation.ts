/**
 * Grid Navigation Composable
 * Feature: 004-inline-edit
 * Task: T034
 * Requirement: FR-022 (Keyboard navigation)
 *
 * Implements ARIA grid navigation pattern for table keyboard accessibility
 */

import { ref, computed, onMounted, onUnmounted } from 'vue'
import { logAction } from '@/utils/logger'

export interface GridNavigationOptions {
  /** Total number of rows in the grid */
  rowCount: () => number
  /** Total number of navigable columns */
  columnCount: number
  /** Callback when Enter is pressed on a cell */
  onEnter?: (rowIndex: number, colIndex: number) => void
  /** Callback when Escape is pressed */
  onEscape?: () => void
  /** Callback when Space is pressed on a cell */
  onSpace?: (rowIndex: number, colIndex: number) => void
  /** Whether the grid is currently in edit mode */
  isEditing?: () => boolean
}

export function useGridNavigation(options: GridNavigationOptions) {
  const {
    rowCount,
    columnCount,
    onEnter,
    onEscape,
    onSpace,
    isEditing = () => false
  } = options

  // Current focused position
  const focusedRow = ref(0)
  const focusedCol = ref(0)

  // Track if grid navigation is active
  const isNavigating = ref(false)

  // Current cell ID for aria-activedescendant
  const activeCellId = computed(() => {
    return `grid-cell-${focusedRow.value}-${focusedCol.value}`
  })

  /**
   * Move focus to a specific cell
   */
  function focusCell(row: number, col: number) {
    const maxRow = rowCount() - 1
    const maxCol = columnCount - 1

    // Clamp values within bounds
    focusedRow.value = Math.max(0, Math.min(row, maxRow))
    focusedCol.value = Math.max(0, Math.min(col, maxCol))

    logAction('Grid navigation', { row: focusedRow.value, col: focusedCol.value })
  }

  /**
   * Move focus up one row
   */
  function moveUp() {
    if (focusedRow.value > 0) {
      focusCell(focusedRow.value - 1, focusedCol.value)
    }
  }

  /**
   * Move focus down one row
   */
  function moveDown() {
    if (focusedRow.value < rowCount() - 1) {
      focusCell(focusedRow.value + 1, focusedCol.value)
    }
  }

  /**
   * Move focus left one column
   */
  function moveLeft() {
    if (focusedCol.value > 0) {
      focusCell(focusedRow.value, focusedCol.value - 1)
    }
  }

  /**
   * Move focus right one column
   */
  function moveRight() {
    if (focusedCol.value < columnCount - 1) {
      focusCell(focusedRow.value, focusedCol.value + 1)
    }
  }

  /**
   * Handle keyboard events on the grid
   */
  function handleKeydown(event: KeyboardEvent) {
    // If in edit mode, only handle Escape and Tab
    if (isEditing()) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onEscape?.()
        return
      }
      // Let Tab work naturally within edit mode
      if (event.key === 'Tab') {
        return
      }
      // Let Enter save in edit mode
      if (event.key === 'Enter') {
        // Don't prevent default - let save handler work
        return
      }
      return
    }

    // Navigation mode key handling
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault()
        moveUp()
        break

      case 'ArrowDown':
        event.preventDefault()
        moveDown()
        break

      case 'ArrowLeft':
        event.preventDefault()
        moveLeft()
        break

      case 'ArrowRight':
        event.preventDefault()
        moveRight()
        break

      case 'Enter':
        event.preventDefault()
        onEnter?.(focusedRow.value, focusedCol.value)
        break

      case ' ': // Space
        event.preventDefault()
        onSpace?.(focusedRow.value, focusedCol.value)
        break

      case 'Escape':
        event.preventDefault()
        onEscape?.()
        break

      case 'Home':
        event.preventDefault()
        if (event.ctrlKey) {
          // Ctrl+Home: go to first cell
          focusCell(0, 0)
        } else {
          // Home: go to first cell in current row
          focusCell(focusedRow.value, 0)
        }
        break

      case 'End':
        event.preventDefault()
        if (event.ctrlKey) {
          // Ctrl+End: go to last cell
          focusCell(rowCount() - 1, columnCount - 1)
        } else {
          // End: go to last cell in current row
          focusCell(focusedRow.value, columnCount - 1)
        }
        break

      case 'PageUp':
        event.preventDefault()
        // Move up 5 rows
        focusCell(Math.max(0, focusedRow.value - 5), focusedCol.value)
        break

      case 'PageDown':
        event.preventDefault()
        // Move down 5 rows
        focusCell(Math.min(rowCount() - 1, focusedRow.value + 5), focusedCol.value)
        break
    }
  }

  /**
   * Start grid navigation mode
   */
  function startNavigation() {
    isNavigating.value = true
    logAction('Grid navigation started')
  }

  /**
   * Stop grid navigation mode
   */
  function stopNavigation() {
    isNavigating.value = false
    logAction('Grid navigation stopped')
  }

  /**
   * Get ARIA attributes for a cell
   */
  function getCellAttributes(rowIndex: number, colIndex: number) {
    const isFocused = focusedRow.value === rowIndex && focusedCol.value === colIndex

    return {
      id: `grid-cell-${rowIndex}-${colIndex}`,
      role: 'gridcell',
      'aria-rowindex': rowIndex + 1,
      'aria-colindex': colIndex + 1,
      'aria-selected': isFocused ? 'true' : undefined,
      tabindex: isFocused ? 0 : -1
    }
  }

  /**
   * Get ARIA attributes for a row
   */
  function getRowAttributes(rowIndex: number) {
    return {
      role: 'row',
      'aria-rowindex': rowIndex + 1
    }
  }

  /**
   * Get ARIA attributes for the grid container
   */
  function getGridAttributes() {
    return {
      role: 'grid',
      'aria-rowcount': rowCount(),
      'aria-colcount': columnCount,
      'aria-activedescendant': activeCellId.value
    }
  }

  return {
    // State
    focusedRow,
    focusedCol,
    isNavigating,
    activeCellId,

    // Navigation methods
    focusCell,
    moveUp,
    moveDown,
    moveLeft,
    moveRight,

    // Event handlers
    handleKeydown,
    startNavigation,
    stopNavigation,

    // ARIA attribute helpers
    getCellAttributes,
    getRowAttributes,
    getGridAttributes
  }
}
