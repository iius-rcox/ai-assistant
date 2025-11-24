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
    timestamp: new Date().toISOString()
  })
}

/**
 * Log warning to browser console
 */
export function logWarn(message: string, context?: LogContext): void {
  console.warn(`[WARN] ${message}`, {
    context,
    timestamp: new Date().toISOString()
  })
}

/**
 * Log info message to browser console
 */
export function logInfo(message: string, context?: LogContext): void {
  console.info(`[INFO] ${message}`, {
    context,
    timestamp: new Date().toISOString()
  })
}

/**
 * Log user action to browser console
 * Used for debugging workflow and user behavior
 */
export function logAction(action: string, details?: LogContext): void {
  console.log(`[ACTION] ${action}`, {
    details,
    timestamp: new Date().toISOString()
  })
}

// Export as default object for convenience
export default {
  error: logError,
  warn: logWarn,
  info: logInfo,
  action: logAction
}
