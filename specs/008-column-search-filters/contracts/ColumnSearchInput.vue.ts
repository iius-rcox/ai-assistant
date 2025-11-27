/**
 * ColumnSearchInput Component Contract
 * Feature: 008-column-search-filters
 *
 * This file defines the props, emits, and slots for the ColumnSearchInput component.
 * Implementation must conform to this contract.
 */

// ===== Props Interface =====

export interface ColumnSearchInputProps {
  /**
   * Current filter value (v-model)
   * @required
   */
  modelValue: string

  /**
   * Placeholder text when empty
   * @default 'Filter...'
   */
  placeholder?: string

  /**
   * Column label for accessibility
   * @required for aria-label
   */
  columnLabel: string

  /**
   * Disable the input
   * @default false
   */
  disabled?: boolean

  /**
   * Show loading spinner
   * @default false
   */
  isLoading?: boolean

  /**
   * Visual indicator that filter is active
   * @default false
   */
  isActive?: boolean

  /**
   * Compact mode (smaller padding/height)
   * @default true
   */
  compact?: boolean
}

// ===== Emits Interface =====

export interface ColumnSearchInputEmits {
  /**
   * Emitted when value changes (v-model)
   * Debounced internally
   */
  'update:modelValue': [value: string]

  /**
   * Emitted when clear button clicked
   */
  'clear': []

  /**
   * Emitted on input focus
   */
  'focus': []

  /**
   * Emitted on input blur
   */
  'blur': []
}

// ===== Exposed Methods =====

export interface ColumnSearchInputExposed {
  /**
   * Focus the input element
   */
  focus: () => void

  /**
   * Blur the input element
   */
  blur: () => void

  /**
   * Clear the input value
   */
  clear: () => void
}

// ===== Component Specification =====

/**
 * ColumnSearchInput Component
 *
 * A compact search input designed for column header filtering.
 * Provides debounced input, clear button, and active state indicator.
 *
 * ## Usage
 *
 * ```vue
 * <ColumnSearchInput
 *   v-model="filters.subject"
 *   column-label="Subject"
 *   placeholder="Filter subject..."
 *   :is-active="filters.subject.length > 0"
 *   @clear="clearFilter('subject')"
 * />
 * ```
 *
 * ## Accessibility
 *
 * - Input has role="searchbox"
 * - aria-label set to "Filter by {columnLabel}"
 * - Clear button has aria-label="Clear filter"
 * - Focus indicator visible per theme
 *
 * ## Mobile Behavior
 *
 * - Minimum touch target 44x44px
 * - Clear button sized appropriately
 * - Input fills available column width
 *
 * ## Styling
 *
 * - Uses M3 design tokens
 * - Active state: primary border, primary-container background
 * - Compact height: ~32px
 */
export const ComponentSpec = {
  name: 'ColumnSearchInput',
  inheritAttrs: false
}

// ===== CSS Custom Properties =====

/**
 * Customizable CSS properties for theming
 */
export const CSSCustomProperties = {
  '--column-filter-height': '32px',
  '--column-filter-padding': '4px 8px',
  '--column-filter-font-size': 'var(--md-sys-typescale-body-small-size)',
  '--column-filter-border-radius': 'var(--md-sys-shape-corner-small)',
  '--column-filter-icon-size': '14px'
}
