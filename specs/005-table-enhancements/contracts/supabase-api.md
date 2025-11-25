# Supabase API Contracts

**Feature**: 005-table-enhancements
**Date**: 2025-11-24

## Overview

This document defines the Supabase API contracts for the table enhancements feature. Since Supabase uses a REST/PostgREST pattern, contracts are defined as service method signatures with corresponding Supabase query patterns.

---

## Search Service

### searchEmailsFullText

Performs full-text search on emails table using PostgreSQL's text search capabilities.

**Method Signature**:
```typescript
async function searchEmailsFullText(query: string): Promise<Email[]>
```

**Supabase Query**:
```typescript
const { data, error } = await supabase
  .rpc('search_emails', { search_query: query })
```

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| search_query | string | Yes | Search terms (min 2 chars) |

**Response**:
```typescript
interface Email {
  id: number
  message_id: string
  subject: string | null
  sender: string | null
  body: string | null
  received_at: string
  created_at: string
}
```

**Error Codes**:
| Code | Description |
|------|-------------|
| 400 | Invalid search query (too short/long) |
| 500 | Database error |

---

### searchClassificationsWithEmails

Fetches classifications with joined email data, filtered by search.

**Method Signature**:
```typescript
async function searchClassificationsWithEmails(
  query: string,
  options: SearchOptions
): Promise<ClassificationWithEmail[]>
```

**Supabase Query**:
```typescript
const { data, error } = await supabase
  .from('email_classifications')
  .select(`
    id,
    category,
    urgency,
    action,
    confidence,
    corrected_category,
    corrected_urgency,
    corrected_action,
    version,
    created_at,
    updated_at,
    email:emails!inner(
      id,
      subject,
      sender,
      body,
      received_at
    )
  `)
  .or(`email.subject.ilike.%${query}%,email.sender.ilike.%${query}%`)
  .order(options.sortColumn, { ascending: options.sortAsc })
  .range(options.offset, options.offset + options.limit - 1)
```

---

## Classification Service Extensions

### bulkUpdateClassifications

Updates multiple classifications in a single operation.

**Method Signature**:
```typescript
async function bulkUpdateClassifications(
  ids: number[],
  updates: Partial<ClassificationUpdate>
): Promise<BulkUpdateResult>
```

**Supabase Query**:
```typescript
const { data, error } = await supabase
  .from('email_classifications')
  .update({
    corrected_category: updates.category,
    corrected_urgency: updates.urgency,
    corrected_action: updates.action,
    updated_at: new Date().toISOString()
  })
  .in('id', ids)
  .select()
```

**Request Body**:
```typescript
interface ClassificationUpdate {
  category?: string
  urgency?: string
  action?: string
}
```

**Response**:
```typescript
interface BulkUpdateResult {
  updated: ClassificationWithEmail[]
  count: number
}
```

**Constraints**:
- Maximum 100 IDs per request
- Optimistic locking via `version` field (optional)

---

### getClassificationWithDetails

Fetches a single classification with full email body and correction history.

**Method Signature**:
```typescript
async function getClassificationWithDetails(
  id: number
): Promise<ClassificationDetails>
```

**Supabase Query**:
```typescript
// Get classification with full email
const { data: classification } = await supabase
  .from('email_classifications')
  .select(`
    *,
    email:emails(*)
  `)
  .eq('id', id)
  .single()

// Get correction history (if correction_log table exists)
const { data: history } = await supabase
  .from('correction_log')
  .select('*')
  .eq('classification_id', id)
  .order('created_at', { ascending: false })
```

**Response**:
```typescript
interface ClassificationDetails {
  classification: ClassificationWithEmail
  emailBody: string | null
  correctionHistory: CorrectionHistoryEntry[]
}
```

---

### getClassificationsSorted

Fetches paginated classifications with sorting.

**Method Signature**:
```typescript
async function getClassificationsSorted(
  options: PaginationOptions & SortOptions
): Promise<PaginatedResult<ClassificationWithEmail>>
```

**Supabase Query**:
```typescript
const { data, count, error } = await supabase
  .from('email_classifications')
  .select(`
    *,
    email:emails(id, subject, sender, received_at)
  `, { count: 'exact' })
  .order(options.sortColumn, {
    ascending: options.sortDirection === 'asc',
    nullsFirst: false
  })
  .range(options.offset, options.offset + options.limit - 1)
```

**Request Parameters**:
```typescript
interface PaginationOptions {
  offset: number
  limit: number
}

interface SortOptions {
  sortColumn: SortableColumn
  sortDirection: 'asc' | 'desc'
}
```

**Response**:
```typescript
interface PaginatedResult<T> {
  data: T[]
  count: number
  hasMore: boolean
}
```

---

## Analytics Service Extensions

### getCorrectionTrends

Fetches correction statistics grouped by date.

**Method Signature**:
```typescript
async function getCorrectionTrends(
  dateRange: DateRange
): Promise<CorrectionsOverTime[]>
```

**Supabase Query**:
```typescript
const { data, error } = await supabase
  .from('email_classifications')
  .select('created_at, corrected_category')
  .gte('created_at', dateRange.start)
  .lte('created_at', dateRange.end)
```

**Post-Processing** (client-side aggregation):
```typescript
function aggregateByDate(data: any[]): CorrectionsOverTime[] {
  const grouped = groupBy(data, d => d.created_at.split('T')[0])
  return Object.entries(grouped).map(([date, items]) => ({
    date,
    total: items.length,
    corrections: items.filter(i => i.corrected_category !== null).length,
    accuracy: calculateAccuracy(items)
  }))
}
```

---

### getCategoryDistribution

Fetches category breakdown statistics.

**Method Signature**:
```typescript
async function getCategoryDistribution(): Promise<CategoryDistribution[]>
```

**Supabase Query**:
```typescript
const { data, error } = await supabase
  .from('email_classifications')
  .select('category')

// Client-side aggregation
const distribution = countBy(data, 'category')
```

---

## RPC Functions

### search_emails (PostgreSQL Function)

**Definition** (to be added to Supabase):
```sql
CREATE OR REPLACE FUNCTION search_emails(search_query TEXT)
RETURNS SETOF emails AS $$
  SELECT * FROM emails
  WHERE to_tsvector('english',
    coalesce(subject, '') || ' ' ||
    coalesce(sender, '') || ' ' ||
    coalesce(body, ''))
  @@ plainto_tsquery('english', search_query)
  ORDER BY ts_rank(
    to_tsvector('english',
      coalesce(subject, '') || ' ' ||
      coalesce(sender, '') || ' ' ||
      coalesce(body, '')),
    plainto_tsquery('english', search_query)
  ) DESC
  LIMIT 1000;
$$ LANGUAGE SQL STABLE;
```

---

## Error Handling Contract

All service methods follow this error handling pattern:

```typescript
interface ServiceError {
  code: string
  message: string
  details?: unknown
}

type ServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: ServiceError }

// Usage
async function serviceMethod(): Promise<ServiceResult<Data>> {
  try {
    const { data, error } = await supabase.from('table').select()
    if (error) {
      return {
        success: false,
        error: { code: error.code, message: error.message }
      }
    }
    return { success: true, data }
  } catch (e) {
    return {
      success: false,
      error: { code: 'UNKNOWN', message: 'Unexpected error' }
    }
  }
}
```

---

## Rate Limiting

| Operation | Rate Limit | Notes |
|-----------|------------|-------|
| Search | 10/second | Debounced on client |
| Bulk Update | 5/second | Max 100 items per request |
| Analytics | 2/second | Cached for 5 minutes |
| Standard CRUD | 50/second | Supabase default |
