/**
 * Logger Service
 * Feature: 003-correction-ui
 * Task: T011
 * Requirement: FR-021 (Browser console logging)
 *
 * Structured logging to browser console for debugging
 */

export interface LogContext {
  [key: string]: any
}

/**
 * Log error to browser console
 */
export function logError(message: string, error: Error | unknown, context?: LogContext): void {
  console.error(`[ERROR] ${message}`, {
    error,
    context,
    timestamp: new Date().toISOString(),
  })
}

/**
 * Log warning to browser console
 */
export function logWarn(message: string, context?: LogContext): void {
  console.warn(`[WARN] ${message}`, {
    context,
    timestamp: new Date().toISOString(),
  })
}

/**
 * Log info message to browser console
 */
export function logInfo(message: string, context?: LogContext): void {
  console.info(`[INFO] ${message}`, {
    context,
    timestamp: new Date().toISOString(),
  })
}

/**
 * Log user action to browser console
 * Used for debugging workflow and user behavior
 */
export function logAction(action: string, details?: LogContext): void {
  console.log(`[ACTION] ${action}`, {
    details,
    timestamp: new Date().toISOString(),
  })
}

/**
 * Performance monitoring (T092)
 * Tracks operation timing for performance analysis
 */

const performanceMarks = new Map<string, number>()

/**
 * Start a performance measurement
 */
export function perfStart(label: string): void {
  performanceMarks.set(label, performance.now())
  if (import.meta.env.DEV) {
    console.debug(`[PERF] Started: ${label}`)
  }
}

/**
 * End a performance measurement and log the duration
 */
export function perfEnd(label: string, context?: LogContext): number {
  const startTime = performanceMarks.get(label)
  if (startTime === undefined) {
    console.warn(`[PERF] No start mark found for: ${label}`)
    return -1
  }

  const duration = performance.now() - startTime
  performanceMarks.delete(label)

  console.log(`[PERF] ${label}: ${duration.toFixed(2)}ms`, {
    duration,
    context,
    timestamp: new Date().toISOString(),
  })

  // Warn if operation is slow (>1s)
  if (duration > 1000) {
    console.warn(`[PERF] Slow operation detected: ${label} took ${duration.toFixed(2)}ms`)
  }

  return duration
}

/**
 * Measure an async operation's performance
 */
export async function perfMeasure<T>(
  label: string,
  operation: () => Promise<T>,
  context?: LogContext
): Promise<T> {
  perfStart(label)
  try {
    const result = await operation()
    perfEnd(label, context)
    return result
  } catch (error) {
    perfEnd(label, { ...context, error: true })
    throw error
  }
}

/**
 * Log page/component render performance
 */
export function logRender(componentName: string, renderTime?: number): void {
  if (import.meta.env.DEV) {
    console.log(`[RENDER] ${componentName}`, {
      renderTime: renderTime !== undefined ? `${renderTime.toFixed(2)}ms` : 'mounted',
      timestamp: new Date().toISOString(),
    })
  }
}

// Export as default object for convenience
export default {
  error: logError,
  warn: logWarn,
  info: logInfo,
  action: logAction,
  perfStart,
  perfEnd,
  perfMeasure,
  logRender,
}
