/**
 * Error Handler Utility
 * Feature: 003-correction-ui
 * Task: T014
 * Requirement: FR-012 (Graceful error handling)
 *
 * Converts Supabase/database errors to user-friendly messages
 */

import { logError } from './logger'

/**
 * Handle Supabase errors and return user-friendly message
 */
export function handleSupabaseError(error: any): string {
  // Log to console for debugging
  logError('Supabase error occurred', error)

  // Network/connection errors
  if (error.message?.includes('Failed to fetch') || error.message?.includes('fetch')) {
    return 'Unable to connect to database. Please check your internet connection and try again.'
  }

  if (error.message?.includes('NetworkError') || error.message?.includes('ECONNREFUSED')) {
    return 'Database connection failed. Please verify the Supabase URL is correct.'
  }

  // Authentication errors
  if (
    error.message?.includes('JWT') ||
    error.message?.includes('auth') ||
    error.message?.includes('apikey')
  ) {
    return 'Authentication failed. Please check SUPABASE_SERVICE_KEY in .env file.'
  }

  // PostgREST errors
  if (error.code === 'PGRST116') {
    return 'No data found matching your criteria.'
  }

  if (error.code === 'PGRST301') {
    return 'You do not have permission to perform this operation.'
  }

  if (error.code === '23505') {
    return 'This record already exists (duplicate key violation).'
  }

  if (error.code === '23503') {
    return 'Cannot complete operation: referenced data does not exist.'
  }

  // PostgreSQL errors
  if (error.code === '23514') {
    return 'Invalid value: does not meet database constraints.'
  }

  if (error.code?.startsWith('23')) {
    return 'Database constraint violation. Please check your input.'
  }

  if (error.code?.startsWith('42')) {
    return 'Database query error. Please contact support.'
  }

  // Timeout errors
  if (error.message?.includes('timeout') || error.message?.includes('ETIMEDOUT')) {
    return 'Request timed out. The database may be slow or unavailable.'
  }

  // Generic fallback
  return error.message || 'An unexpected error occurred. Please try again.'
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: any): boolean {
  const retryableCodes = [
    'Failed to fetch',
    'NetworkError',
    'timeout',
    'ETIMEDOUT',
    'ECONNREFUSED',
    '503', // Service unavailable
    '504', // Gateway timeout
    '429', // Too many requests
  ]

  const errorString = JSON.stringify(error).toLowerCase()

  return retryableCodes.some(code => errorString.includes(code.toLowerCase()))
}
