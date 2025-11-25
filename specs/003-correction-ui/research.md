# Technical Research: Email Classification Correction UI

**Date**: 2025-11-22
**Feature Branch**: `003-correction-ui`
**Spec**: [spec.md](spec.md)

---

## Purpose

This research document resolves all "NEEDS CLARIFICATION" items from the Technical Context section of the implementation plan. It provides technology decisions, rationale, alternatives considered, and key dependencies for building a locally hosted correction UI.

---

## Research Questions

1. **Frontend Framework**: Which framework is best for this use case?
2. **Testing Strategy**: What testing tools and approach should we use?
3. **Charting Library**: Which library works best for correction pattern visualization?
4. **Language**: TypeScript vs JavaScript?

---

## Decision 1: Frontend Framework

### Selected: **Vue 3 + Vite**

### Rationale

Vue 3 with Vite provides the optimal balance for a small, locally-hosted correction UI with ~10-15 components, Supabase integration, and charting requirements:

1. **Setup Simplicity**: One-command scaffolding (`npm create vue@latest`), intuitive single-file components
2. **Supabase Integration**: Official documentation, `@supabase/supabase-js` works seamlessly with Composition API
3. **Charting Support**: `vue3-apexcharts` official wrapper with reactive updates
4. **Bundle Size**: 34KB compressed (smaller than React's 42.2KB)
5. **Development Speed**: Built-in router/state management, template syntax approachable for single developer

### Alternatives Considered

- **Svelte + Vite**: Smallest bundle (9.7KB), minimal boilerplate
  - Rejected: Smaller ecosystem for charting libraries, svelte-chartjs requires workarounds

- **React + Vite**: Largest ecosystem, industry standard
  - Rejected: More verbose with hooks, 42.2KB bundle larger than needed for small app

### Key Dependencies

```json
{
  "dependencies": {
    "vue": "^3.4",
    "@supabase/supabase-js": "^2.45",
    "vue-router": "^4.3",
    "pinia": "^2.1"
  },
  "devDependencies": {
    "vite": "^5.4",
    "@vitejs/plugin-vue": "^5.1"
  }
}
```

---

## Decision 2: Testing Strategy

### Selected: **Vitest + Vue Testing Library + Playwright**

### Three-Tier Approach

**Tier 1: Component Unit Tests (Vitest + Vue Testing Library)**
- Vitest is the official testing framework for Vite projects with native ESM support
- Vue Testing Library encourages testing user behavior over implementation details
- 80% coverage of UI components (list, detail, filters, charts)

**Tier 2: Supabase Integration Tests (Vitest + MSW)**
- Mock Service Worker intercepts Supabase REST API calls at network level
- Tests verify pagination, filtering, error handling
- Critical paths only: fetch classifications, save corrections

**Tier 3: E2E Smoke Tests (Playwright)**
- 35-45% faster execution than Cypress
- 3-5 critical user journeys: view list, inline edit, apply filters, view analytics
- Native parallel execution

### Alternatives Considered

- **Jest**: Industry standard, mature
  - Rejected: Slower than Vitest, requires additional Vite/ESM configuration

- **Cypress**: Excellent visual debugging
  - Rejected: Slower than Playwright, component testing less mature

### Key Dependencies

```json
{
  "devDependencies": {
    "vitest": "^2.0",
    "@vue/test-utils": "^2.4",
    "@testing-library/vue": "^8.1",
    "msw": "^2.4",
    "@playwright/test": "^1.48"
  }
}
```

---

## Decision 3: Charting Library

### Selected: **ApexCharts (vue3-apexcharts)**

### Rationale

ApexCharts provides the best features for correction pattern visualization:

1. **Vue 3 Integration**: Official `vue3-apexcharts` package with reactive updates
2. **Chart Types**: Line (correction rate over time), bar (category distribution), mixed charts
3. **Performance**: Optimized for large datasets, SVG-based crisp rendering
4. **Developer Experience**: Extensive documentation, built-in tooltips/legends/export, responsive by default

### Alternatives Considered

- **Chart.js + vue-chartjs**: Lightweight (34KB), canvas-based
  - Rejected: Less polished out-of-box, issues with very large datasets

- **ECharts**: Most powerful, handles millions of data points
  - Rejected: Larger bundle (400KB), overkill for this use case

### Key Dependencies

```json
{
  "dependencies": {
    "apexcharts": "^3.54",
    "vue3-apexcharts": "^1.6"
  }
}
```

### Sample Usage

```vue
<template>
  <apexchart
    type="line"
    :options="chartOptions"
    :series="correctionRateSeries"
    height="350"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'

const chartOptions = {
  chart: { id: 'correction-rate' },
  xaxis: { type: 'datetime' },
  title: { text: 'Correction Rate Over Time' }
}

const correctionRateSeries = computed(() => [{
  name: 'Corrections',
  data: props.corrections.map(c => [c.date, c.rate])
}])
</script>
```

---

## Decision 4: Language Choice

### Selected: **TypeScript**

### Rationale

TypeScript provides significant benefits with minimal overhead for this small tool:

1. **Supabase Type Generation**: CLI generates types from database schema (`supabase gen types typescript`)
2. **Vite Fast Compilation**: esbuild 20-30x faster than tsc, <500ms dev server start
3. **IDE Experience**: Autocomplete for Supabase client, inline documentation, refactoring support
4. **Error Prevention**: Catches bugs early, replaces need for pair programming review
5. **Minimal Overhead**: Vue 3's `<script setup lang="ts">` requires no extra boilerplate

### Tradeoffs

- **Setup Time**: +5 minutes (Vite templates include TypeScript by default)
- **Learning Curve**: Minimal if familiar with JavaScript
- **Build Step**: <2s full build for small project with esbuild
- **Flexibility**: Use `any` escape hatch for quick prototyping

### Alternatives Considered

- **Plain JavaScript**: Loses Supabase type generation, more runtime errors, degraded IDE autocomplete
- **JSDoc + TypeScript checking**: More verbose, inconsistent tooling

### Configuration

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "preserve",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*", "src/**/*.vue"]
}
```

---

## Complete Technology Stack

### Production Dependencies

```json
{
  "dependencies": {
    "vue": "^3.4.38",
    "vue-router": "^4.4.3",
    "pinia": "^2.2.2",
    "@supabase/supabase-js": "^2.45.4",
    "apexcharts": "^3.54.0",
    "vue3-apexcharts": "^1.6.0"
  }
}
```

### Development Dependencies

```json
{
  "devDependencies": {
    "vite": "^5.4.8",
    "@vitejs/plugin-vue": "^5.1.4",
    "typescript": "^5.6.2",
    "vue-tsc": "^2.1.6",
    "vitest": "^2.1.1",
    "@vue/test-utils": "^2.4.6",
    "@testing-library/vue": "^8.1.0",
    "msw": "^2.4.9",
    "@playwright/test": "^1.48.0",
    "@types/node": "^22.7.4"
  }
}
```

### Estimated Bundle Size

| Component | Size (gzipped) |
|-----------|----------------|
| Vue 3 runtime | ~34 KB |
| Vue Router | ~8 KB |
| Pinia | ~2 KB |
| Supabase JS | ~15 KB |
| ApexCharts | ~70 KB |
| Application code | ~20 KB |
| **Total** | **~150 KB** |

---

## Performance Validation

### Meeting <2 Second Load Time Requirement

With 10,000 classifications:

1. **Pagination**: Load 50 records per page via Supabase `.range()` - instant response
2. **Virtual Scrolling**: Not needed with server-side pagination
3. **Chart Aggregation**: Pre-aggregate time-series data in SQL queries (daily/weekly buckets)
4. **Initial Load**: 150KB bundle loads in <500ms on localhost

### Keyboard Navigation Support

Vue 3 provides:
- Native `@keydown` event handlers
- `tabindex` management for focusable elements
- Arrow key navigation for list items
- Escape/Enter patterns for modals and inline editing

---

## Setup Instructions Preview

```bash
# Create project
npm create vue@latest correction-ui -- --typescript

# Install dependencies
cd correction-ui
npm install @supabase/supabase-js apexcharts vue3-apexcharts pinia

# Install dev dependencies
npm install -D vitest @vue/test-utils @testing-library/vue msw @playwright/test

# Configure environment
echo "VITE_SUPABASE_URL=your-url" > .env
echo "VITE_SUPABASE_ANON_KEY=your-key" >> .env

# Start development
npm run dev
```

---

## Technical Context Update

The following "NEEDS CLARIFICATION" items are now resolved:

- **Language/Version**: TypeScript 5.6+ with Vue 3.4+ (ES2022 target)
- **Primary Dependencies**: Vue 3, Vite, Supabase JS, ApexCharts, Pinia
- **Testing**: Vitest (component/integration tests) + Playwright (E2E smoke tests)

---

## References

- [React vs Vue vs Svelte 2025 - Medium](https://medium.com/@ignatovich.dm/react-vs-vue-vs-svelte-choosing-the-right-framework-for-2025-4f4bb9da35b4)
- [Supabase Getting Started Docs](https://supabase.com/docs/guides/getting-started)
- [Vitest Component Testing Guide](https://vitest.dev/guide/browser/component-testing)
- [Playwright vs Cypress 2025 - Frugal Testing](https://www.frugaltesting.com/blog/playwright-vs-cypress-the-ultimate-2025-e2e-testing-showdown)
- [vue3-apexcharts - GitHub](https://github.com/apexcharts/vue3-apexcharts)
- [TypeScript vs JavaScript 2025 - Carmatec](https://www.carmatec.com/blog/typescript-vs-javascript-which-one-to-choose/)
