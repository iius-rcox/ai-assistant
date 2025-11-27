# Quickstart Guide: Shadcn Blue Theme and Pagination

**Feature**: 010-shadcn-blue-theme
**Date**: 2025-11-26

## Overview

This guide covers implementing the shadcn blue theme and pagination component for the correction-ui application.

## Prerequisites

- Node.js 20.19+ or 22.12+
- Existing correction-ui project running
- Familiarity with Vue 3 Composition API and CSS custom properties

## Part 1: Theme Implementation

### Step 1: Update CSS Token Declarations

Add shadcn tokens to `src/assets/themes/tokens.css`:

```css
:root {
  /* Shadcn Core Tokens */
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 47.4% 11.2%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 221.2 83.2% 53.3%;
  --radius: 0.5rem;
  --chart-1: 12 76% 61%;
  --chart-2: 173 58% 39%;
  --chart-3: 197 37% 24%;
  --chart-4: 43 74% 66%;
  --chart-5: 27 87% 67%;
}
```

### Step 2: Update Light Theme Values

Update `src/assets/themes/light.css` to map M3 tokens to shadcn values:

```css
:root.light {
  /* Map M3 tokens to shadcn blue palette */
  --md-sys-color-primary: hsl(var(--primary));
  --md-sys-color-on-primary: hsl(var(--primary-foreground));
  --md-sys-color-surface: hsl(var(--background));
  --md-sys-color-on-surface: hsl(var(--foreground));
  /* ... continue for all tokens */
}
```

### Step 3: Update Dark Theme Values

Update `src/assets/themes/dark.css`:

```css
:root.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --primary: 217.2 91.2% 59.8%;
  /* ... all dark theme values */
}
```

### Step 4: Test Theme Switching

```bash
cd correction-ui
npm run dev
```

1. Open browser to http://localhost:5173
2. Click theme toggle
3. Verify colors match specification

## Part 2: Pagination Component

### Step 1: Create Component Files

```bash
mkdir -p src/components/ui/pagination
```

### Step 2: Create usePagination Composable

Create `src/composables/usePagination.ts`:

```typescript
import { computed, type Ref, toValue } from 'vue'
import type { PaginationItem, UsePaginationReturn } from '@/types/pagination'

export function usePagination(
  currentPage: Ref<number>,
  totalPages: Ref<number> | number,
  options: { siblingCount?: number; showEdges?: boolean } = {}
): UsePaginationReturn {
  const { siblingCount = 1, showEdges = true } = options

  const items = computed<PaginationItem[]>(() => {
    const total = toValue(totalPages)
    const current = currentPage.value
    const result: PaginationItem[] = []

    // Always add previous
    result.push({
      type: 'previous',
      isDisabled: current <= 1
    })

    // Calculate page range
    // ... (implementation details in tasks)

    // Always add next
    result.push({
      type: 'next',
      isDisabled: current >= total
    })

    return result
  })

  // ... implement navigation methods

  return {
    items,
    hasPrevious: computed(() => currentPage.value > 1),
    hasNext: computed(() => currentPage.value < toValue(totalPages)),
    goToPage: (page) => { /* ... */ },
    goToPrevious: () => { /* ... */ },
    goToNext: () => { /* ... */ },
    goToFirst: () => { /* ... */ },
    goToLast: () => { /* ... */ },
    range: computed(() => ({ start: 1, end: toValue(totalPages) }))
  }
}
```

### Step 3: Create Root Pagination Component

Create `src/components/ui/pagination/Pagination.vue`:

```vue
<script setup lang="ts">
import { provide } from 'vue'
import type { PaginationProps } from '@/types/pagination'

const props = withDefaults(defineProps<PaginationProps>(), {
  siblingCount: 1,
  showEdges: true,
  disabled: false,
  size: 'default'
})

const emit = defineEmits<{
  'update:currentPage': [page: number]
  'change': [page: number]
}>()

provide('pagination', {
  currentPage: () => props.currentPage,
  totalPages: () => props.totalPages,
  disabled: () => props.disabled,
  size: () => props.size,
  onPageChange: (page: number) => {
    emit('update:currentPage', page)
    emit('change', page)
  }
})
</script>

<template>
  <nav aria-label="pagination" class="pagination">
    <slot />
  </nav>
</template>

<style scoped>
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
```

### Step 4: Create Sub-components

Create remaining components following the pattern in data-model.md:
- PaginationContent.vue
- PaginationItem.vue
- PaginationLink.vue
- PaginationPrevious.vue
- PaginationNext.vue
- PaginationEllipsis.vue

### Step 5: Integrate with ClassificationList

Update `src/components/ClassificationList.vue`:

```vue
<script setup>
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis
} from '@/components/ui/pagination'
import { usePagination } from '@/composables/usePagination'

const { items } = usePagination(
  computed(() => store.currentPage),
  computed(() => store.pageCount)
)
</script>

<template>
  <Pagination
    v-model:current-page="store.currentPage"
    :total-pages="store.pageCount"
    @change="handlePageChange"
  >
    <PaginationContent>
      <PaginationItem v-for="item in items" :key="item.type + item.page">
        <PaginationPrevious v-if="item.type === 'previous'" />
        <PaginationLink v-else-if="item.type === 'page'" :page="item.page" />
        <PaginationEllipsis v-else-if="item.type === 'ellipsis'" />
        <PaginationNext v-else-if="item.type === 'next'" />
      </PaginationItem>
    </PaginationContent>
  </Pagination>
</template>
```

## Verification

### Theme Verification

1. **Light Mode**: Primary blue should be `hsl(221.2, 83.2%, 53.3%)` ≈ #3B82F6
2. **Dark Mode**: Background should be `hsl(222.2, 84%, 4.9%)` ≈ #030712
3. **Transitions**: Theme switch should animate smoothly (300ms)
4. **Charts**: Should update colors when theme changes

### Pagination Verification

1. **Navigation**: Previous/Next buttons work correctly
2. **Direct Links**: Page number clicks navigate correctly
3. **Ellipsis**: Shows when page count > 7
4. **Active State**: Current page is highlighted
5. **Disabled States**: Previous disabled on page 1, Next disabled on last page
6. **Keyboard**: Tab navigation and Enter/Space activation work

### Accessibility Verification

1. Screen reader announces "pagination navigation"
2. Current page announced with "page" role
3. Disabled buttons announce disabled state
4. Focus ring visible on all interactive elements

## Troubleshooting

### Theme not applying

1. Check that `tokens.css` loads before `light.css` and `dark.css`
2. Verify document element has correct class (`light` or `dark`)
3. Check browser DevTools for CSS variable values

### Pagination not rendering

1. Verify all sub-components are properly imported
2. Check that totalPages > 0
3. Ensure currentPage is within valid range

### Colors look wrong

1. Verify HSL values don't include `hsl()` wrapper
2. Check for CSS specificity conflicts
3. Use DevTools to inspect computed colors
