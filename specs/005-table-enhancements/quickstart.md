# Quickstart Guide: Email Classifications Table Enhancements

**Feature**: 005-table-enhancements
**Date**: 2025-11-24

## Prerequisites

Before starting implementation, ensure:

1. **Existing codebase**: Features 003-correction-ui and 004-inline-edit are complete
2. **Development environment**: Node.js 18+, npm 9+
3. **Dependencies installed**: Run `npm install` in `correction-ui/`
4. **Supabase access**: Connection to project `xmziovusqlmgygcrgyqt`

## Setup Steps

### 1. Database Setup (One-time)

Run this SQL in Supabase SQL Editor to enable full-text search:

```sql
-- Enable trigram extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create full-text search index
CREATE INDEX IF NOT EXISTS idx_emails_search
ON emails USING GIN (
  to_tsvector('english', coalesce(subject, '') || ' ' || coalesce(sender, '') || ' ' || coalesce(body, ''))
);

-- Create search RPC function
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

### 2. Install New Dependency

```bash
cd correction-ui
npm install vue-virtual-scroller@next
```

### 3. Create Feature Branch

```bash
git checkout -b 005-table-enhancements
```

---

## Implementation Order

Follow this order to ensure proper dependency resolution:

### Phase 1: Foundation (P1 Features)

1. **Types & Constants** (~30 min)
   - Create `src/types/table-enhancements.ts`
   - Create `src/constants/table.ts`

2. **Search Feature** (~2 hours)
   - Create `src/composables/useSearch.ts`
   - Create `src/services/searchService.ts`
   - Create `src/components/SearchInput.vue`
   - Integrate into `ClassificationList.vue`

3. **Sort Feature** (~1.5 hours)
   - Create `src/composables/useSort.ts`
   - Create `src/components/ColumnHeader.vue`
   - Integrate sorting into table

### Phase 2: Selection & Actions (P2 Features)

4. **Bulk Actions** (~2.5 hours)
   - Create `src/composables/useBulkActions.ts`
   - Create `src/components/BulkActionToolbar.vue`
   - Extend `classificationService.ts` for bulk updates
   - Add selection checkboxes to table

5. **Expandable Rows** (~2 hours)
   - Create `src/composables/useExpandableRows.ts`
   - Create `src/components/ExpandableRowDetails.vue`
   - Add expand/collapse to table rows

6. **Keyboard Navigation** (~1.5 hours)
   - Create `src/composables/useKeyboardNavigation.ts`
   - Create `src/components/KeyboardShortcutsModal.vue`
   - Register global shortcuts

7. **Confidence Indicators** (~1 hour)
   - Create `src/components/ConfidenceBar.vue`
   - Replace numeric confidence with visual bars

### Phase 3: UX Enhancements (P3 Features)

8. **Infinite Scroll** (~2 hours)
   - Create `src/composables/useInfiniteScroll.ts`
   - Create `src/components/InfiniteScroller.vue`
   - Add pagination style toggle

9. **Column Resize** (~1.5 hours)
   - Create `src/composables/useColumnResize.ts`
   - Add resize handles to ColumnHeader

10. **Theme Toggle** (~1.5 hours)
    - Create `src/composables/useTheme.ts`
    - Create `src/components/ThemeToggle.vue`
    - Create `src/assets/themes/` CSS variables
    - Add toggle to header

11. **Responsive Enhancements** (~2 hours)
    - Enhance mobile card layout
    - Create slide-out filter panel
    - Test on mobile devices

12. **Analytics Dashboard** (~2.5 hours)
    - Extend `analyticsService.ts`
    - Add new charts to Analytics tab
    - Implement drill-down and export

---

## Quick Start: First Component

Start with the simplest component to verify setup:

### ConfidenceBar.vue

```vue
<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  value: number
  showLabel?: boolean
}>()

const level = computed(() => {
  if (props.value >= 80) return 'high'
  if (props.value >= 50) return 'medium'
  return 'low'
})

const color = computed(() => ({
  high: '#27ae60',
  medium: '#f39c12',
  low: '#e74c3c'
}[level.value]))
</script>

<template>
  <div
    class="confidence-bar"
    :class="`confidence-${level}`"
    role="progressbar"
    :aria-valuenow="value"
    aria-valuemin="0"
    aria-valuemax="100"
  >
    <div
      class="bar-fill"
      :style="{ width: `${value}%`, backgroundColor: color }"
    />
    <span v-if="showLabel" class="label">{{ value }}%</span>
    <span class="sr-only">{{ value }}% confidence</span>
  </div>
</template>

<style scoped>
.confidence-bar {
  position: relative;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

/* Accessibility patterns */
.confidence-low .bar-fill {
  background-image: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 2px,
    rgba(255,255,255,0.3) 2px,
    rgba(255,255,255,0.3) 4px
  );
}

.confidence-medium .bar-fill {
  background-image: repeating-linear-gradient(
    90deg,
    transparent,
    transparent 3px,
    rgba(255,255,255,0.2) 3px,
    rgba(255,255,255,0.2) 6px
  );
}

.label {
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 10px;
  font-weight: 600;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
}
</style>
```

### Test the Component

```vue
<!-- In ClassificationList.vue, replace confidence number -->
<ConfidenceBar
  :value="classification.confidence"
  show-label
/>
```

---

## Verification Checklist

After each implementation phase, verify:

- [ ] TypeScript compiles without errors (`npm run build`)
- [ ] Component renders correctly in browser
- [ ] Feature works on desktop and mobile
- [ ] Keyboard navigation functions
- [ ] Screen reader announces state changes
- [ ] localStorage persistence works (refresh page)
- [ ] Performance is acceptable (no visible lag)

---

## Common Issues

### Search not working
- Verify Supabase RPC function is created
- Check `searchService.ts` is using correct threshold (1,000)
- Ensure debounce is working (check network tab)

### Sort not persisting
- Verify `useStorage` key matches constant
- Check localStorage in DevTools > Application
- Clear storage and retry

### Bulk action fails
- Check Supabase RLS policies allow updates
- Verify IDs are valid classification IDs
- Check for optimistic lock conflicts

### Theme not applying
- Verify `data-theme` attribute on `<html>`
- Check CSS variables are defined for both themes
- Ensure no inline styles override theme colors

---

## Resources

- [Vue 3 Composition API](https://vuejs.org/guide/extras/composition-api-faq.html)
- [VueUse Documentation](https://vueuse.org/)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript)
- [vue-virtual-scroller](https://github.com/Akryum/vue-virtual-scroller)
- [ApexCharts Vue](https://apexcharts.com/docs/vue-charts/)

---

## Next Steps

After completing implementation:

1. Run `/speckit.tasks` to generate detailed task breakdown
2. Run `/speckit.implement` to execute tasks
3. Run `/speckit.analyze` to verify cross-artifact consistency
