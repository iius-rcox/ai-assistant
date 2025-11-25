# Research: Email Classifications Table Enhancements

**Feature**: 005-table-enhancements
**Date**: 2025-11-24
**Status**: Complete

## Research Areas

This document consolidates research findings for the 11 feature areas in the table enhancements specification.

---

## 1. Real-Time Search Implementation

### Decision: Hybrid client/server search with 1,000 row threshold

### Rationale
- **Client-side filtering** is faster for small datasets (no network latency)
- **Supabase full-text search** scales better for large datasets and offloads computation
- The 1,000 row threshold balances memory usage vs. network overhead
- Debouncing at 300ms prevents excessive API calls while maintaining responsiveness

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| Always client-side | Memory issues at 36,500 rows; initial load too slow |
| Always server-side | Unnecessary network latency for small datasets |
| ElasticSearch | Over-engineered for single-user system; additional infrastructure |
| 500 row threshold | Too aggressive; most users will have <1,000 rows initially |

### Implementation Approach
```typescript
// searchService.ts pattern
const SEARCH_THRESHOLD = 1000

async function search(query: string, totalCount: number) {
  if (totalCount < SEARCH_THRESHOLD) {
    return clientSideFilter(query, cachedData)
  }
  return supabaseFullTextSearch(query)
}
```

### Supabase Full-Text Search Setup
- Enable `pg_trgm` extension for fuzzy matching
- Create GIN index on searchable columns: `subject`, `sender`, `body_preview`
- Use `to_tsvector` and `to_tsquery` for PostgreSQL full-text search

---

## 2. Column Sorting

### Decision: Multi-column sort with localStorage persistence

### Rationale
- Users expect Excel-like sorting behavior
- Persistence reduces friction on return visits
- VueUse `useStorage` provides reactive localStorage binding

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| Server-side sort only | Adds latency for small datasets; unnecessary API calls |
| No persistence | Poor UX; users must re-sort every visit |
| Cookie storage | Size limits; localStorage more appropriate |

### Implementation Approach
```typescript
// useSort.ts pattern
interface SortState {
  column: string
  direction: 'asc' | 'desc'
}

const sortState = useStorage<SortState>('table-sort', {
  column: 'created_at',
  direction: 'desc'
})
```

---

## 3. Bulk Actions

### Decision: Optimistic UI with per-item error handling

### Rationale
- Optimistic updates provide snappy UX
- Per-item error handling allows partial success (don't fail entire batch)
- Supabase batch operations via `in()` filter are efficient

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| All-or-nothing transactions | One failure rolls back all changes |
| Sequential API calls | Too slow for large selections |
| Background queue | Over-engineered for single-user sync operations |

### Implementation Approach
```typescript
// useBulkActions.ts pattern
async function bulkUpdateCategory(ids: number[], newCategory: string) {
  const results = await Promise.allSettled(
    ids.map(id => classificationService.update(id, { category: newCategory }))
  )
  const failures = results.filter(r => r.status === 'rejected')
  if (failures.length > 0) {
    showPartialFailureToast(failures)
  }
  return results
}
```

---

## 4. Expandable Row Details

### Decision: Inline expansion with lazy-loaded content

### Rationale
- Inline expansion keeps context visible (no modal context switch)
- Lazy loading prevents loading all email bodies upfront
- Correction history fetched on-demand reduces initial payload

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| Modal details | Loses table context; extra clicks to navigate |
| Side panel | Takes horizontal space; complex on mobile |
| Eager loading | Slow initial load; wastes bandwidth for unexpanded rows |

### Implementation Approach
```typescript
// useExpandableRows.ts pattern
const expandedRows = ref<Set<number>>(new Set())

async function toggleExpand(id: number) {
  if (expandedRows.value.has(id)) {
    expandedRows.value.delete(id)
  } else {
    expandedRows.value.add(id)
    await fetchEmailDetails(id) // Lazy load
  }
}
```

---

## 5. Keyboard Shortcuts

### Decision: Global shortcuts with context-aware behavior

### Rationale
- Builds on 004-inline-edit keyboard navigation
- Global shortcuts (/, ?) work from anywhere
- Row-specific shortcuts require table focus (prevents conflicts)

### Key Bindings
| Key | Context | Action |
|-----|---------|--------|
| `/` | Global | Focus search input |
| `?` | Global | Show shortcuts modal |
| `↑/↓` | Table focused | Navigate rows |
| `Enter` | Row focused | Expand/collapse row |
| `Space` | Row focused | Toggle selection |
| `Escape` | Any modal | Close modal |

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| VIM-style (j/k) | Less discoverable for general users |
| No shortcuts | Power users lose efficiency |
| Customizable shortcuts | Over-engineered; adds complexity |

### Implementation Approach
```typescript
// useKeyboardNavigation.ts with VueUse
import { onKeyStroke, useMagicKeys } from '@vueuse/core'

const { slash, shift_slash, escape } = useMagicKeys()

watch(slash, () => searchInput.value?.focus())
watch(shift_slash, () => showShortcutsModal.value = true)
```

---

## 6. Visual Confidence Indicators

### Decision: Progress bars with color + pattern for accessibility

### Rationale
- Progress bars are universally understood
- Color coding provides quick visual scanning
- Patterns/icons ensure color-blind accessibility (WCAG requirement)

### Color Thresholds
| Range | Color | Pattern | Meaning |
|-------|-------|---------|---------|
| 80-100% | Green (#27ae60) | Solid | High confidence |
| 50-79% | Amber (#f39c12) | Striped | Medium confidence |
| 0-49% | Red (#e74c3c) | Dotted | Low confidence |

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| Numbers only | Harder to scan visually |
| Stars/ratings | Implies quality judgment, not confidence |
| Color only | Fails accessibility requirements |

### Implementation Approach
```vue
<!-- ConfidenceBar.vue pattern -->
<template>
  <div class="confidence-bar" :class="confidenceClass">
    <div class="bar-fill" :style="{ width: `${confidence}%` }">
      <span class="pattern-overlay" aria-hidden="true"></span>
    </div>
    <span class="sr-only">{{ confidence }}% confidence</span>
  </div>
</template>
```

---

## 7. Infinite Scrolling

### Decision: Virtual scrolling with pagination fallback

### Rationale
- Virtual scrolling handles 36,500 rows efficiently (renders only visible rows)
- Pagination toggle respects user preference
- VueUse `useVirtualList` or `vue-virtual-scroller` provides proven implementation

### Library Evaluation
| Library | Pros | Cons | Decision |
|---------|------|------|----------|
| `vue-virtual-scroller` | Feature-rich, well-maintained | Additional dependency | **Selected** |
| `@vueuse/core` useVirtualList | Built into VueUse | Less flexible | Backup option |
| Custom implementation | No dependencies | Maintenance burden | Rejected |

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| Load all rows | Performance issues at 36,500 rows |
| Pagination only | Less smooth browsing experience |
| Infinite scroll without virtualization | Memory issues with large DOM |

### Implementation Approach
```typescript
// useInfiniteScroll.ts pattern
const paginationStyle = useStorage<'infinite' | 'pages'>('pagination-style', 'pages')
const virtualListRef = ref<InstanceType<typeof RecycleScroller>>()

const { list, containerProps, wrapperProps } = useVirtualList(
  computed(() => filteredClassifications.value),
  { itemHeight: 56 }
)
```

---

## 8. Resizable Columns

### Decision: Drag handles with localStorage persistence

### Rationale
- Drag resizing is standard table UX pattern
- Persistence improves return-visit experience
- Minimum width (50px) prevents unusable columns

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| Fixed columns | Doesn't accommodate user preferences |
| Auto-fit only | Less control for users |
| No persistence | Users must resize every visit |

### Implementation Approach
```typescript
// useColumnResize.ts pattern
interface ColumnWidths {
  [columnId: string]: number
}

const columnWidths = useStorage<ColumnWidths>('column-widths', {
  subject: 300,
  category: 120,
  urgency: 100,
  confidence: 100,
  date: 150
})

const MIN_WIDTH = 50
```

---

## 9. Dark/Light Mode

### Decision: CSS custom properties with system preference detection

### Rationale
- CSS variables enable instant theme switching without re-render
- System preference detection (`prefers-color-scheme`) respects user OS settings
- localStorage persistence remembers explicit user choice

### Implementation Approach
```typescript
// useTheme.ts pattern
type Theme = 'light' | 'dark' | 'system'

const storedTheme = useStorage<Theme>('theme', 'system')
const systemDark = useMediaQuery('(prefers-color-scheme: dark)')

const activeTheme = computed(() => {
  if (storedTheme.value === 'system') {
    return systemDark.value ? 'dark' : 'light'
  }
  return storedTheme.value
})

watchEffect(() => {
  document.documentElement.setAttribute('data-theme', activeTheme.value)
})
```

### CSS Variables Structure
```css
:root {
  --bg-primary: #ffffff;
  --text-primary: #2c3e50;
  --border-color: #e0e0e0;
  /* ... */
}

[data-theme="dark"] {
  --bg-primary: #1a1a2e;
  --text-primary: #eaeaea;
  --border-color: #3d3d5c;
  /* ... */
}
```

---

## 10. Responsive Design

### Decision: Card layout below 768px with slide-out filters

### Rationale
- Tables are difficult to use on narrow screens
- Card layout presents information vertically
- Slide-out panel keeps filters accessible without consuming space
- Builds on mobile patterns from 004-inline-edit

### Breakpoints
| Breakpoint | Layout |
|------------|--------|
| ≥768px | Standard table with columns |
| <768px | Card-based list view |
| <480px | Compact card view with essential fields |

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| Horizontal scroll | Poor UX on mobile |
| Hide columns | Loses information |
| Separate mobile app | Maintenance overhead |

### Implementation Approach
```typescript
// In ClassificationList.vue
const isMobile = useMediaQuery('(max-width: 768px)')
const isFiltersOpen = ref(false)

// Conditional rendering
<template>
  <div v-if="isMobile">
    <MobileCardList :items="classifications" />
    <SlideOutFilters v-model:open="isFiltersOpen" />
  </div>
  <div v-else>
    <DataTable :items="classifications" />
  </div>
</template>
```

---

## 11. Analytics Dashboard Enhancements

### Decision: Extend existing ApexCharts with drill-down and export

### Rationale
- ApexCharts already used in existing analytics
- Built-in export functionality (PNG, SVG, CSV)
- Click events enable drill-down behavior

### New Charts
| Chart | Type | Data Source |
|-------|------|-------------|
| Corrections over time | Line/Area | correction_log grouped by date |
| Category distribution | Pie/Donut | classifications grouped by category |
| Accuracy trends | Line | calculated from corrections vs total |

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| Chart.js | Would require migration; ApexCharts already in use |
| D3.js | Over-engineered; steep learning curve |
| Server-side rendering | Adds backend complexity |

### Implementation Approach
```typescript
// analyticsService.ts pattern
async function getCorrectionTrends(dateRange: DateRange) {
  const { data } = await supabase
    .from('email_classifications')
    .select('created_at, corrected_category')
    .gte('created_at', dateRange.start)
    .lte('created_at', dateRange.end)

  return aggregateByDate(data)
}

// Drill-down via chart events
const chartOptions = {
  chart: {
    events: {
      dataPointSelection: (event, chartContext, config) => {
        showDrillDown(config.dataPointIndex)
      }
    }
  }
}
```

---

## Technology Summary

### New Dependencies Required
| Package | Purpose | Version |
|---------|---------|---------|
| `vue-virtual-scroller` | Virtual scrolling for infinite scroll | ^2.0.0-beta |

### Existing Dependencies Leveraged
| Package | Purpose | Already Installed |
|---------|---------|-------------------|
| `@vueuse/core` | useStorage, useMediaQuery, useMagicKeys | ✅ Yes |
| `apexcharts` | Charts for analytics | ✅ Yes |
| `@supabase/supabase-js` | Database operations | ✅ Yes |
| `pinia` | State management | ✅ Yes |

### Database Changes Required
- Add GIN index on `email_classifications` for full-text search
- No schema changes needed (uses existing tables)

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Performance degradation at scale | Medium | High | Virtual scrolling, server-side search |
| Accessibility issues in dark mode | Low | Medium | WCAG contrast validation in tests |
| Keyboard conflicts with browser | Low | Low | Use non-conflicting keys, allow override |
| Mobile touch target issues | Medium | Medium | 44px minimum, test on real devices |

---

## Conclusion

All research areas have been resolved with clear decisions, rationales, and implementation approaches. The feature is ready for Phase 1 design artifacts.

**Key Decisions Summary**:
1. Hybrid search: client <1,000, server ≥1,000 rows
2. localStorage persistence for all user preferences
3. Optimistic UI with per-item error handling for bulk ops
4. Virtual scrolling via `vue-virtual-scroller`
5. CSS custom properties for instant theme switching
6. Card layout for mobile (<768px)
7. ApexCharts extensions for analytics
