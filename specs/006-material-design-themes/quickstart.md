# Quickstart: Material Design 3 Theme Implementation

**Feature**: 006-material-design-themes
**Date**: 2025-11-25

## Overview

This guide explains how to implement and use the Material Design 3 (M3) theme system in the correction-ui application.

---

## File Structure

```
correction-ui/src/assets/themes/
├── tokens.css      # Token definitions (shared, from contracts/)
├── light.css       # Light theme values
└── dark.css        # Dark theme values
```

---

## Quick Reference

### Import Order (main.css)

```css
/* Base tokens (shared) */
@import './themes/tokens.css';

/* Theme-specific values (one applies based on class) */
@import './themes/light.css';
@import './themes/dark.css';

/* Base styles */
@import './base.css';
```

### Apply Theme

```typescript
// composables/useTheme.ts
const applyTheme = (theme: 'light' | 'dark') => {
  document.documentElement.classList.remove('light', 'dark');
  document.documentElement.classList.add(theme);
};
```

---

## Token Usage Guide

### Colors

| Use Case | Token |
|----------|-------|
| Page background | `var(--md-sys-color-surface)` |
| Card background | `var(--md-sys-color-surface-container)` |
| Primary text | `var(--md-sys-color-on-surface)` |
| Secondary text | `var(--md-sys-color-on-surface-variant)` |
| Primary button | `var(--md-sys-color-primary)` |
| Button text | `var(--md-sys-color-on-primary)` |
| Error state | `var(--md-sys-color-error)` |
| Border | `var(--md-sys-color-outline)` |
| Subtle border | `var(--md-sys-color-outline-variant)` |

### Surface Elevation

```css
/* Low emphasis container */
.card-low {
  background-color: var(--md-sys-color-surface-container-low);
}

/* Default container */
.card {
  background-color: var(--md-sys-color-surface-container);
}

/* High emphasis (modal, dropdown) */
.modal {
  background-color: var(--md-sys-color-surface-container-high);
}

/* Highest emphasis (tooltip) */
.tooltip {
  background-color: var(--md-sys-color-surface-container-highest);
}
```

### Interactive States

```css
.button {
  background-color: var(--md-sys-color-primary);
  color: var(--md-sys-color-on-primary);
  border-radius: var(--md-sys-shape-corner-small);
  transition: var(--md-sys-theme-transition);
}

/* State layer for hover/focus */
.button:hover {
  background-color: color-mix(
    in srgb,
    var(--md-sys-color-primary) 92%,
    var(--md-sys-color-on-primary)
  );
}

.button:focus-visible {
  outline: 2px solid var(--md-sys-color-primary);
  outline-offset: 2px;
}
```

### Category Badges

```css
.badge-kids {
  background-color: var(--md-ext-color-badge-kids);
  color: var(--md-ext-color-badge-kids-text);
}

.badge-work {
  background-color: var(--md-ext-color-badge-work);
  color: var(--md-ext-color-badge-work-text);
}
/* etc. */
```

### Urgency Badges

```css
.urgency-high {
  background-color: var(--md-ext-color-urgency-high);
  color: var(--md-ext-color-urgency-high-text);
}

.urgency-medium {
  background-color: var(--md-ext-color-urgency-medium);
  color: var(--md-ext-color-urgency-medium-text);
}

.urgency-low {
  background-color: var(--md-ext-color-urgency-low);
  color: var(--md-ext-color-urgency-low-text);
}
```

### Typography

```css
.page-title {
  font-size: var(--md-sys-typescale-headline-large-size);
  line-height: var(--md-sys-typescale-headline-large-line-height);
  font-weight: var(--md-sys-typescale-headline-large-weight);
}

.card-title {
  font-size: var(--md-sys-typescale-title-medium-size);
  line-height: var(--md-sys-typescale-title-medium-line-height);
  font-weight: var(--md-sys-typescale-title-medium-weight);
}

.body-text {
  font-size: var(--md-sys-typescale-body-medium-size);
  line-height: var(--md-sys-typescale-body-medium-line-height);
}

.caption {
  font-size: var(--md-sys-typescale-label-small-size);
  color: var(--md-sys-color-on-surface-variant);
}
```

### Shape (Border Radius)

```css
.chip {
  border-radius: var(--md-sys-shape-corner-extra-small);
}

.button {
  border-radius: var(--md-sys-shape-corner-small);
}

.card {
  border-radius: var(--md-sys-shape-corner-medium);
}

.dialog {
  border-radius: var(--md-sys-shape-corner-large);
}

.pill {
  border-radius: var(--md-sys-shape-corner-full);
}
```

---

## Migration Cheatsheet

Replace old tokens with new M3 tokens:

| Old Token | New Token |
|-----------|-----------|
| `var(--bg-primary)` | `var(--md-sys-color-surface)` |
| `var(--bg-secondary)` | `var(--md-sys-color-surface-container)` |
| `var(--bg-tertiary)` | `var(--md-sys-color-surface-container-high)` |
| `var(--text-primary)` | `var(--md-sys-color-on-surface)` |
| `var(--text-secondary)` | `var(--md-sys-color-on-surface-variant)` |
| `var(--color-primary)` | `var(--md-sys-color-primary)` |
| `var(--color-danger)` | `var(--md-sys-color-error)` |
| `var(--border-primary)` | `var(--md-sys-color-outline)` |
| `var(--border-secondary)` | `var(--md-sys-color-outline-variant)` |

---

## ApexCharts Integration

```typescript
// composables/useChartTheme.ts
import { computed } from 'vue';

export function useChartTheme() {
  const getColor = (varName: string): string => {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(varName)
      .trim();
  };

  const chartColors = computed(() => ({
    primary: getColor('--md-sys-color-primary'),
    secondary: getColor('--md-sys-color-secondary'),
    tertiary: getColor('--md-sys-color-tertiary'),
    error: getColor('--md-sys-color-error'),
    surface: getColor('--md-sys-color-surface'),
    onSurface: getColor('--md-sys-color-on-surface'),
    outline: getColor('--md-sys-color-outline'),
  }));

  const chartOptions = computed(() => ({
    chart: {
      background: chartColors.value.surface,
      foreColor: chartColors.value.onSurface,
    },
    grid: {
      borderColor: chartColors.value.outline,
    },
    colors: [
      chartColors.value.primary,
      chartColors.value.secondary,
      chartColors.value.tertiary,
    ],
  }));

  return { chartColors, chartOptions };
}
```

---

## Testing

### Accessibility Check

```bash
# Run Lighthouse accessibility audit
npx lighthouse http://localhost:5173 --only-categories=accessibility --output=json
```

### Visual Regression

```typescript
// tests/e2e/theme.spec.ts
import { test, expect } from '@playwright/test';

test('light theme renders correctly', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
  });
  await expect(page).toHaveScreenshot('light-theme.png');
});

test('dark theme renders correctly', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    document.documentElement.classList.remove('light');
    document.documentElement.classList.add('dark');
  });
  await expect(page).toHaveScreenshot('dark-theme.png');
});

test('theme toggle transitions smoothly', async ({ page }) => {
  await page.goto('/');
  const toggle = page.locator('[data-testid="theme-toggle"]');
  await toggle.click();
  // Verify no layout shift
  await expect(page.locator('main')).toBeVisible();
});
```

### Contrast Verification

```typescript
// utils/contrastCheck.ts
export function getContrastRatio(color1: string, color2: string): number {
  const luminance = (hex: string): number => {
    const rgb = parseInt(hex.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = rgb & 0xff;
    const [rs, gs, bs] = [r, g, b].map(c => {
      c /= 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const l1 = luminance(color1);
  const l2 = luminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Usage: getContrastRatio('#6750A4', '#FFFFFF') >= 4.5
```

---

## Common Patterns

### Card Component

```vue
<template>
  <div class="card">
    <h3 class="card-title">{{ title }}</h3>
    <p class="card-body">{{ content }}</p>
  </div>
</template>

<style scoped>
.card {
  background-color: var(--md-sys-color-surface-container);
  border-radius: var(--md-sys-shape-corner-medium);
  padding: 16px;
  transition: var(--md-sys-theme-transition);
}

.card-title {
  color: var(--md-sys-color-on-surface);
  font-size: var(--md-sys-typescale-title-medium-size);
  margin-bottom: 8px;
}

.card-body {
  color: var(--md-sys-color-on-surface-variant);
  font-size: var(--md-sys-typescale-body-medium-size);
}
</style>
```

### Button Variants

```css
/* Filled Button */
.btn-filled {
  background-color: var(--md-sys-color-primary);
  color: var(--md-sys-color-on-primary);
  border: none;
  padding: 10px 24px;
  border-radius: var(--md-sys-shape-corner-small);
}

/* Outlined Button */
.btn-outlined {
  background-color: transparent;
  color: var(--md-sys-color-primary);
  border: 1px solid var(--md-sys-color-outline);
  padding: 10px 24px;
  border-radius: var(--md-sys-shape-corner-small);
}

/* Text Button */
.btn-text {
  background-color: transparent;
  color: var(--md-sys-color-primary);
  border: none;
  padding: 10px 12px;
  border-radius: var(--md-sys-shape-corner-small);
}
```

### Input Field

```css
.input {
  background-color: var(--md-sys-color-surface-container-low);
  border: 1px solid var(--md-sys-color-outline);
  border-radius: var(--md-sys-shape-corner-small);
  color: var(--md-sys-color-on-surface);
  padding: 12px 16px;
  font-size: var(--md-sys-typescale-body-large-size);
  transition: var(--md-sys-theme-transition);
}

.input:focus {
  border-color: var(--md-sys-color-primary);
  outline: none;
}

.input::placeholder {
  color: var(--md-sys-color-on-surface-variant);
}
```

---

## Troubleshooting

### Colors not updating on theme switch

Ensure the theme class is on `:root` (html element):

```typescript
document.documentElement.classList.add('dark');
// NOT document.body.classList.add('dark');
```

### Flash of unstyled content (FOUC)

Add theme class before page renders:

```html
<!-- index.html -->
<script>
  const theme = localStorage.getItem('app-theme-preference') || 'system';
  if (theme === 'dark' || (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.add('light');
  }
</script>
```

### Charts not updating with theme

Watch for theme changes and re-render:

```typescript
watch(isDark, () => {
  // Force chart re-render after theme transition
  setTimeout(() => chart.value?.updateOptions(chartOptions.value), 350);
});
```
