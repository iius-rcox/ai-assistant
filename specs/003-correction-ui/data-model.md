# Data Model: Email Classification Correction UI

**Feature Branch**: `003-correction-ui`
**Date**: 2025-11-22
**Database**: Supabase PostgreSQL (project: xmziovusqlmgygcrgyqt)

---

## Purpose

This document defines the TypeScript data models for the correction UI frontend. These models map to the existing Supabase database schema created by feature `001-email-classification-mvp`. No new database tables are required - the UI reads from and writes to existing tables.

---

## Database Connection

### Supabase Client Configuration

```typescript
// src/services/supabase.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey)
```

### Environment Variables

```bash
# .env (excluded from git)
VITE_SUPABASE_URL=https://xmziovusqlmgygcrgyqt.supabase.co
VITE_SUPABASE_SERVICE_KEY=eyJhbGci...
```

---

## TypeScript Type Generation

Types are generated from the Supabase database schema:

```bash
# Generate types from database
supabase gen types typescript --project-id xmziovusqlmgygcrgyqt > src/types/database.types.ts
```

This creates type-safe interfaces for all tables, including:
- `emails`
- `classifications`
- `correction_logs`
- `email_actions`
- `notifications`

---

## Frontend Data Models

### 1. Classification (Primary Entity)

Represents an email's AI classification with correction tracking.

```typescript
// src/types/models.ts
import type { Database } from './database.types'

export type Classification = Database['public']['Tables']['classifications']['Row']

// Derived model with joined email data (for list view)
export interface ClassificationWithEmail extends Classification {
  email: {
    id: bigint
    subject: string | null
    sender: string | null
    body: string | null
    received_at: string | null
  }
}

// Form model (for inline editing)
export interface ClassificationEditForm {
  id: bigint
  category: 'KIDS' | 'ROBYN' | 'WORK' | 'FINANCIAL' | 'SHOPPING' | 'OTHER'
  urgency: 'HIGH' | 'MEDIUM' | 'LOW'
  action: 'FYI' | 'RESPOND' | 'TASK' | 'PAYMENT' | 'CALENDAR' | 'NONE'
  correction_reason?: string | null
}
```

**Database Table**: `classifications`

**Fields**:
- `id`: bigserial PRIMARY KEY
- `email_id`: bigint (foreign key → emails.id)
- `category`: text (enum)
- `urgency`: text (enum)
- `action`: text (enum)
- `confidence_score`: decimal(3,2)
- `extracted_names`: jsonb
- `extracted_dates`: jsonb
- `extracted_amounts`: jsonb
- `classified_timestamp`: timestamptz
- `original_category`: text (preserved on first correction)
- `original_urgency`: text
- `original_action`: text
- `corrected_timestamp`: timestamptz
- `corrected_by`: text
- `correction_reason`: text (optional notes)
- `created_at`: timestamptz
- `updated_at`: timestamptz

**Relationships**:
- Many-to-one with `emails` (via `email_id`)
- One-to-many with `correction_logs` (via `email_id`)

**Business Rules**:
- Unique constraint on `email_id` (one classification per email)
- Enum constraints enforce valid category/urgency/action values
- Database trigger `log_classification_correction` fires on UPDATE to populate `correction_logs`

---

### 2. Email (Related Entity)

Represents the original email content.

```typescript
export type Email = Database['public']['Tables']['emails']['Row']
```

**Database Table**: `emails`

**Fields**:
- `id`: bigserial PRIMARY KEY
- `message_id`: text UNIQUE (Gmail message ID)
- `subject`: text
- `sender`: text
- `body`: text
- `received_at`: timestamptz
- `created_at`: timestamptz

**Relationships**:
- One-to-one with `classifications` (via classifications.email_id)

**UI Usage**:
- Display in detail view for context when correcting
- Subject/sender shown in list view (via join)
- Body truncated to 2,000 chars with "Show More" expansion

---

### 3. CorrectionLog (Audit Trail)

Represents individual field corrections (auto-created by database trigger).

```typescript
export type CorrectionLog = Database['public']['Tables']['correction_logs']['Row']
```

**Database Table**: `correction_logs`

**Fields**:
- `id`: bigserial PRIMARY KEY
- `email_id`: bigint (foreign key → emails.id)
- `field_name`: text (enum: CATEGORY, URGENCY, ACTION)
- `original_value`: text
- `corrected_value`: text
- `correction_timestamp`: timestamptz
- `corrected_by`: text
- `created_at`: timestamptz

**Relationships**:
- Many-to-one with `emails` (via `email_id`)

**UI Usage**:
- Read-only for analytics (P3: History page)
- Not directly editable by UI
- Populated automatically via database trigger when `classifications` table is updated

---

### 4. CorrectionPattern (Derived Aggregation)

Represents correction frequency patterns for analytics.

```typescript
export interface CorrectionPattern {
  field_name: 'CATEGORY' | 'URGENCY' | 'ACTION'
  original_value: string
  corrected_value: string
  occurrence_count: number
  example_emails: {
    email_id: bigint
    subject: string
    sender: string
  }[]
}
```

**Database Source**: Aggregation query on `correction_logs` table

**SQL Query**:
```sql
SELECT
  field_name,
  original_value,
  corrected_value,
  COUNT(*) as occurrence_count
FROM correction_logs
GROUP BY field_name, original_value, corrected_value
ORDER BY occurrence_count DESC
LIMIT 20;
```

**UI Usage**:
- P3: Analytics dashboard
- Display most frequent correction patterns (e.g., "SHOPPING → WORK: 15 times")
- Clickable to show example emails involved in pattern

---

## API Operations (Supabase Queries)

### List Classifications (Paginated)

```typescript
// src/services/classificationService.ts
import { supabase } from './supabase'

export async function listClassifications(params: {
  page: number
  pageSize: number
  filters?: {
    confidenceMin?: number
    confidenceMax?: number
    category?: string[]
    corrected?: boolean
    dateFrom?: string
    dateTo?: string
  }
  sortBy?: string
  sortDir?: 'asc' | 'desc'
}) {
  const { page, pageSize, filters, sortBy = 'classified_timestamp', sortDir = 'desc' } = params

  let query = supabase
    .from('classifications')
    .select(`
      *,
      email:emails (
        id,
        subject,
        sender,
        body,
        received_at
      )
    `, { count: 'exact' })

  // Apply filters
  if (filters?.confidenceMin !== undefined) {
    query = query.gte('confidence_score', filters.confidenceMin)
  }
  if (filters?.confidenceMax !== undefined) {
    query = query.lte('confidence_score', filters.confidenceMax)
  }
  if (filters?.category && filters.category.length > 0) {
    query = query.in('category', filters.category)
  }
  if (filters?.corrected === true) {
    query = query.not('corrected_timestamp', 'is', null)
  } else if (filters?.corrected === false) {
    query = query.is('corrected_timestamp', null)
  }
  if (filters?.dateFrom) {
    query = query.gte('classified_timestamp', filters.dateFrom)
  }
  if (filters?.dateTo) {
    query = query.lte('classified_timestamp', filters.dateTo)
  }

  // Apply sorting and pagination
  query = query.order(sortBy, { ascending: sortDir === 'asc' })
  const start = (page - 1) * pageSize
  const end = start + pageSize - 1
  query = query.range(start, end)

  const { data, error, count } = await query

  if (error) throw error

  return {
    classifications: data as ClassificationWithEmail[],
    totalCount: count || 0,
    pageCount: Math.ceil((count || 0) / pageSize)
  }
}
```

### Get Classification Detail

```typescript
export async function getClassification(id: bigint) {
  const { data, error } = await supabase
    .from('classifications')
    .select(`
      *,
      email:emails (*)
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data as ClassificationWithEmail
}
```

### Update Classification (Save Correction)

```typescript
export async function updateClassification(
  id: bigint,
  updates: ClassificationEditForm
) {
  const { data, error } = await supabase
    .from('classifications')
    .update({
      category: updates.category,
      urgency: updates.urgency,
      action: updates.action,
      correction_reason: updates.correction_reason,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  // Database trigger `log_classification_correction` automatically:
  // 1. Populates original_category/urgency/action if first correction
  // 2. Sets corrected_timestamp and corrected_by
  // 3. Inserts entries into correction_logs table

  return data as Classification
}
```

### Get Correction Statistics (Analytics)

```typescript
export async function getCorrectionStatistics() {
  const { data: patterns, error: patternsError } = await supabase
    .rpc('get_correction_patterns')  // Custom database function (optional)
    .limit(20)

  if (patternsError) {
    // Fallback to direct query if RPC not available
    const { data, error } = await supabase
      .from('correction_logs')
      .select('field_name, original_value, corrected_value')

    if (error) throw error

    // Group by pattern in JS
    const grouped = data.reduce((acc, log) => {
      const key = `${log.field_name}:${log.original_value}->${log.corrected_value}`
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(grouped)
      .map(([key, count]) => {
        const [field_name, transition] = key.split(':')
        const [original_value, corrected_value] = transition.split('->')
        return { field_name, original_value, corrected_value, occurrence_count: count }
      })
      .sort((a, b) => b.occurrence_count - a.occurrence_count)
      .slice(0, 20)
  }

  return patterns
}

export async function getCorrectionRate() {
  const { count: totalClassifications, error: totalError } = await supabase
    .from('classifications')
    .select('*', { count: 'exact', head: true })

  if (totalError) throw totalError

  const { count: correctedCount, error: correctedError } = await supabase
    .from('classifications')
    .select('*', { count: 'exact', head: true })
    .not('corrected_timestamp', 'is', null)

  if (correctedError) throw correctedError

  return {
    total: totalClassifications || 0,
    corrected: correctedCount || 0,
    rate: (correctedCount || 0) / (totalClassifications || 1)
  }
}
```

---

## State Management

### Pinia Store (Global State)

```typescript
// src/stores/classificationStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ClassificationWithEmail } from '@/types/models'
import * as classificationService from '@/services/classificationService'

export const useClassificationStore = defineStore('classification', () => {
  // State
  const classifications = ref<ClassificationWithEmail[]>([])
  const totalCount = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(20)
  const isLoading = ref(false)
  const error = ref<Error | null>(null)

  // Getters
  const pageCount = computed(() => Math.ceil(totalCount.value / pageSize.value))

  // Actions
  async function fetchClassifications(filters?: any) {
    isLoading.value = true
    error.value = null

    try {
      const result = await classificationService.listClassifications({
        page: currentPage.value,
        pageSize: pageSize.value,
        filters
      })

      classifications.value = result.classifications
      totalCount.value = result.totalCount
    } catch (e) {
      error.value = e as Error
      console.error('Failed to fetch classifications:', e)
    } finally {
      isLoading.value = false
    }
  }

  async function updateClassification(id: bigint, updates: ClassificationEditForm) {
    try {
      const updated = await classificationService.updateClassification(id, updates)

      // Update local state
      const index = classifications.value.findIndex(c => c.id === id)
      if (index !== -1) {
        classifications.value[index] = { ...classifications.value[index], ...updated }
      }

      console.log('Classification updated:', { id, updates })
      return updated
    } catch (e) {
      error.value = e as Error
      console.error('Failed to update classification:', e)
      throw e
    }
  }

  return {
    classifications,
    totalCount,
    currentPage,
    pageSize,
    isLoading,
    error,
    pageCount,
    fetchClassifications,
    updateClassification
  }
})
```

---

## Data Validation

### Enum Constants

```typescript
// src/types/enums.ts
export const CATEGORIES = [
  'KIDS',
  'ROBYN',
  'WORK',
  'FINANCIAL',
  'SHOPPING',
  'OTHER'
] as const

export const URGENCY_LEVELS = [
  'HIGH',
  'MEDIUM',
  'LOW'
] as const

export const ACTION_TYPES = [
  'FYI',
  'RESPOND',
  'TASK',
  'PAYMENT',
  'CALENDAR',
  'NONE'
] as const

export type Category = typeof CATEGORIES[number]
export type UrgencyLevel = typeof URGENCY_LEVELS[number]
export type ActionType = typeof ACTION_TYPES[number]
```

### Form Validation

```typescript
export function validateClassificationEdit(form: ClassificationEditForm): string[] {
  const errors: string[] = []

  if (!CATEGORIES.includes(form.category)) {
    errors.push(`Invalid category: ${form.category}`)
  }

  if (!URGENCY_LEVELS.includes(form.urgency)) {
    errors.push(`Invalid urgency: ${form.urgency}`)
  }

  if (!ACTION_TYPES.includes(form.action)) {
    errors.push(`Invalid action: ${form.action}`)
  }

  if (form.correction_reason && form.correction_reason.length > 500) {
    errors.push('Correction reason must be under 500 characters')
  }

  return errors
}
```

---

## Performance Optimizations

### 1. Server-Side Pagination

- Load 20/50/100 records per page (user-selectable)
- Supabase `.range()` method for efficient offset-based pagination
- Total count via `{ count: 'exact' }` option

### 2. Chart Data Aggregation

Pre-aggregate correction patterns in SQL to avoid large data transfers:

```sql
-- Correction rate over last 30 days
SELECT
  DATE_TRUNC('day', correction_timestamp) as date,
  COUNT(*) as correction_count
FROM correction_logs
WHERE correction_timestamp > NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', correction_timestamp)
ORDER BY date;
```

### 3. Reactive Updates

Vue 3's reactivity system automatically updates UI when Pinia store changes, eliminating need for manual re-fetching after corrections.

---

## Error Handling

### Database Connection Errors

```typescript
// src/utils/errorHandler.ts
export function handleSupabaseError(error: any): string {
  console.error('Supabase error:', error)

  if (error.message?.includes('Failed to fetch')) {
    return 'Unable to connect to database. Check your internet connection and try again.'
  }

  if (error.message?.includes('JWT')) {
    return 'Authentication failed. Check SUPABASE_SERVICE_KEY in .env file.'
  }

  if (error.code === 'PGRST116') {
    return 'No data found matching your criteria.'
  }

  return error.message || 'An unexpected error occurred'
}
```

---

## Summary

This data model defines:

1. **TypeScript Types**: Generated from Supabase schema for type-safe database operations
2. **Frontend Models**: Classification, Email, CorrectionLog, CorrectionPattern
3. **API Operations**: List, get, update, and analytics queries using Supabase client
4. **State Management**: Pinia store for global classification state
5. **Validation**: Enum constants and form validation functions
6. **Performance**: Server-side pagination, SQL aggregation for charts
7. **Error Handling**: User-friendly error messages for database failures

**No database migrations required** - all tables exist from `001-email-classification-mvp` feature.
