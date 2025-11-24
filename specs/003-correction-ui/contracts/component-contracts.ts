/**
 * Component Contracts: Vue Component Prop and Event Types
 * Feature: 003-correction-ui
 * Date: 2025-11-22
 *
 * These interfaces define the expected props, emits, and slots
 * for each Vue component in the correction UI.
 */

import type {
  ClassificationWithEmail,
  Category,
  UrgencyLevel,
  ActionType,
  CorrectionPattern,
  CorrectionTimepoint
} from './api-contracts'

// ============================================================================
// ClassificationList Component (P1: Main list view)
// ============================================================================

export interface ClassificationListProps {
  classifications: ClassificationWithEmail[]
  currentPage: number
  pageSize: number
  totalCount: number
  isLoading?: boolean
  error?: Error | null
}

export interface ClassificationListEmits {
  'page-change': (page: number) => void
  'page-size-change': (size: number) => void
  'sort-change': (sortBy: string, sortDir: 'asc' | 'desc') => void
  'classification-click': (id: number) => void
}

export interface ClassificationListSlots {
  empty?: () => any           // Custom empty state
  loading?: () => any         // Custom loading spinner
  error?: (props: { error: Error }) => any  // Custom error display
}

// ============================================================================
// ClassificationDetail Component (P1: Detail view with inline editing)
// ============================================================================

export interface ClassificationDetailProps {
  classificationId: number
  classification?: ClassificationWithEmail | null
  isLoading?: boolean
  error?: Error | null
}

export interface ClassificationDetailEmits {
  'save': (updates: {
    category: Category
    urgency: UrgencyLevel
    action: ActionType
    correction_reason?: string
  }) => void
  'cancel': () => void
  'back-to-list': () => void
}

// ============================================================================
// Filters Component (P2: Filter controls)
// ============================================================================

export interface FiltersProps {
  filters: {
    confidenceMin?: number
    confidenceMax?: number
    category?: Category[]
    corrected?: boolean
    dateFrom?: string
    dateTo?: string
  }
}

export interface FiltersEmits {
  'update:filters': (filters: FiltersProps['filters']) => void
  'clear-filters': () => void
}

// ============================================================================
// AnalyticsDashboard Component (P3: Correction history and charts)
// ============================================================================

export interface AnalyticsDashboardProps {
  summary?: {
    totalCorrections: number
    correctionRate: number
    mostCorrectedCategory: string
  }
  patterns?: CorrectionPattern[]
  timeline?: CorrectionTimepoint[]
  isLoading?: boolean
  error?: Error | null
}

export interface AnalyticsDashboardEmits {
  'refresh': () => void
  'pattern-click': (pattern: CorrectionPattern) => void
}

// ============================================================================
// Shared Components
// ============================================================================

/**
 * Dropdown Component (category/urgency/action selectors)
 */
export interface DropdownProps {
  modelValue: string
  options: readonly string[]
  label?: string
  placeholder?: string
  disabled?: boolean
  error?: string
}

export interface DropdownEmits {
  'update:modelValue': (value: string) => void
}

/**
 * ConfidenceSlider Component (filter by confidence score)
 */
export interface ConfidenceSliderProps {
  min: number    // 0.0-1.0
  max: number    // 0.0-1.0
  step?: number  // Default: 0.1
  label?: string
}

export interface ConfidenceSliderEmits {
  'update:min': (value: number) => void
  'update:max': (value: number) => void
}

/**
 * DateRangePicker Component (filter by date)
 */
export interface DateRangePickerProps {
  dateFrom?: string  // ISO date string
  dateTo?: string    // ISO date string
  label?: string
}

export interface DateRangePickerEmits {
  'update:dateFrom': (value: string) => void
  'update:dateTo': (value: string) => void
}

/**
 * CorrectionBadge Component (visual indicator for corrected classifications)
 */
export interface CorrectionBadgeProps {
  correctedTimestamp?: string | null
  correctedBy?: string | null
  variant?: 'small' | 'large'  // Display size
}

/**
 * ConfirmDialog Component (unsaved changes warning)
 */
export interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string  // Default: "Confirm"
  cancelText?: string   // Default: "Cancel"
  variant?: 'warning' | 'danger' | 'info'
}

export interface ConfirmDialogEmits {
  'confirm': () => void
  'cancel': () => void
  'update:isOpen': (value: boolean) => void
}

// ============================================================================
// Router Contracts
// ============================================================================

/**
 * Application Routes
 */
export interface RouteDefinition {
  path: string
  name: string
  component: any
  meta?: {
    title?: string
    requiresData?: boolean
  }
}

export const ROUTES: Record<string, RouteDefinition> = {
  LIST: {
    path: '/',
    name: 'classification-list',
    component: 'ClassificationList',
    meta: { title: 'Email Classifications' }
  },
  DETAIL: {
    path: '/classification/:id',
    name: 'classification-detail',
    component: 'ClassificationDetail',
    meta: { title: 'Edit Classification', requiresData: true }
  },
  ANALYTICS: {
    path: '/analytics',
    name: 'analytics-dashboard',
    component: 'AnalyticsDashboard',
    meta: { title: 'Correction History' }
  }
}

// ============================================================================
// Store Contracts (Pinia State Management)
// ============================================================================

/**
 * Classification Store State
 */
export interface ClassificationStoreState {
  classifications: ClassificationWithEmail[]
  totalCount: number
  currentPage: number
  pageSize: number
  filters: FiltersProps['filters']
  sortBy: string
  sortDir: 'asc' | 'desc'
  isLoading: boolean
  error: Error | null
}

/**
 * Classification Store Actions
 */
export interface ClassificationStoreActions {
  fetchClassifications(): Promise<void>
  refreshClassifications(): Promise<void>
  updateClassification(id: number, updates: any): Promise<void>
  setPage(page: number): void
  setPageSize(size: number): void
  setFilters(filters: FiltersProps['filters']): void
  clearFilters(): void
  setSorting(sortBy: string, sortDir: 'asc' | 'desc'): void
}

/**
 * Analytics Store State
 */
export interface AnalyticsStoreState {
  summary: AnalyticsDashboardProps['summary'] | null
  patterns: CorrectionPattern[]
  timeline: CorrectionTimepoint[]
  isLoading: boolean
  error: Error | null
}

/**
 * Analytics Store Actions
 */
export interface AnalyticsStoreActions {
  fetchStatistics(): Promise<void>
  refreshStatistics(): Promise<void>
  getPatternEmails(pattern: CorrectionPattern): Promise<any[]>
}
