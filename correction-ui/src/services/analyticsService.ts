/**
 * Analytics Service
 * Feature: 003-correction-ui
 * Tasks: T058, T059, T060
 *
 * Business logic for correction analytics and statistics
 */

import { supabase } from './supabase'
import type { CorrectionPattern, CorrectionTimepoint, CorrectionStatistics } from '@/types/models'

/**
 * Get correction rate statistics
 * Task: T058
 */
export async function getCorrectionRate(): Promise<{
  total: number
  corrected: number
  rate: number
}> {
  // Total classifications
  const { count: totalCount, error: totalError } = await supabase
    .from('classifications')
    .select('*', { count: 'exact', head: true })

  if (totalError) throw totalError

  // Corrected classifications
  const { count: correctedCount, error: correctedError } = await supabase
    .from('classifications')
    .select('*', { count: 'exact', head: true })
    .not('corrected_timestamp', 'is', null)

  if (correctedError) throw correctedError

  return {
    total: totalCount || 0,
    corrected: correctedCount || 0,
    rate: (correctedCount || 0) / (totalCount || 1)
  }
}

/**
 * Get correction patterns (original→corrected frequencies)
 * Task: T059
 * Requirement: FR-009
 */
export async function getCorrectionPatterns(): Promise<CorrectionPattern[]> {
  const { data, error } = await supabase
    .from('correction_logs')
    .select('field_name, original_value, corrected_value, email_id')

  if (error) throw error

  if (!data || data.length === 0) {
    return []
  }

  // Aggregate patterns
  const patternMap = new Map<string, CorrectionPattern>()

  data.forEach((log: any) => {
    const key = `${log.field_name}:${log.original_value}→${log.corrected_value}`

    if (!patternMap.has(key)) {
      patternMap.set(key, {
        field_name: log.field_name as 'CATEGORY' | 'URGENCY' | 'ACTION',
        original_value: log.original_value,
        corrected_value: log.corrected_value,
        occurrence_count: 0,
        example_emails: []
      })
    }

    const pattern = patternMap.get(key)!
    pattern.occurrence_count++
  })

  // Convert to array and sort by frequency
  return Array.from(patternMap.values())
    .sort((a, b) => b.occurrence_count - a.occurrence_count)
    .slice(0, 20) // Top 20 patterns
}

/**
 * Get correction timeline (corrections per day/week)
 * Task: T060
 */
export async function getCorrectionTimeline(days: number = 56): Promise<CorrectionTimepoint[]> {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data, error } = await supabase
    .from('correction_logs')
    .select('correction_timestamp')
    .gte('correction_timestamp', startDate.toISOString())
    .order('correction_timestamp', { ascending: true })

  if (error) throw error

  if (!data || data.length === 0) {
    return []
  }

  // Group by date
  const dateMap = new Map<string, number>()

  data.forEach((log: any) => {
    const date = log.correction_timestamp.split('T')[0] // YYYY-MM-DD
    dateMap.set(date, (dateMap.get(date) || 0) + 1)
  })

  // Convert to array
  return Array.from(dateMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Get most corrected category
 */
export async function getMostCorrectedCategory(): Promise<string> {
  const { data, error } = await supabase
    .from('correction_logs')
    .select('original_value')
    .eq('field_name', 'CATEGORY')

  if (error) throw error

  if (!data || data.length === 0) {
    return 'None'
  }

  // Count by category
  const categoryCount = new Map<string, number>()

  data.forEach((log: any) => {
    categoryCount.set(log.original_value, (categoryCount.get(log.original_value) || 0) + 1)
  })

  // Find most frequent
  let maxCount = 0
  let mostCorrected = 'None'

  categoryCount.forEach((count, category) => {
    if (count > maxCount) {
      maxCount = count
      mostCorrected = category
    }
  })

  return mostCorrected
}

/**
 * Get complete correction statistics
 */
export async function getCorrectionStatistics(): Promise<CorrectionStatistics> {
  const [rateData, patterns, timeline, mostCorrected] = await Promise.all([
    getCorrectionRate(),
    getCorrectionPatterns(),
    getCorrectionTimeline(),
    getMostCorrectedCategory()
  ])

  return {
    summary: {
      totalCorrections: rateData.corrected,
      correctionRate: rateData.rate * 100, // Convert to percentage
      mostCorrectedCategory: mostCorrected
    },
    patterns,
    timeline
  }
}

/**
 * Get correction trends over time
 * Feature: 005-table-enhancements
 * Task: T080
 * Requirements: FR-040, FR-041
 */
export async function getCorrectionTrends(days: number = 30): Promise<{
  dates: string[]
  corrections: number[]
  classifications: number[]
  rates: number[]
}> {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  // Get corrections timeline
  const { data: corrections, error: corrError } = await supabase
    .from('correction_logs')
    .select('correction_timestamp')
    .gte('correction_timestamp', startDate.toISOString())

  if (corrError) throw corrError

  // Get classifications timeline
  const { data: classifications, error: classError } = await supabase
    .from('classifications')
    .select('classified_timestamp')
    .gte('classified_timestamp', startDate.toISOString())

  if (classError) throw classError

  // Group by date
  const dateMap = new Map<string, { corrections: number; classifications: number }>()

  // Initialize all dates in range
  for (let i = 0; i <= days; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    const dateStr = date.toISOString().split('T')[0] ?? ''
    if (dateStr) {
      dateMap.set(dateStr, { corrections: 0, classifications: 0 })
    }
  }

  // Count corrections
  corrections?.forEach((log: any) => {
    const date = log.correction_timestamp?.split('T')[0]
    if (date && dateMap.has(date)) {
      const entry = dateMap.get(date)!
      entry.corrections++
    }
  })

  // Count classifications
  classifications?.forEach((cls: any) => {
    const date = cls.classified_timestamp?.split('T')[0]
    if (date && dateMap.has(date)) {
      const entry = dateMap.get(date)!
      entry.classifications++
    }
  })

  // Convert to arrays
  const sortedDates = Array.from(dateMap.keys()).sort()

  return {
    dates: sortedDates,
    corrections: sortedDates.map(d => dateMap.get(d)!.corrections),
    classifications: sortedDates.map(d => dateMap.get(d)!.classifications),
    rates: sortedDates.map(d => {
      const entry = dateMap.get(d)!
      return entry.classifications > 0
        ? (entry.corrections / entry.classifications) * 100
        : 0
    })
  }
}

/**
 * Get category distribution
 * Feature: 005-table-enhancements
 * Task: T081
 * Requirements: FR-040, FR-042
 */
export async function getCategoryDistribution(): Promise<{
  categories: string[]
  counts: number[]
  percentages: number[]
}> {
  const { data, error } = await supabase
    .from('classifications')
    .select('category')

  if (error) throw error

  // Count by category
  const categoryCount = new Map<string, number>()
  const total = data?.length || 0

  data?.forEach((cls: any) => {
    const category = cls.category || 'OTHER'
    categoryCount.set(category, (categoryCount.get(category) || 0) + 1)
  })

  // Sort by count descending
  const sorted = Array.from(categoryCount.entries())
    .sort((a, b) => b[1] - a[1])

  return {
    categories: sorted.map(([cat]) => cat),
    counts: sorted.map(([, count]) => count),
    percentages: sorted.map(([, count]) => total > 0 ? (count / total) * 100 : 0)
  }
}

/**
 * Get accuracy trends over time
 * Feature: 005-table-enhancements
 * Task: T082
 * Requirements: FR-040, FR-043
 */
export async function getAccuracyTrends(days: number = 30): Promise<{
  dates: string[]
  accuracy: number[]
  totalPerDay: number[]
}> {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data, error } = await supabase
    .from('classifications')
    .select('classified_timestamp, corrected_timestamp')
    .gte('classified_timestamp', startDate.toISOString())

  if (error) throw error

  // Group by date
  const dateMap = new Map<string, { total: number; accurate: number }>()

  // Initialize all dates in range
  for (let i = 0; i <= days; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    const dateStr = date.toISOString().split('T')[0] ?? ''
    if (dateStr) {
      dateMap.set(dateStr, { total: 0, accurate: 0 })
    }
  }

  data?.forEach((cls: any) => {
    const date = cls.classified_timestamp?.split('T')[0]
    if (date && dateMap.has(date)) {
      const entry = dateMap.get(date)!
      entry.total++
      // If not corrected, it's considered accurate
      if (!cls.corrected_timestamp) {
        entry.accurate++
      }
    }
  })

  // Convert to arrays
  const sortedDates = Array.from(dateMap.keys()).sort()

  return {
    dates: sortedDates,
    accuracy: sortedDates.map(d => {
      const entry = dateMap.get(d)!
      return entry.total > 0 ? (entry.accurate / entry.total) * 100 : 100
    }),
    totalPerDay: sortedDates.map(d => dateMap.get(d)!.total)
  }
}

/**
 * Export analytics data as CSV
 * Feature: 005-table-enhancements
 * Task: T086
 * Requirements: FR-044
 */
export function exportAnalyticsCSV(data: {
  headers: string[]
  rows: (string | number)[][]
}, filename: string = 'analytics-export.csv'): void {
  // Create CSV content
  const csvContent = [
    data.headers.join(','),
    ...data.rows.map(row => row.join(','))
  ].join('\n')

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
