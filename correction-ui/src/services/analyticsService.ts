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
